#!/usr/bin/env bash
set -euo pipefail

# Load .env if present
if [ -f .env ]; then
  export $(grep -E '^DATABASE_URL=' .env | xargs)
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL is not set. Export it or add it to .env"
  exit 1
fi

BACKUP_DIR="backups"
mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date -u +"%Y-%m-%d_%H%M%S")
FILENAME="${BACKUP_DIR}/backup-${TIMESTAMP}.sql.gz"

echo "Backing up database..."
pg_dump "$DATABASE_URL" --no-owner --no-acl -F plain | gzip > "$FILENAME"
echo "Backup saved to ${FILENAME} ($(du -h "$FILENAME" | cut -f1))"
