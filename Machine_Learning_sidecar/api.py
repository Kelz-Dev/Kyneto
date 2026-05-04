"""
Kyneto Sidecar API
==================
Flask-based API exposing prediction endpoints for provider reliability
and failure prediction. Automatically retrains models from live database
data every 6 hours.
"""

from flask import Flask, request, jsonify
from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
import pickle
import os
import json
import threading
import time
import io
import pandas as pd
import numpy as np
import hashlib
from datetime import datetime
import signal


class RestrictedUnpickler(pickle.Unpickler):
    """Restricted unpickler that only allows known-safe classes."""

    SAFE_MODULES = {
        'numpy.core.multiarray': {'_reconstruct', 'scalar', 'ndarray'},
        'numpy': {'ndarray', 'dtype'},
        'pandas.core.frame': {'DataFrame'},
        'pandas.core.series': {'Series'},
        'sklearn.ensemble._forest': {'RandomForestClassifier', 'RandomForestRegressor'},
        'sklearn.tree._tree': {'Tree'},
        'sklearn.tree': {'DecisionTreeClassifier', 'DecisionTreeRegressor'},
        'xgboost.sklearn': {'XGBClassifier', 'XGBRegressor'},
        'catboost': {'CatBoostClassifier', 'CatBoostRegressor'},
        '_builtins': {'set', 'frozenset', 'slice'},
    }

    def find_class(self, module, name):
        if module == 'builtins':
            if name in ('int', 'float', 'str', 'bytes', 'list', 'dict', 'tuple', 'set', 'frozenset', 'slice'):
                return getattr(__import__('builtins'), name)
            raise pickle.UnpicklingError(f"Unsafe builtin: {name}")

        allowed_names = self.SAFE_MODULES.get(module, set())
        if name not in allowed_names:
            raise pickle.UnpicklingError(
                f"Attempted to unpickle unauthorized class {module}.{name}. "
                f"Possible code-execution attack via malicious model file."
            )

        mod = __import__(module, fromlist=[name])
        return getattr(mod, name)


def restricted_loads(data: bytes):
    """Load a pickle with class restrictions."""
    return RestrictedUnpickler(io.BytesIO(data)).load()

app = Flask(__name__)

# Paths
MODELS_DIR = os.path.join(os.path.dirname(__file__), 'models')

# Load models on startup
models = {}

# Retraining config
RETRAIN_INTERVAL_HOURS = 6
_last_trained_at = None

# Database connection (lazy-initialized)
_db_conn = None


def get_db():
    """Get or create database connection for feedback storage."""
    global _db_conn
    db_url = os.environ.get('DATABASE_URL')
    if not db_url:
        return None
    if _db_conn is None or _db_conn.closed:
        import psycopg2
        _db_conn = psycopg2.connect(db_url)
        _db_conn.autocommit = True
        _ensure_feedback_table(_db_conn)
    return _db_conn


def _ensure_feedback_table(conn):
    """Create ml_feedback table if it doesn't exist."""
    with conn.cursor() as cur:
        cur.execute("""
            CREATE TABLE IF NOT EXISTS ml_feedback (
                id SERIAL PRIMARY KEY,
                provider_address VARCHAR(42),
                prediction_type VARCHAR(30) NOT NULL,
                predicted_value VARCHAR(50) NOT NULL,
                actual_value VARCHAR(50) NOT NULL,
                is_correct BOOLEAN NOT NULL,
                input_data JSONB,
                created_at TIMESTAMP DEFAULT NOW()
            )
        """)
        cur.execute("""
            CREATE INDEX IF NOT EXISTS idx_ml_feedback_type
            ON ml_feedback(prediction_type)
        """)


def _verify_model_hash(filepath: str, expected_hash: str) -> bool:
    """Verify SHA-256 hash of a model file before loading."""
    sha256 = hashlib.sha256()
    with open(filepath, 'rb') as f:
        for chunk in iter(lambda: f.read(8192), b''):
            sha256.update(chunk)
    return sha256.hexdigest() == expected_hash


