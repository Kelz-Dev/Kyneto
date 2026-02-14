FROM python:3.11-slim

WORKDIR /app

# Install dependencies first for layer caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY simulator.py prepare_data.py train_models.py api.py ./

# Create data and models directories
RUN mkdir -p data models

# Generate data and train models at build time
# This ensures the container starts with pre-trained models
RUN python simulator.py \
    && python prepare_data.py \
    && python train_models.py

# Expose the API port
EXPOSE 5050

# Run the API server
CMD ["python", "api.py"]
