#!/bin/bash

# Backup script for Ashva Experts

set -e

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

echo "Starting backup at $(date)"

# Backup PostgreSQL
echo "Backing up PostgreSQL..."
docker exec ashva-postgres pg_dump -U ashva ashva_db | gzip > "$BACKUP_DIR/postgres_$TIMESTAMP.sql.gz"

# Backup MinIO (if using MinIO client)
echo "Backing up MinIO..."
# mc mirror minio/ashva-media "$BACKUP_DIR/minio_$TIMESTAMP/"

echo "Backup completed at $(date)"
echo "Backups stored in: $BACKUP_DIR"

# Cleanup old backups (keep last 7 days)
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete
