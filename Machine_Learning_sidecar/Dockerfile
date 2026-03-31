FROM python:3.11-slim

WORKDIR /app

# Install dependencies first for layer caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy pre-trained models (baked into image for instant startup)
COPY models/ ./models/

# Copy application code
COPY train_models.py prepare_data.py api.py ./

# Create data directory for any future CSV exports
RUN mkdir -p data

# Expose the API port
EXPOSE 5050

# Run the API server (loads pre-trained models instantly, retrains later in background)
CMD ["python", "api.py"]
