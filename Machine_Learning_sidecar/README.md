# Kyneto ML Sidecar - Predictive Analytics

A data science module for the Kyneto Protocol that provides failure prediction and reliability classification for storage providers.

## Architecture

This sidecar runs **independently** from the core Kyneto build. It generates synthetic data, trains ML models, and exposes a REST API for predictions.

```
Machine_Learning_sidecar/
├── simulator.py       # Generates 5,000 synthetic providers + ~25,000 events
├── prepare_data.py    # Cleans, engineers features, outputs training data
├── train_models.py    # Trains XGBoost + CART classifiers
├── api.py             # Flask API (port 5050) with prediction endpoints
├── requirements.txt   # Python dependencies
├── Dockerfile         # Container build for deployment
├── data/              # Generated CSV datasets & DATA_DICTIONARY.md
└── models/            # Trained model artifacts (.pkl)
```

## Quick Start (Local)

```bash
pip install -r requirements.txt
python simulator.py
python prepare_data.py
python train_models.py
python api.py
```

The API will start on `http://localhost:5050`.

## Quick Start (Docker)

### Development
From the root `kubo-master/` directory:
```bash
docker compose up ml-sidecar --build
```

### Production
```bash
docker compose -f docker-compose.prod.yaml up ml-sidecar --build
```
> [!NOTE]
> The ML models are automatically trained during the Docker build process (`RUN python train_models.py` in Dockerfile), ensuring the container is ready-to-serve upon startup.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/predict/failure` | Predict if a provider will fail |
| POST | `/predict/reliability` | Classify provider reliability tier |

### Example Request

```bash
curl -X POST http://localhost:5050/predict/failure \
  -H "Content-Type: application/json" \
  -d '{"stake": 10000, "capacity_gb": 500, "uptime_pct": 0.95, "post_success_rate": 0.92}'
```

## Model Performance

| Model | Accuracy | Precision | Recall |
|-------|----------|-----------|--------|
| XGBoost Failure | 75.20% | 59.60% | 41.26% |
| CART Failure | 73.20% | 54.55% | 37.76% |
| XGBoost Reliability | 99.60% | — | — |
