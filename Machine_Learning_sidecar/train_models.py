"""
Kyneto ML Model Training
========================
Trains XGBoost and CART (Decision Tree) models for provider reliability classification
and failure prediction. Evaluates models and saves them for use by the Sidecar API.
"""

import pandas as pd
import numpy as np
import os
import pickle
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, confusion_matrix, classification_report

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

# Try to import Keras for ANN
try:
    import tensorflow as tf
    from tensorflow.keras.models import Sequential
    from tensorflow.keras.layers import Dense, Dropout
    from tensorflow.keras.callbacks import EarlyStopping
    HAS_KERAS = True
except ImportError:
    HAS_KERAS = False
    print("[WARN] TensorFlow/Keras not installed, skipping ANN training")

from sklearn.preprocessing import StandardScaler

# Paths
DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
MODELS_DIR = os.path.join(os.path.dirname(__file__), 'models')
TRAINING_FILE = os.path.join(DATA_DIR, 'training_data_v2.csv')

os.makedirs(MODELS_DIR, exist_ok=True)


def load_training_data():
    """Load prepared training data."""
    print("[DIR] Loading training data...")
    
    if not os.path.exists(TRAINING_FILE):
        raise FileNotFoundError("Training data not found. Run prepare_data.py first.")
    
    df = pd.read_csv(TRAINING_FILE)
    print(f"   Loaded {len(df)} records with {len(df.columns)} features")
    
    return df


def prepare_features_target(df: pd.DataFrame, target_col: str):
    """Prepare feature matrix X and target vector y."""
    # Exclude non-feature columns
    exclude_cols = ['provider_id', 'is_failed', 'reliability_tier']
    feature_cols = [c for c in df.columns if c not in exclude_cols]
    
    X = df[feature_cols].copy()
    
    # Handle any remaining NaN values
    X = X.fillna(0)
    
    # Convert boolean to int if needed
    if target_col in df.columns:
        y = df[target_col]
        if y.dtype == bool:
            y = y.astype(int)
        elif y.dtype == object:
            # Encode categorical target
            y = pd.Categorical(y).codes
    else:
        raise ValueError(f"Target column '{target_col}' not found in data")
    
    return X, y, feature_cols


