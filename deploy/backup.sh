#!/usr/bin/env bash
# ── SentinelAI — Daily Backup (cron) ──────────────────────────────────
# Backs up both Postgres databases.  Runs daily at 2 AM via cron.
# Keeps 7 days of backups.
# ─────────────────────────────────────────────────────────────────────────

set -euo pipefail

BACKUP_DIR="/home/deploy/backups"
DATE=$(date +%Y%m%d_%H%M%S)
LOG="/home/deploy/sentinelai/deploy/backup.log"

mkdir -p "$BACKUP_DIR"

echo "$(date '+%Y-%m-%d %H:%M:%S') Starting backup..." >> "$LOG"

# SentinelAI database
if docker exec sentinelai-db-1 pg_dump -U sentinel sentinel_db 2>/dev/null \
    | gzip > "$BACKUP_DIR/sentinel_${DATE}.sql.gz"; then
    echo "  SentinelAI DB backed up: sentinel_${DATE}.sql.gz" >> "$LOG"
else
    echo "  ERROR: SentinelAI DB backup failed" >> "$LOG"
fi

# n8n database
if docker exec n8n-n8n-db-1 pg_dump -U n8n n8n 2>/dev/null \
    | gzip > "$BACKUP_DIR/n8n_${DATE}.sql.gz"; then
    echo "  n8n DB backed up: n8n_${DATE}.sql.gz" >> "$LOG"
else
    echo "  ERROR: n8n DB backup failed" >> "$LOG"
fi

# Clean backups older than 7 days
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +7 -delete

echo "$(date '+%Y-%m-%d %H:%M:%S') Backup complete." >> "$LOG"
