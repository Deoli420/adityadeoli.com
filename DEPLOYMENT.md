# SentinelAI — Deployment Guide

Deploy SentinelAI + n8n to a DigitalOcean droplet with SSL.

## Architecture

```
Internet
  │
  ▼
┌──────────────────────────────────────────────────────────────────┐
│  DigitalOcean Droplet · 2 vCPU / 4 GB · Ubuntu 24.04            │
│                                                                  │
│  UFW Firewall: ports 22, 80, 443 only                            │
│                                                                  │
│  ┌─── SentinelAI stack ───────────────────────────────────────┐  │
│  │  nginx :80/:443  ─── SSL termination + reverse proxy       │  │
│  │    ├─ api.sentinelai.adityadeoli.com  → api:8000           │  │
│  │    ├─ n8n.sentinelai.adityadeoli.com  → n8n:5678           │  │
│  │    └─ sentinelai.adityadeoli.com      → placeholder        │  │
│  │  api (FastAPI) :8000 ── 4 Uvicorn workers                  │  │
│  │  db  (Postgres) :5432 ── SentinelAI data                   │  │
│  └────────────────────────────────────────────────────────────┘  │
│                          ↕ sentinel-shared network               │
│  ┌─── n8n stack ──────────────────────────────────────────────┐  │
│  │  n8n     :5678 ── workflow engine                          │  │
│  │  n8n-db  :5432 ── n8n data                                 │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

**Cost:** ~$24/month (droplet) + domain

---

## Prerequisites

- A DigitalOcean account (https://cloud.digitalocean.com)
- Domain `adityadeoli.com` with DNS access
- SSH key on your local machine

---

## Phase 1: DNS Setup

Add these A records in your DNS provider (pointing to your droplet IP):

| Type | Name | Value |
|------|------|-------|
| A | `sentinelai` | `DROPLET_IP` |
| A | `api.sentinelai` | `DROPLET_IP` |
| A | `n8n.sentinelai` | `DROPLET_IP` |

Wait for DNS propagation (check with `dig api.sentinelai.adityadeoli.com`).

---

## Phase 2: Create Droplet

**Via DigitalOcean dashboard:**
- Image: Ubuntu 24.04 LTS
- Size: **Basic · 2 vCPU · 4 GB RAM · 80 GB SSD** ($24/mo)
- Region: closest to your users
- Authentication: SSH key
- Hostname: `sentinelai`

**Or via CLI:**
```bash
brew install doctl
doctl auth init

doctl compute droplet create sentinelai \
  --region nyc1 \
  --size s-2vcpu-4gb \
  --image ubuntu-24-04-x64 \
  --ssh-keys $(doctl compute ssh-key list --format ID --no-header | head -1) \
  --wait
```

Note the droplet IP address.

---

## Phase 3: Server Setup

```bash
# SSH into the droplet
ssh root@DROPLET_IP

# Transfer the project (option A: rsync)
# Run this from your LOCAL machine:
rsync -avz --exclude '.venv' --exclude '__pycache__' --exclude '.env' --exclude '.git' \
  ~/SentinelAI/ root@DROPLET_IP:/home/deploy/sentinelai/

# Back on the server — run the setup script
cd /home/deploy/sentinelai
bash deploy/setup-server.sh
```

This installs Docker, configures the firewall (ports 22/80/443), creates a `deploy` user, and enables fail2ban.

```bash
# Now logout and re-login as deploy
exit
ssh deploy@DROPLET_IP
```

---

## Phase 4: Configure Environment

### SentinelAI `.env`

```bash
cd /home/deploy/sentinelai
cp .env.example .env

# Generate a strong DB password
DB_PASS=$(openssl rand -base64 24)
echo "Generated DB password: $DB_PASS"

# Edit .env with your values
nano .env
```

Set these values in `.env`:
```
DEBUG=false
DB_PASSWORD=<paste generated password>
OPENAI_API_KEY=<your OpenAI key>
WEBHOOK_URL=http://n8n:5678/webhook/sentinel-alerts
ALERT_MIN_RISK_LEVEL=MEDIUM
```

### n8n `.env`

```bash
cd /home/deploy/sentinelai/n8n
cp .env.example .env

N8N_DB_PASS=$(openssl rand -base64 24)
echo "Generated n8n DB password: $N8N_DB_PASS"

