#!/usr/bin/env bash
# ── SentinelAI — Deployment Script ─────────────────────────────────────
# Run this as the 'deploy' user on the droplet after setup-server.sh.
#
# Prerequisites:
#   - setup-server.sh has been run
#   - Code is at /home/deploy/sentinelai/
#   - DNS A records point to this server for:
#       sentinelai.adityadeoli.com
#       api.sentinelai.adityadeoli.com
#       n8n.sentinelai.adityadeoli.com
#
# Usage:
#   cd /home/deploy/sentinelai
#   bash deploy/deploy.sh YOUR_EMAIL@example.com
# ─────────────────────────────────────────────────────────────────────────

set -euo pipefail

DOMAIN="sentinelai.adityadeoli.com"
API_DOMAIN="api.sentinelai.adityadeoli.com"
N8N_DOMAIN="n8n.sentinelai.adityadeoli.com"
EMAIL="${1:-}"

if [ -z "$EMAIL" ]; then
    echo "Usage: bash deploy/deploy.sh YOUR_EMAIL@example.com"
    echo "  (email is required for Let's Encrypt certificate registration)"
    exit 1
fi

echo "═══════════════════════════════════════════════════════════════"
echo " SentinelAI — Deploying to production"
echo " Domain: $DOMAIN"
echo " Email:  $EMAIL"
echo "═══════════════════════════════════════════════════════════════"

PROJECT_DIR="/home/deploy/sentinelai"
N8N_DIR="/home/deploy/sentinelai/n8n"

# ── 1. Create shared Docker network ───────────────────────────────────
echo "[1/8] Creating shared Docker network..."
docker network create sentinel-shared 2>/dev/null || echo "  Network already exists."

# ── 2. Verify .env files exist ─────────────────────────────────────────
echo "[2/8] Checking environment files..."
if [ ! -f "$PROJECT_DIR/.env" ]; then
    echo "  ERROR: $PROJECT_DIR/.env not found!"
    echo "  Copy .env.example to .env and configure it first."
    exit 1
fi
if [ ! -f "$N8N_DIR/.env" ]; then
    echo "  ERROR: $N8N_DIR/.env not found!"
    echo "  Copy n8n/.env.example to n8n/.env and configure it first."
    exit 1
fi
echo "  .env files found."

# ── 3. Start with HTTP-only nginx for Certbot ─────────────────────────
echo "[3/8] Starting SentinelAI with HTTP-only nginx (for Certbot)..."
cp "$PROJECT_DIR/nginx/nginx.conf" "$PROJECT_DIR/nginx/nginx.ssl.conf.bak"
cp "$PROJECT_DIR/nginx/nginx.initial.conf" "$PROJECT_DIR/nginx/nginx.conf"

cd "$PROJECT_DIR"
docker compose up -d --build

echo "  Waiting for services to stabilise..."
sleep 10

# Quick health check
if curl -sf "http://$API_DOMAIN/api/v1/health" > /dev/null 2>&1; then
    echo "  API is reachable over HTTP ✓"
else
    echo "  WARNING: API not yet reachable. Check: docker compose logs api"
fi

# ── 4. Install Certbot ────────────────────────────────────────────────
echo "[4/8] Installing Certbot..."
sudo apt install -y certbot 2>/dev/null || true

# ── 5. Obtain SSL certificates ────────────────────────────────────────
echo "[5/8] Obtaining SSL certificates..."

# Find the certbot webroot volume path
WEBROOT=$(docker volume inspect sentinelai_certbot-webroot --format '{{ .Mountpoint }}' 2>/dev/null || echo "/var/lib/docker/volumes/sentinelai_certbot-webroot/_data")

sudo certbot certonly --webroot \
    -w "$WEBROOT" \
    -d "$DOMAIN" \
    -d "$API_DOMAIN" \
    -d "$N8N_DOMAIN" \
    --email "$EMAIL" \
    --agree-tos \
    --non-interactive

echo "  SSL certificates obtained ✓"

# ── 6. Switch to full SSL nginx config ─────────────────────────────────
echo "[6/8] Switching to SSL nginx config..."
cp "$PROJECT_DIR/nginx/nginx.ssl.conf.bak" "$PROJECT_DIR/nginx/nginx.conf"
docker compose restart nginx
sleep 3

if curl -sf "https://$API_DOMAIN/api/v1/health" > /dev/null 2>&1; then
    echo "  API is reachable over HTTPS ✓"
else
    echo "  WARNING: HTTPS not yet reachable. Check: docker compose logs nginx"
fi

# ── 7. Start n8n stack ────────────────────────────────────────────────
echo "[7/8] Starting n8n..."
cd "$N8N_DIR"
docker compose up -d

echo "  Waiting for n8n to start..."
sleep 15

if curl -sf -o /dev/null -w "%{http_code}" "http://n8n:5678" 2>/dev/null | grep -qE "200|401"; then
    echo "  n8n is running ✓"
else
    echo "  n8n started (check https://$N8N_DOMAIN in your browser)"
fi

# ── 8. Set up cron jobs ───────────────────────────────────────────────
echo "[8/8] Setting up cron jobs..."

# Certbot auto-renewal
(sudo crontab -l 2>/dev/null | grep -v certbot; \
 echo "0 3 * * * certbot renew --quiet --deploy-hook 'docker restart sentinelai-nginx-1'") \
 | sudo crontab -

# Health check every 5 minutes
(crontab -l 2>/dev/null | grep -v healthcheck; \
 echo "*/5 * * * * /home/deploy/sentinelai/deploy/healthcheck.sh") \
 | crontab -

# Daily backup at 2 AM
(crontab -l 2>/dev/null | grep -v backup; \
 echo "0 2 * * * /home/deploy/sentinelai/deploy/backup.sh") \
 | crontab -

echo "  Cron jobs configured ✓"

# ── Done ───────────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo " Deployment complete! 🚀"
echo ""
echo " Endpoints:"
echo "   API:       https://$API_DOMAIN"
echo "   Swagger:   https://$API_DOMAIN/docs"
echo "   Dashboard: https://$DOMAIN"
echo "   n8n:       https://$N8N_DOMAIN"
echo ""
echo " Next steps:"
echo "   1. Open https://$N8N_DOMAIN and set up your account"
echo "   2. Create a webhook workflow (see DEPLOYMENT.md)"
echo "   3. Test: curl -X POST https://$API_DOMAIN/api/v1/alerts/test"
echo "═══════════════════════════════════════════════════════════════"