def load_models():
    """Load trained models from disk with hash verification."""
    global models

    model_files = {
        'failure_catboost': 'catboost_failure.pkl',
        'failure_xgb': 'xgboost_failure.pkl',
        'failure_cart': 'cart_failure.pkl',
        'reliability_xgb': 'xgboost_reliability.pkl',
        'reliability_cart': 'cart_reliability.pkl'
    }

    manifest_path = os.path.join(os.path.dirname(__file__), 'MANIFEST.json')
    manifest = {}
    if os.path.exists(manifest_path):
        with open(manifest_path, 'r') as f:
            manifest = json.load(f)

    for name, filename in model_files.items():
        path = os.path.join(MODELS_DIR, filename)
        if not os.path.exists(path):
            print(f"[WARN] Model not found: {filename}")
            continue

        if filename in manifest:
            if not _verify_model_hash(path, manifest[filename]):
                print(f"[CRITICAL] Model hash mismatch for {filename} — possible tampering. Skipping.")
                continue
        else:
            print(f"[WARN] No manifest entry for {filename} — loading without verification")

        with open(path, 'rb') as f:
            raw = f.read()
            models[name] = restricted_loads(raw)
        print(f"[OK] Loaded {name}")


def run_training():
    """Execute the training pipeline and reload models."""
    global _last_trained_at
    try:
        from train_models import train_all
        print(f"\n[RETRAIN] Starting automatic retraining at {datetime.now().isoformat()}")
        train_all()
        load_models()
        _last_trained_at = datetime.now().isoformat()
        print(f"[RETRAIN] Retraining complete. Models reloaded. Next retrain in {RETRAIN_INTERVAL_HOURS}h.")
    except Exception as e:
        print(f"[RETRAIN ERROR] Training failed: {e}")
        # Models from previous run are still loaded, so the API keeps working


def retrain_scheduler():
    """Background thread that retrains models every RETRAIN_INTERVAL_HOURS hours."""
    while True:
        time.sleep(RETRAIN_INTERVAL_HOURS * 3600)
        run_training()


def start_background_scheduler():
    """Start the auto-retrain background thread."""
    thread = threading.Thread(target=retrain_scheduler, daemon=True)
    thread.start()
    print(f"[SCHEDULER] Auto-retrain enabled: every {RETRAIN_INTERVAL_HOURS} hours")


def prepare_input(data: dict, feature_list: list) -> pd.DataFrame:
    """Prepare input data for prediction."""
    df = pd.DataFrame([data])

    for feat in feature_list:
        if feat not in df.columns:
            df[feat] = 0

    df = df[feature_list]
    return df


def validate_input(data: dict) -> tuple[bool, str]:
    """Validate raw provider input bounds."""
    if not isinstance(data, dict):
        return False, 'Input must be a JSON object'

    # Numeric bounds
    if 'stake' in data and (not isinstance(data['stake'], (int, float)) or data['stake'] < 0):
        return False, 'stake must be a non-negative number'
    if 'capacity_gb' in data and (not isinstance(data['capacity_gb'], (int, float)) or data['capacity_gb'] <= 0):
        return False, 'capacity_gb must be a positive number'
    if 'uptime_pct' in data and (not isinstance(data['uptime_pct'], (int, float)) or not (0 <= data['uptime_pct'] <= 1)):
        return False, 'uptime_pct must be between 0 and 1'
    if 'post_success_rate' in data and (not isinstance(data['post_success_rate'], (int, float)) or not (0 <= data['post_success_rate'] <= 1)):
        return False, 'post_success_rate must be between 0 and 1'
    if 'proof_misses' in data and (not isinstance(data['proof_misses'], int) or data['proof_misses'] < 0):
        return False, 'proof_misses must be a non-negative integer'
    if 'slashing_count' in data and (not isinstance(data['slashing_count'], int) or data['slashing_count'] < 0):
        return False, 'slashing_count must be a non-negative integer'
    if 'avg_latency' in data and (not isinstance(data['avg_latency'], (int, float)) or data['avg_latency'] < 0):
        return False, 'avg_latency must be a non-negative number'
    if 'utilization_gb' in data and (not isinstance(data['utilization_gb'], (int, float)) or data['utilization_gb'] < 0):
        return False, 'utilization_gb must be a non-negative number'

    return True, ''


