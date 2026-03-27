"""
Kyneto ML Model Training
========================
Trains XGBoost, CatBoost, and CART models for provider reliability classification
and failure prediction. Supports training from:
  1. Live PostgreSQL database (preferred — real node data)
  2. CSV fallback (synthetic data from simulator)
"""

import pandas as pd
import numpy as np
import os
import pickle
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score

# Try to import XGBoost, fallback to RandomForest if not available
try:
    from xgboost import XGBClassifier
    HAS_XGBOOST = True
except ImportError:
    from sklearn.ensemble import RandomForestClassifier
    HAS_XGBOOST = False
    print("[WARN] XGBoost not installed, using RandomForest as fallback")

# Try to import CatBoost
try:
    from catboost import CatBoostClassifier
    HAS_CATBOOST = True
except ImportError:
    HAS_CATBOOST = False
    print("[WARN] CatBoost not installed")

# Paths
DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
MODELS_DIR = os.path.join(os.path.dirname(__file__), 'models')
TRAINING_FILE = os.path.join(DATA_DIR, 'training_data_v2.csv')

os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(DATA_DIR, exist_ok=True)


def load_from_database():
    """
    Load live provider data from PostgreSQL.
    Joins providers, capacity_pledges, proof_misses, slashing_events, and deals
    to build a complete feature set for each provider.
    """
    db_url = os.environ.get('DATABASE_URL')
    if not db_url:
        print("   [WARN] DATABASE_URL not set, cannot load from database")
        return None

    try:
        import psycopg2
        conn = psycopg2.connect(db_url)

        query = """
            SELECT
                p.address AS provider_id,
                p.reputation_score,
                p.region,
                p.active,
                p.registered_at,
                p.last_heartbeat,
                p.last_proof_at,
                -- Aggregated capacity
                COALESCE(SUM(cp.capacity_gb), 0) AS capacity_gb,
                COALESCE(SUM(cp.utilization_gb), 0) AS utilization_gb,
                COALESCE(SUM(cp.collateral), 0) AS stake,
                -- Proof misses
                COALESCE(pm.proof_miss_count, 0) AS proof_misses,
                -- Slashing events
                COALESCE(se.slash_count, 0) AS slashing_count,
                -- Deal stats
                COALESCE(d.total_deals, 0) AS total_deals,
                COALESCE(d.completed_deals, 0) AS completed_deals
            FROM providers p
            LEFT JOIN capacity_pledges cp ON cp.provider_address = p.address AND cp.active = true
            LEFT JOIN (
                SELECT provider_address, COUNT(*) AS proof_miss_count
                FROM proof_misses
                GROUP BY provider_address
            ) pm ON pm.provider_address = p.address
            LEFT JOIN (
                SELECT provider_address, COUNT(*) AS slash_count
                FROM slashing_events
                GROUP BY provider_address
            ) se ON se.provider_address = p.address
            LEFT JOIN (
                SELECT
                    s.provider_address,
                    COUNT(DISTINCT s.deal_id) AS total_deals,
                    COUNT(DISTINCT s.deal_id) FILTER (WHERE dl.status = 'completed') AS completed_deals
                FROM shards s
                JOIN deals dl ON dl.deal_id = s.deal_id
                GROUP BY s.provider_address
            ) d ON d.provider_address = p.address
            GROUP BY p.address, p.reputation_score, p.region, p.active,
                     p.registered_at, p.last_heartbeat, p.last_proof_at,
                     pm.proof_miss_count, se.slash_count,
                     d.total_deals, d.completed_deals
        """

        df = pd.read_sql(query, conn)
        conn.close()

        if df.empty:
            print("   [WARN] No providers found in database")
            return None

        print(f"   [DB] Loaded {len(df)} providers from live database")

        # Derive features from raw DB data
        now = pd.Timestamp.now()

        df['node_age_days'] = (now - pd.to_datetime(df['registered_at'])).dt.days.fillna(1).clip(lower=1)

        # Uptime estimate: if heartbeat was within last 5 minutes, node is online
        df['last_heartbeat'] = pd.to_datetime(df['last_heartbeat'])
        heartbeat_age_mins = (now - df['last_heartbeat']).dt.total_seconds() / 60
        df['uptime_pct'] = np.where(heartbeat_age_mins <= 5, 1.0,
                           np.where(heartbeat_age_mins <= 60, 0.9,
                           np.where(heartbeat_age_mins <= 1440, 0.5, 0.1)))
        df.loc[df['last_heartbeat'].isna(), 'uptime_pct'] = 0.0

        # Post success rate
        df['post_success_rate'] = np.where(
            df['total_deals'] > 0,
            df['completed_deals'] / df['total_deals'],
            1.0  # No deals yet = no failures
        )

        # Avg latency placeholder (will improve as we collect real latency data)
        df['avg_latency'] = 100.0  # Default baseline

        # Failure label: a provider is "failed" if slashed OR inactive with missed proofs
        df['is_failed'] = (
            (df['slashing_count'] >= 2) |
            ((df['active'] == False) & (df['proof_misses'] >= 3))
        ).astype(int)

        return df

    except Exception as e:
        print(f"   [ERROR] Database load failed: {e}")
        return None


