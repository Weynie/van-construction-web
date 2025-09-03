#!/bin/bash

# Check if we're in production mode
if [ "$FLASK_ENV" = "production" ]; then
    echo "Starting Flask app in production mode with Gunicorn..."
    exec gunicorn --bind 0.0.0.0:5001 --workers 2 --timeout 120 seismic_api:app
else
    echo "Starting Flask app in development mode..."
    exec python seismic_api.py
fi 