def train_failure_prediction_model(df: pd.DataFrame):
    """Train binary classification model for failure prediction."""
    print("\n" + "=" * 50)
    print("[TARGET] Training Failure Prediction Model")
    print("=" * 50)
    
    X, y, feature_cols = prepare_features_target(df, 'is_failed')
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    print(f"   Training set: {len(X_train)} samples")
    print(f"   Test set: {len(X_test)} samples")
    print(f"   Positive class ratio: {y.mean()*100:.1f}%")
    
    # Train XGBoost (or RandomForest fallback)
    print("\n[CHART] Training XGBoost/Ensemble model...")
    if HAS_XGBOOST:
        xgb_model = XGBClassifier(
            n_estimators=100,
            max_depth=5,
            learning_rate=0.1,
            random_state=42,
            use_label_encoder=False,
            eval_metric='logloss'
        )
    else:
        xgb_model = RandomForestClassifier(
            n_estimators=100,
            max_depth=5,
            random_state=42
        )
    
    xgb_model.fit(X_train, y_train)
    xgb_pred = xgb_model.predict(X_test)
    
    print("\n   XGBoost/Ensemble Results:")
    print(f"   Accuracy:  {accuracy_score(y_test, xgb_pred)*100:.2f}%")
    print(f"   Precision: {precision_score(y_test, xgb_pred, zero_division=0)*100:.2f}%")
    print(f"   Recall:    {recall_score(y_test, xgb_pred, zero_division=0)*100:.2f}%")
    
    # Train CART (Decision Tree)
    print("\n[CHART] Training CART (Decision Tree) model...")
    cart_model = DecisionTreeClassifier(
        max_depth=5,
        min_samples_split=10,
        random_state=42
    )
    cart_model.fit(X_train, y_train)
    cart_pred = cart_model.predict(X_test)
    
    print("\n   CART Results:")
    print(f"   Accuracy:  {accuracy_score(y_test, cart_pred)*100:.2f}%")
    print(f"   Precision: {precision_score(y_test, cart_pred, zero_division=0)*100:.2f}%")
    print(f"   Recall:    {recall_score(y_test, cart_pred, zero_division=0)*100:.2f}%")
    
    # Train CatBoost
    catboost_model = None
    if HAS_CATBOOST:
        print("\n[CHART] Training CatBoost model...")
        catboost_model = CatBoostClassifier(
            iterations=100,
            depth=5,
            learning_rate=0.1,
            random_seed=42,
            verbose=False
        )
        catboost_model.fit(X_train, y_train)
        cat_pred = catboost_model.predict(X_test)
        
        print("\n   CatBoost Results:")
        print(f"   Accuracy:  {accuracy_score(y_test, cat_pred)*100:.2f}%")
        print(f"   Precision: {precision_score(y_test, cat_pred, zero_division=0)*100:.2f}%")
        print(f"   Recall:    {recall_score(y_test, cat_pred, zero_division=0)*100:.2f}%")
        
    # Train ANN (Keras)
    ann_model = None
    if HAS_KERAS:
        print("\n[CHART] Training Keras ANN (Sequential) model...")
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)
        
        ann_model = Sequential([
            Dense(32, activation='relu', input_shape=(X_train_scaled.shape[1],)),
            Dropout(0.2),
            Dense(16, activation='relu'),
            Dense(1, activation='sigmoid')
        ])
        
        ann_model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])
        early_stop = EarlyStopping(monitor='val_loss', patience=10, restore_best_weights=True)
        
        ann_model.fit(X_train_scaled, y_train, epochs=200, validation_split=0.1, callbacks=[early_stop], verbose=0)
        
        ann_pred_prob = ann_model.predict(X_test_scaled, verbose=0)
        ann_pred = (ann_pred_prob > 0.5).astype(int).flatten()
        
        print("\n   ANN Results:")
        print(f"   Accuracy:  {accuracy_score(y_test, ann_pred)*100:.2f}%")
        print(f"   Precision: {precision_score(y_test, ann_pred, zero_division=0)*100:.2f}%")
        print(f"   Recall:    {recall_score(y_test, ann_pred, zero_division=0)*100:.2f}%")
    
    # Save models
    xgb_path = os.path.join(MODELS_DIR, 'xgboost_failure.pkl')
    cart_path = os.path.join(MODELS_DIR, 'cart_failure.pkl')
    # Save Keras Model
    if HAS_KERAS:
        ann_path = os.path.join(MODELS_DIR, 'keras_failure.h5')
        ann_scaler_path = os.path.join(MODELS_DIR, 'ann_failure_scaler.pkl')
        ann_model.save(ann_path)
        with open(ann_scaler_path, 'wb') as f:
            pickle.dump({'scaler': scaler, 'features': feature_cols}, f)
        
    if HAS_CATBOOST:
        cat_path = os.path.join(MODELS_DIR, 'catboost_failure.pkl')
        with open(cat_path, 'wb') as f:
            pickle.dump({'model': catboost_model, 'features': feature_cols}, f)
    
    print(f"\n[OK] Models saved to {MODELS_DIR}")
    
    return xgb_model, cart_model, catboost_model, ann_model