def _safe_predict(model, X: pd.DataFrame, timeout_sec: float = 5.0):
    """Run model.predict with an alarm timeout to prevent DoS via slow models."""
    def _handler(signum, frame):
        raise TimeoutError(f"Prediction exceeded {timeout_sec} seconds")

    # signal.SIGALRM is Unix-only; Windows requires a thread-based approach
    old_handler = signal.signal(signal.SIGALRM, _handler) if hasattr(signal, 'SIGALRM') else None
    try:
        if hasattr(signal, 'alarm'):
            signal.alarm(int(timeout_sec))
        pred = model.predict(X)[0]
        prob = model.predict_proba(X)[0] if hasattr(model, 'predict_proba') else None
        if hasattr(signal, 'alarm'):
            signal.alarm(0)
        return pred, prob
    finally:
        if old_handler is not None:
            signal.signal(signal.SIGALRM, old_handler)


def clamp_probability(p: float) -> float:
    """Clamp probability to [0.0, 1.0] to guard against pathological model outputs."""
    return float(max(0.0, min(1.0, p)))


def compute_derived_features(data: dict) -> dict:
    """Compute all derived features from raw provider data."""
    data['utilization_ratio'] = data.get('utilization_gb', 0) / max(data.get('capacity_gb', 1), 1)
    data['stake_per_gb'] = data.get('stake', 0) / max(data.get('capacity_gb', 1), 1)
    data['risk_score'] = (
        (1 - data.get('uptime_pct', 1)) * 30 +
        (1 - data.get('post_success_rate', 1)) * 40 +
        data.get('proof_misses', 0) * 2 +
        data.get('slashing_count', 0) * 10
    )
    data['event_success_rate'] = data.get('post_success_rate', 1)
    data['event_avg_latency'] = data.get('avg_latency', 100)
    return data


@app.route('/')
def index():
    """API health check and documentation."""
    return jsonify({
        'service': 'Kyneto Sidecar - Predictive Analytics API',
        'version': '2.0.0',
        'status': 'running',
        'last_trained_at': _last_trained_at,
        'retrain_interval_hours': RETRAIN_INTERVAL_HOURS,
        'endpoints': {
            '/predict/failure': 'POST - Predict if a provider will fail',
            '/predict/reliability': 'POST - Classify provider reliability tier',
            '/feedback': 'POST - Submit actual outcome for model accuracy tracking',
            '/feedback/stats': 'GET - View feedback accuracy statistics',
            '/health': 'GET - Health check',
            '/metrics': 'GET - Prometheus metrics'
        },
        'models_loaded': list(models.keys())
    })


@app.route('/health')
def health():
    """Health check endpoint."""
    return jsonify({
        'status': 'healthy',
        'models': len(models),
        'last_trained_at': _last_trained_at
    })


@app.route('/predict/failure', methods=['POST'])
def predict_failure():
    """Predict if a provider is likely to fail."""
    target_model = None
    if 'failure_catboost' in models:
        target_model = 'failure_catboost'
    elif 'failure_xgb' in models:
        target_model = 'failure_xgb'

    if not target_model:
        return jsonify({'error': 'Failure prediction model not loaded'}), 500

    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400

        valid, reason = validate_input(data)
        if not valid:
            return jsonify({'error': reason}), 400

        model_data = models[target_model]
        model = model_data['model']
        features = model_data['features']

        data = compute_derived_features(data)

        X = prepare_input(data, features)

        prediction, probability = _safe_predict(model, X)
        fail_prob = clamp_probability(float(probability[1])) if probability is not None else float(prediction)

        return jsonify({
            'prediction': 'WILL_FAIL' if prediction == 1 else 'HEALTHY',
            'is_failed': bool(prediction),
            'failure_probability': fail_prob,
            'risk_score': data['risk_score']
        })

    except TimeoutError as te:
        return jsonify({'error': 'Prediction timed out — model inference too slow'}), 504
    except pickle.UnpicklingError as ue:
        return jsonify({'error': f'Model security violation: {ue}'}), 500
    except Exception as e:
        return jsonify({'error': 'Internal prediction error'}), 500


