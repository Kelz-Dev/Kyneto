"""
Kyneto Sidecar API
==================
Flask-based API exposing prediction endpoints for provider reliability
and failure prediction. Automatically retrains models from live database
data every 6 hours.
"""

from flask import Flask, request, jsonify
from prometheus_flask_instrumentator import FlaskInstrumentator
import pickle
import os
import json
import threading
import time
import pandas as pd
import numpy as np
from datetime import datetime

app = Flask(__name__)

# Prometheus metrics (auto-instruments all routes)
FlaskInstrumentator().instrument(app)

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


def load_models():
    """Load trained models from disk."""
    global models

    model_files = {
        'failure_catboost': 'catboost_failure.pkl',
        'failure_xgb': 'xgboost_failure.pkl',
        'failure_cart': 'cart_failure.pkl',
        'reliability_xgb': 'xgboost_reliability.pkl',
        'reliability_cart': 'cart_reliability.pkl'
    }

    for name, filename in model_files.items():
        path = os.path.join(MODELS_DIR, filename)
        if os.path.exists(path):
            with open(path, 'rb') as f:
                models[name] = pickle.load(f)
            print(f"[OK] Loaded {name}")
        else:
            print(f"[WARN] Model not found: {filename}")


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

        model_data = models[target_model]
        model = model_data['model']
        features = model_data['features']

        data = compute_derived_features(data)

        X = prepare_input(data, features)

        prediction = model.predict(X)[0]
        probability = model.predict_proba(X)[0] if hasattr(model, 'predict_proba') else [0, 0]

        return jsonify({
            'prediction': 'WILL_FAIL' if prediction == 1 else 'HEALTHY',
            'is_failed': bool(prediction),
            'failure_probability': float(probability[1]) if len(probability) > 1 else float(prediction),
            'risk_score': data['risk_score']
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/predict/reliability', methods=['POST'])
def predict_reliability():
    """Classify a provider into reliability tiers."""
    if 'reliability_xgb' not in models:
        return jsonify({'error': 'Reliability model not loaded'}), 500

    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400

        model_data = models['reliability_xgb']
        model = model_data['model']
        features = model_data['features']

        data = compute_derived_features(data)

        X = prepare_input(data, features)

        prediction = model.predict(X)[0]

        tier_map = {0: 'platinum', 1: 'gold', 2: 'silver', 3: 'bronze'}
        tier = tier_map.get(prediction, 'unknown')

        return jsonify({
            'reliability_tier': tier,
            'tier_code': int(prediction),
            'risk_score': data['risk_score']
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


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

    print("[>] Kyneto Sidecar API v2.0.0")
    print("=" * 50)

    # Train models from live data at startup
    run_training()

    # Start background auto-retrain scheduler
    start_background_scheduler()

    print(f"\n[NET] Starting server on http://localhost:5050")
    app.run(host='0.0.0.0', port=5050, debug=False)


if __name__ == '__main__':
    main()