def train_reliability_classification_model(df: pd.DataFrame):
    """Train multi-class classification model for reliability tier prediction."""
    print("\n" + "=" * 50)
    print("[TROPHY] Training Reliability Classification Model")
    print("=" * 50)
    
    if 'reliability_tier' not in df.columns:
        print("   [WARN] Skipping: reliability_tier column not found")
        return None, None
    
    X, y, feature_cols = prepare_features_target(df, 'reliability_tier')
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    
    print(f"   Training set: {len(X_train)} samples")
    print(f"   Test set: {len(X_test)} samples")
    
    # Train XGBoost
    print("\n[CHART] Training XGBoost classifier...")
    if HAS_XGBOOST:
        xgb_model = XGBClassifier(
            n_estimators=100,
            max_depth=5,
            learning_rate=0.1,
            random_state=42,
            use_label_encoder=False,
            eval_metric='mlogloss'
        )
    else:
        xgb_model = RandomForestClassifier(
            n_estimators=100,
            max_depth=5,
            random_state=42
        )
    
    xgb_model.fit(X_train, y_train)
    xgb_pred = xgb_model.predict(X_test)
    
    print(f"\n   XGBoost Accuracy: {accuracy_score(y_test, xgb_pred)*100:.2f}%")
    
    # Train CART
    print("\n[CHART] Training CART classifier...")
    cart_model = DecisionTreeClassifier(
        max_depth=5,
        min_samples_split=10,
        random_state=42
    )
    cart_model.fit(X_train, y_train)
    cart_pred = cart_model.predict(X_test)
    
    print(f"   CART Accuracy: {accuracy_score(y_test, cart_pred)*100:.2f}%")
    
    # Train CatBoost
    catboost_model = None
    if HAS_CATBOOST:
        print("\n[CHART] Training CatBoost classifier...")
        catboost_model = CatBoostClassifier(
            iterations=100,
            depth=5,
            learning_rate=0.1,
            random_seed=42,
            loss_function='MultiClass',
            verbose=False
        )
        catboost_model.fit(X_train, y_train)
        cat_pred = catboost_model.predict(X_test)
        
        print(f"   CatBoost Accuracy: {accuracy_score(y_test, cat_pred)*100:.2f}%")

    # Train ANN (Keras)
    ann_model = None
    if HAS_KERAS:
        print("\n[CHART] Training Keras ANN classifier...")
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)
        
        num_classes = len(np.unique(y_test))
        y_train_cat = tf.keras.utils.to_categorical(y_train, num_classes)
        
        ann_model = Sequential([
            Dense(32, activation='relu', input_shape=(X_train_scaled.shape[1],)),
            Dropout(0.2),
            Dense(16, activation='relu'),
            Dense(num_classes, activation='softmax')
        ])
        
        ann_model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])
        early_stop = EarlyStopping(monitor='val_loss', patience=10, restore_best_weights=True)
        
        ann_model.fit(X_train_scaled, y_train_cat, epochs=200, validation_split=0.1, callbacks=[early_stop], verbose=0)
        
        ann_pred_prob = ann_model.predict(X_test_scaled, verbose=0)
        ann_pred = np.argmax(ann_pred_prob, axis=1)
        
        print(f"   ANN Accuracy: {accuracy_score(y_test, ann_pred)*100:.2f}%")
    
    # Save models
    xgb_path = os.path.join(MODELS_DIR, 'xgboost_reliability.pkl')
    # Save Keras model
    if HAS_KERAS:
        ann_path = os.path.join(MODELS_DIR, 'keras_reliability.h5')
        ann_scaler_path = os.path.join(MODELS_DIR, 'ann_reliability_scaler.pkl')
        ann_model.save(ann_path)
        with open(ann_scaler_path, 'wb') as f:
            pickle.dump({'scaler': scaler, 'features': feature_cols}, f)
        
    if HAS_CATBOOST:
        cat_path = os.path.join(MODELS_DIR, 'catboost_reliability.pkl')
        with open(cat_path, 'wb') as f:
            pickle.dump({'model': catboost_model, 'features': feature_cols}, f)
    
    print(f"\n[OK] Models saved to {MODELS_DIR}")
    
    return xgb_model, cart_model, catboost_model, ann_model


def main():
    print("[>] Kyneto ML Model Training Pipeline")
    print("=" * 50)
    
    # Load data
    df = load_training_data()
    
    # Train failure prediction models
    train_failure_prediction_model(df)
    
    # Train reliability classification models
    train_reliability_classification_model(df)
    
    print("\n" + "=" * 50)
    print("[OK] All models trained and saved successfully!")
    print("=" * 50)


if __name__ == '__main__':
    main()
