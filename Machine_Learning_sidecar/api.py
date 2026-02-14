"""
Kyneto Sidecar API
==================
Flask-based API exposing prediction endpoints for provider reliability
and failure prediction. Runs independently from the core Kyneto build.
"""

from flask import Flask, request, jsonify
import pickle
import os
import pandas as pd
import numpy as np

app = Flask(__name__)

# Paths
MODELS_DIR = os.path.join(os.path.dirname(__file__), 'models')

# Load models on startup
models = {}


def load_models():
    """Load trained models from disk."""
    global models
    
    model_files = {
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


def prepare_input(data: dict, feature_list: list) -> pd.DataFrame:
    """Prepare input data for prediction."""
    # Create DataFrame with expected features
    df = pd.DataFrame([data])
    
    # Add missing features with default values
    for feat in feature_list:
        if feat not in df.columns:
            df[feat] = 0
    
    # Select only the features the model expects
    df = df[feature_list]
    
    return df


@app.route('/')
def index():
    """API health check and documentation."""
    return jsonify({
        'service': 'Kyneto Sidecar - Predictive Analytics API',
        'version': '1.0.0',
        'status': 'running',
        'endpoints': {
            '/predict/failure': 'POST - Predict if a provider will fail',
            '/predict/reliability': 'POST - Classify provider reliability tier',
            '/health': 'GET - Health check'
        },
        'models_loaded': list(models.keys())
    })


@app.route('/health')
def health():
    """Health check endpoint."""
    return jsonify({'status': 'healthy', 'models': len(models)})


@app.route('/predict/failure', methods=['POST'])
def predict_failure():
    """
    Predict if a provider is likely to fail.
    
    Expected JSON input:
    {
        "stake": 10000,
        "capacity_gb": 500,
        "utilization_gb": 250,
        "node_age_days": 30,
        "uptime_pct": 0.95,
        "avg_latency": 150,
        "post_success_rate": 0.92,
        "proof_misses": 2,
        "slashing_count": 0
    }
    """
    if 'failure_xgb' not in models:
        return jsonify({'error': 'Failure prediction model not loaded'}), 500
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        model_data = models['failure_xgb']
        model = model_data['model']
        features = model_data['features']
        
        # Compute derived features
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
        
        # Prepare input
        X = prepare_input(data, features)
        
        # Predict
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
    """
    Classify a provider into reliability tiers.
    
    Expected JSON input: Same as /predict/failure
    
    Returns: platinum, gold, silver, or bronze tier
    """
    if 'reliability_xgb' not in models:
        return jsonify({'error': 'Reliability model not loaded'}), 500
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        model_data = models['reliability_xgb']
        model = model_data['model']
        features = model_data['features']
        
        # Compute derived features
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
        
        # Prepare input
        X = prepare_input(data, features)
        
        # Predict
        prediction = model.predict(X)[0]
        
        # Map numeric prediction to tier name
        tier_map = {0: 'platinum', 1: 'gold', 2: 'silver', 3: 'bronze'}
        tier = tier_map.get(prediction, 'unknown')
        
        return jsonify({
            'reliability_tier': tier,
            'tier_code': int(prediction),
            'risk_score': data['risk_score']
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


def main():
    print("[>] Kyneto Sidecar API")
    print("=" * 50)
    
    load_models()
    
    print("\n[NET] Starting server on http://localhost:5050")
    app.run(host='0.0.0.0', port=5050, debug=False)


if __name__ == '__main__':
    main()
