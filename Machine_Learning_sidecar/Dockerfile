FROM python:3.11-slim

WORKDIR /app

# Install dependencies first for layer caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code (no simulator needed at build time)
COPY train_models.py prepare_data.py api.py ./

# Create data and models directories
RUN mkdir -p data models

# Expose the API port
EXPOSE 5050

# Run the API server (trains models from live DB at startup)
CMD ["python", "api.py"]