nano .env
```

Set `N8N_DB_PASSWORD=<paste generated password>`.

---

## Phase 5: Deploy

```bash
cd /home/deploy/sentinelai
bash deploy/deploy.sh your-email@example.com
```

This script:
1. Creates the shared Docker network
2. Builds and starts SentinelAI with HTTP-only nginx
3. Obtains SSL certificates via Certbot
4. Switches to full SSL nginx config
5. Starts the n8n stack
6. Sets up cron jobs (cert renewal, health checks, backups)

---

## Phase 6: Set Up n8n Webhook

1. Open **https://n8n.sentinelai.adityadeoli.com** in your browser
2. Create your n8n account (first-time setup)
3. Create a new workflow: **"SentinelAI Alert Router"**

### Webhook Trigger Node

- **Node type:** Webhook
- **HTTP Method:** POST
- **Path:** `sentinel-alerts`
- **Response Mode:** Immediately

This creates the endpoint: `https://n8n.sentinelai.adityadeoli.com/webhook/sentinel-alerts`

### Switch Node (route by risk level)

Add a **Switch** node after the webhook:
- Route on: `{{ $json.risk.level }}`
- Output 0: equals `CRITICAL`
- Output 1: equals `HIGH`
- Output 2: equals `MEDIUM`
- Fallback: catch-all

### Notification Nodes

Connect your preferred channels to each route:

**CRITICAL → Slack + Email + Discord**
```
🚨 CRITICAL: {{ $json.endpoint.name }}
URL: {{ $json.endpoint.url }}
Risk: {{ $json.risk.score }}/100
Status: {{ $json.run.status_code }}
{{ $json.anomaly ? '🤖 AI: ' + $json.anomaly.reasoning : '' }}
```

**HIGH → Slack + Email**

**MEDIUM → Slack only**

### Available Payload Fields

```
$json.event                          → "sentinel_alert"
$json.timestamp                      → ISO 8601
$json.endpoint.name                  → string
$json.endpoint.url                   → string
$json.endpoint.method                → GET/POST/...
$json.run.status_code                → integer
$json.run.response_time_ms           → float
$json.run.is_success                 → boolean
$json.run.error_message              → string or null
$json.risk.score                     → 0-100
$json.risk.level                     → LOW/MEDIUM/HIGH/CRITICAL
$json.risk.breakdown.status          → float
$json.risk.breakdown.performance     → float
$json.risk.breakdown.drift           → float
$json.risk.breakdown.ai              → float
$json.risk.breakdown.history         → float
$json.anomaly.severity_score         → float (optional)
$json.anomaly.reasoning              → string (optional)
$json.anomaly.probable_cause         → string (optional)
$json.performance.current_ms         → float (optional)
$json.performance.avg_ms             → float (optional)
$json.performance.deviation_percent  → float (optional)
$json.schema_drift.total_differences → integer (optional)
```

4. **Activate** the workflow (toggle ON)

---

## Phase 7: Verify

```bash
# Health check
curl https://api.sentinelai.adityadeoli.com/api/v1/health

# Swagger docs
open https://api.sentinelai.adityadeoli.com/docs

# Alert config
curl https://api.sentinelai.adityadeoli.com/api/v1/alerts/config

# Test webhook → n8n
curl -X POST https://api.sentinelai.adityadeoli.com/api/v1/alerts/test

# Check n8n execution log for the test payload
open https://n8n.sentinelai.adityadeoli.com
```

---

## Maintenance

### View logs
```bash
cd /home/deploy/sentinelai && docker compose logs -f api --tail 100
cd /home/deploy/sentinelai/n8n && docker compose logs -f n8n --tail 100
```

### Update SentinelAI
```bash
cd /home/deploy/sentinelai
git pull  # or rsync from local
docker compose up -d --build
```

### Update n8n
```bash
cd /home/deploy/sentinelai/n8n
docker compose pull
docker compose up -d
```

### Manual backup
```bash
bash /home/deploy/sentinelai/deploy/backup.sh
ls -la /home/deploy/backups/
```

### Restore from backup
```bash
gunzip < /home/deploy/backups/sentinel_YYYYMMDD.sql.gz \
  | docker exec -i sentinelai-db-1 psql -U sentinel sentinel_db
```

### Check disk usage
```bash
df -h
docker system df
docker system prune -f  # clean unused images/containers
```

### SSL certificate status
```bash
sudo certbot certificates
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| API returns 502 | `docker compose logs api` — app crashed? OOM? |
| n8n unreachable | `docker compose -f n8n/docker-compose.yml logs n8n` |
| SSL expired | `sudo certbot renew --force-renewal` then `docker compose restart nginx` |
| DB connection refused | `docker compose logs db` — check if Postgres is healthy |
| Webhook not received | Check `WEBHOOK_URL` in `.env`, test with `curl` directly |
| High memory usage | Consider reducing Uvicorn workers (edit Dockerfile CMD) |
