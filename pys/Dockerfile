FROM python:3.9-slim

WORKDIR /app

# Install system dependencies for GDAL and other geospatial libraries
RUN apt-get update && apt-get install -y \
    gdal-bin \
    libgdal-dev \
    gcc \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set GDAL environment variables
ENV CPLUS_INCLUDE_PATH=/usr/include/gdal
ENV C_INCLUDE_PATH=/usr/include/gdal

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Make entrypoint script executable
RUN chmod +x entrypoint.sh

# Create a simple health check script
RUN echo 'from flask import Flask; app = Flask(__name__); @app.route("/health"); def health(): return {"status": "healthy", "service": "flask-seismic-api"}' > health_check.py

# Expose port
EXPOSE 5001

# Use entrypoint script
CMD ["./entrypoint.sh"] 