def load_from_csv():
    """Load prepared training data from CSV fallback."""
    if not os.path.exists(TRAINING_FILE):
        return None

    df = pd.read_csv(TRAINING_FILE)
    print(f"   [CSV] Loaded {len(df)} records from {TRAINING_FILE}")
    return df


def load_training_data():
    """Load training data, preferring live database over CSV."""
    print("[DIR] Loading training data...")

    # Try database first (live data)
    df = load_from_database()
    if df is not None and len(df) >= 5:
        return df

    # Fallback to CSV
    df = load_from_csv()
    if df is not None:
        return df

    raise FileNotFoundError("No training data available. Need either DATABASE_URL or CSV data.")


def prepare_features_target(df: pd.DataFrame, target_col: str):
    """Prepare feature matrix X and target vector y."""
    exclude_cols = ['provider_id', 'is_failed', 'reliability_tier',
                    'address', 'registered_at', 'last_heartbeat', 'last_proof_at',
                    'active', 'region', 'total_deals', 'completed_deals',
                    'reputation_score']
    feature_cols = [c for c in df.columns if c not in exclude_cols and df[c].dtype in ['int64', 'float64', 'int32', 'float32']]

    X = df[feature_cols].copy()
    X = X.fillna(0)

    if target_col not in df.columns:
        raise ValueError(f"Target column '{target_col}' not found in data")

    y = df[target_col]
    if y.dtype == bool:
        y = y.astype(int)
    elif y.dtype == object:
        y = pd.Categorical(y).codes

    return X, y, feature_cols


def derive_reliability_tier(df: pd.DataFrame) -> pd.DataFrame:
    """Compute reliability_tier from risk_score."""
    # Risk score
    df['utilization_ratio'] = (df.get('utilization_gb', pd.Series(0)) / df.get('capacity_gb', pd.Series(1)).clip(lower=1)).fillna(0).clip(0, 1)
    df['stake_per_gb'] = (df.get('stake', pd.Series(0)) / df.get('capacity_gb', pd.Series(1)).clip(lower=1)).replace([np.inf, -np.inf], 0).fillna(0)
    df['risk_score'] = (
        (1 - df.get('uptime_pct', pd.Series(1))) * 30 +
        (1 - df.get('post_success_rate', pd.Series(1))) * 40 +
        df.get('proof_misses', pd.Series(0)) * 2 +
        df.get('slashing_count', pd.Series(0)) * 10
    ).clip(0, 100)

    df['reliability_tier'] = pd.cut(
        df['risk_score'],
        bins=[-1, 10, 25, 50, 100],
        labels=['platinum', 'gold', 'silver', 'bronze']
    )
    return df


def train_failure_prediction_model(df: pd.DataFrame):
    """Train binary classification model for failure prediction."""
    print("\n" + "=" * 50)
    print("[TARGET] Training Failure Prediction Model")
    print("=" * 50)

    X, y, feature_cols = prepare_features_target(df, 'is_failed')

    if y.nunique() < 2:
        print("   [WARN] Only one class present. Need both failed and healthy providers.")
        print("   Skipping failure model — will use rule-based fallback.")
        return None, None, None

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    print(f"   Training set: {len(X_train)} | Test set: {len(X_test)}")
    print(f"   Failure rate: {y.mean()*100:.1f}%")

    # Train XGBoost
    if HAS_XGBOOST:
        xgb_model = XGBClassifier(n_estimators=100, max_depth=5, learning_rate=0.1,
                                  random_state=42, use_label_encoder=False, eval_metric='logloss')
    else:
        xgb_model = RandomForestClassifier(n_estimators=100, max_depth=5, random_state=42)

    xgb_model.fit(X_train, y_train)
    xgb_pred = xgb_model.predict(X_test)
    print(f"   XGBoost Accuracy: {accuracy_score(y_test, xgb_pred)*100:.2f}%")

    # Train CART
    cart_model = DecisionTreeClassifier(max_depth=5, min_samples_split=10, random_state=42)
    cart_model.fit(X_train, y_train)
    cart_pred = cart_model.predict(X_test)
    print(f"   CART Accuracy: {accuracy_score(y_test, cart_pred)*100:.2f}%")

    # Train CatBoost
    catboost_model = None
    if HAS_CATBOOST:
        catboost_model = CatBoostClassifier(iterations=100, depth=5, learning_rate=0.1,
                                            random_seed=42, verbose=False)
        catboost_model.fit(X_train, y_train)
        cat_pred = catboost_model.predict(X_test)
        print(f"   CatBoost Accuracy: {accuracy_score(y_test, cat_pred)*100:.2f}%")

    # Save models
    with open(os.path.join(MODELS_DIR, 'xgboost_failure.pkl'), 'wb') as f:
        pickle.dump({'model': xgb_model, 'features': feature_cols}, f)
    with open(os.path.join(MODELS_DIR, 'cart_failure.pkl'), 'wb') as f:
        pickle.dump({'model': cart_model, 'features': feature_cols}, f)
    if catboost_model:
        with open(os.path.join(MODELS_DIR, 'catboost_failure.pkl'), 'wb') as f:
            pickle.dump({'model': catboost_model, 'features': feature_cols}, f)

    print(f"   [OK] Models saved to {MODELS_DIR}")
    return xgb_model, cart_model, catboost_model


