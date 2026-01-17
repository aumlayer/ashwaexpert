#!/bin/bash

# Setup script for Ashva Experts infrastructure

set -e

echo "Setting up Ashva Experts infrastructure..."

# Create necessary directories
echo "Creating directories..."
mkdir -p data/postgres
mkdir -p data/redis
mkdir -p data/minio
mkdir -p logs

# Set permissions
chmod -R 755 data
chmod -R 755 logs

# Create MinIO buckets
echo "Creating MinIO buckets..."
# This would typically be done via MinIO client or API after MinIO is running

# Initialize database schemas
echo "Initializing database schemas..."
# This would run the init-schemas.sql script

echo "Setup complete!"