@app.route('/predict/reliability', methods=['POST'])
def predict_reliability():
    """Classify a provider into reliability tiers."""
    if 'reliability_xgb' not in models:
        return jsonify({'error': 'Reliability model not loaded'}), 500

    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400

        valid, reason = validate_input(data)
        if not valid:
            return jsonify({'error': reason}), 400

        model_data = models['reliability_xgb']
        model = model_data['model']
        features = model_data['features']

        data = compute_derived_features(data)

        X = prepare_input(data, features)

        prediction, _ = _safe_predict(model, X)

        tier_map = {0: 'platinum', 1: 'gold', 2: 'silver', 3: 'bronze'}
        tier = tier_map.get(prediction, 'unknown')

        return jsonify({
            'reliability_tier': tier,
            'tier_code': int(prediction),
            'risk_score': data['risk_score']
        })

    except TimeoutError as te:
        return jsonify({'error': 'Prediction timed out — model inference too slow'}), 504
    except pickle.UnpicklingError as ue:
        return jsonify({'error': f'Model security violation: {ue}'}), 500
    except Exception as e:
        return jsonify({'error': 'Internal prediction error'}), 500


@app.route('/feedback', methods=['POST'])
def submit_feedback():
    """Submit actual outcome to track model accuracy."""
    conn = get_db()
    if not conn:
        return jsonify({'error': 'Feedback storage not configured (DATABASE_URL missing)'}), 503

    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400

        required = ['prediction_type', 'predicted_value', 'actual_value']
        missing = [f for f in required if f not in data]
        if missing:
            return jsonify({'error': f'Missing required fields: {missing}'}), 400

        is_correct = str(data['predicted_value']).lower() == str(data['actual_value']).lower()

        with conn.cursor() as cur:
            cur.execute(
                """INSERT INTO ml_feedback
                   (provider_address, prediction_type, predicted_value, actual_value, is_correct, input_data)
                   VALUES (%s, %s, %s, %s, %s, %s)
                   RETURNING id""",
                (
                    data.get('provider_address'),
                    data['prediction_type'],
                    str(data['predicted_value']),
                    str(data['actual_value']),
                    is_correct,
                    json.dumps(data.get('input_data', {}))
                )
            )
            feedback_id = cur.fetchone()[0]

        return jsonify({
            'feedback_id': feedback_id,
            'is_correct': is_correct,
            'message': 'Feedback recorded'
        }), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/feedback/stats')
def feedback_stats():
    """Get model accuracy statistics from stored feedback."""
    conn = get_db()
    if not conn:
        return jsonify({'error': 'Feedback storage not configured (DATABASE_URL missing)'}), 503

    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT
                    prediction_type,
                    COUNT(*) as total,
                    COUNT(*) FILTER (WHERE is_correct = true) as correct,
                    ROUND(
                        100.0 * COUNT(*) FILTER (WHERE is_correct = true) / NULLIF(COUNT(*), 0),
                        2
                    ) as accuracy_pct
                FROM ml_feedback
                GROUP BY prediction_type
            """)
            rows = cur.fetchall()

        stats = {}
        for row in rows:
            stats[row[0]] = {
                'total_predictions': row[1],
                'correct_predictions': row[2],
                'accuracy_pct': float(row[3]) if row[3] else 0.0
            }

        return jsonify({
            'feedback_stats': stats,
            'message': 'Use POST /feedback to submit outcomes and improve these metrics'
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


def main():
    global _last_trained_at

    print("[>] Kyneto Sidecar API v2.1.0 (pre-trained mode)")
    print("=" * 50)

    # Try to load pre-trained models first (instant startup)
    load_models()

    if len(models) > 0:
        print(f"[OK] Loaded {len(models)} pre-trained model(s). Skipping startup training.")
        _last_trained_at = "pre-trained (baked into image)"
    else:
        # No pre-trained models found — train from live DB as fallback
        print("[WARN] No pre-trained models found. Training from live data...")
        run_training()

    # Start background auto-retrain scheduler (live data ingestion)
    start_background_scheduler()

    print(f"\n[NET] Starting server on http://localhost:5050")
    app.run(host='0.0.0.0', port=5050, debug=False)


if __name__ == '__main__':
    main()