def train_reliability_classification_model(df: pd.DataFrame):
    """Train multi-class classification model for reliability tier prediction."""
    print("\n" + "=" * 50)
    print("[TROPHY] Training Reliability Classification Model")
    print("=" * 50)

    if 'reliability_tier' not in df.columns:
        print("   [WARN] Skipping: reliability_tier column not found")
        return None, None, None

    X, y, feature_cols = prepare_features_target(df, 'reliability_tier')

    n_classes = y.nunique()
    if n_classes < 2:
        print(f"   [WARN] Only {n_classes} class(es) present. Need at least 2.")
        print("   Skipping reliability model — will use rule-based fallback.")
        return None, None, None

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    print(f"   Training set: {len(X_train)} | Test set: {len(X_test)} | Classes: {n_classes}")

    # Train XGBoost
    if HAS_XGBOOST:
        xgb_model = XGBClassifier(n_estimators=100, max_depth=5, learning_rate=0.1,
                                  random_state=42, use_label_encoder=False, eval_metric='mlogloss')
    else:
        xgb_model = RandomForestClassifier(n_estimators=100, max_depth=5, random_state=42)

    xgb_model.fit(X_train, y_train)
    xgb_pred = xgb_model.predict(X_test)
    print(f"   XGBoost Accuracy: {accuracy_score(y_test, xgb_pred)*100:.2f}%")

    # Train CART
    cart_model = DecisionTreeClassifier(max_depth=5, min_samples_split=10, random_state=42)
    cart_model.fit(X_train, y_train)
    cart_pred = cart_model.predict(X_test)
    print(f"   CART Accuracy: {accuracy_score(y_test, cart_pred)*100:.2f}%")

    # Train CatBoost
    catboost_model = None
    if HAS_CATBOOST:
        catboost_model = CatBoostClassifier(iterations=100, depth=5, learning_rate=0.1,
                                            random_seed=42, loss_function='MultiClass', verbose=False)
        catboost_model.fit(X_train, y_train)
        cat_pred = catboost_model.predict(X_test)
        print(f"   CatBoost Accuracy: {accuracy_score(y_test, cat_pred)*100:.2f}%")

    # Save models
    with open(os.path.join(MODELS_DIR, 'xgboost_reliability.pkl'), 'wb') as f:
        pickle.dump({'model': xgb_model, 'features': feature_cols}, f)
    with open(os.path.join(MODELS_DIR, 'cart_reliability.pkl'), 'wb') as f:
        pickle.dump({'model': cart_model, 'features': feature_cols}, f)
    if catboost_model:
        with open(os.path.join(MODELS_DIR, 'catboost_reliability.pkl'), 'wb') as f:
            pickle.dump({'model': catboost_model, 'features': feature_cols}, f)

    print(f"   [OK] Models saved to {MODELS_DIR}")
    return xgb_model, cart_model, catboost_model


def train_all():
    """Full training pipeline. Called at startup and by the auto-retrain scheduler."""
    print("[>] Kyneto ML Training Pipeline")
    print("=" * 50)

    df = load_training_data()

    # Ensure derived features exist
    df = derive_reliability_tier(df)

    train_failure_prediction_model(df)
    train_reliability_classification_model(df)

    print("\n" + "=" * 50)
    print("[OK] Training complete!")
    print("=" * 50)


if __name__ == '__main__':
    train_all()
