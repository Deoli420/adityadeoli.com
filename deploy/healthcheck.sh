#!/usr/bin/env bash
# ── SentinelAI — Health Check (cron) ──────────────────────────────────
# Runs every 5 minutes via cron.  Restarts unhealthy services.
# ─────────────────────────────────────────────────────────────────────────

LOG="/home/deploy/sentinelai/deploy/healthcheck.log"

api_status=$(curl -s -o /dev/null -w "%{http_code}" \
    "https://api.sentinelai.adityadeoli.com/api/v1/health" --max-time 10 2>/dev/null || echo "000")

n8n_status=$(curl -s -o /dev/null -w "%{http_code}" \
    "https://n8n.sentinelai.adityadeoli.com" --max-time 10 2>/dev/null || echo "000")

if [ "$api_status" != "200" ]; then
    echo "$(date '+%Y-%m-%d %H:%M:%S') ALERT: API returned $api_status — restarting" >> "$LOG"
    cd /home/deploy/sentinelai && docker compose restart api
fi

# n8n returns 401 when basic auth is enabled, which is fine
if [ "$n8n_status" != "200" ] && [ "$n8n_status" != "401" ]; then
    echo "$(date '+%Y-%m-%d %H:%M:%S') ALERT: n8n returned $n8n_status — restarting" >> "$LOG"
    cd /home/deploy/sentinelai/n8n && docker compose restart n8n
fi

# Keep log file from growing forever (last 500 lines)
if [ -f "$LOG" ] && [ "$(wc -l < "$LOG")" -gt 500 ]; then
    tail -200 "$LOG" > "${LOG}.tmp" && mv "${LOG}.tmp" "$LOG"
fi
