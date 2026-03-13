# SentinelAI — Product Document

**Version**: 1.0 &middot; **Last Updated**: March 2026 &middot; **Status**: Production

---

## 1. Overview

SentinelAI is an AI-powered API monitoring and observability platform that continuously monitors API endpoints, detects anomalies using GPT-4o-mini, scores risk deterministically, scans for credential leaks, tracks schema drift, validates OpenAPI contracts, and manages incidents — all from a single dashboard.

Built for engineering teams who need more than uptime pings. SentinelAI understands *why* an API is degrading, not just *that* it's down.

**Live**: [sentinelai.adityadeoli.com](https://sentinelai.adityadeoli.com)
**API**: [api.sentinelai.adityadeoli.com/docs](https://api.sentinelai.adityadeoli.com/docs)

---

## 2. Architecture

```
                          ┌─────────────────────────────────────────┐
                          │           React SPA (Vite)              │
                          │   Dashboard · Detail · Incidents · AI   │
                          └────────────────┬────────────────────────┘
                                           │ HTTPS
                          ┌────────────────▼────────────────────────┐
                          │         Nginx Reverse Proxy              │
                          │   TLS 1.3 · Rate Limit · Security Hdrs  │
                          └────────────────┬────────────────────────┘
                                           │
              ┌────────────────────────────▼────────────────────────────┐
              │                    FastAPI (Uvicorn, 4 workers)         │
              │                                                        │
              │  ┌──────────┐  ┌───────────┐  ┌──────────┐            │
              │  │ Auth/JWT │  │ REST API  │  │WebSocket │            │
              │  │ + RBAC   │  │ 70+ routes│  │ Real-time│            │
              │  └──────────┘  └───────────┘  └──────────┘            │
              │                                                        │
              │  ┌─────────────────────────────────────────────────┐   │
              │  │           Monitoring Pipeline                    │   │
              │  │                                                 │   │
              │  │  HTTP Request → Performance Tracker →           │   │
              │  │  Schema Validator → Credential Scanner →        │   │
              │  │  AI Anomaly Engine → Risk Engine →              │   │
              │  │  Contract Validator → Alert Dispatcher          │   │
              │  └─────────────────────────────────────────────────┘   │
              │                                                        │
              │  ┌──────────────┐  ┌──────────────┐  ┌────────────┐   │
              │  │  Scheduler   │  │  LLM Client  │  │  Webhook   │   │
              │  │ (APScheduler)│  │ (GPT-4o-mini)│  │  (n8n/etc) │   │
              │  └──────────────┘  └──────────────┘  └────────────┘   │
              └────────────────────────┬───────────────────────────────┘
                                       │
                          ┌────────────▼────────────────────────┐
                          │       PostgreSQL 16 (Alpine)         │
                          │  15 tables · UUID PKs · async pool   │
                          └─────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Tailwind CSS 4, Recharts, Zustand, React Query |
| Backend | Python 3.13, FastAPI, SQLAlchemy 2 (async), Alembic |
| Database | PostgreSQL 16 with asyncpg driver |
| AI | OpenAI GPT-4o-mini via async client |
| Scheduler | APScheduler (asyncio executor) |
| Infrastructure | Docker Compose, Nginx 1.27, Let's Encrypt SSL |
| Hosting | DigitalOcean (2 vCPU, 4 GB RAM, Ubuntu 24.04) |

---

## 3. Core Features

### 3.1 Monitoring Pipeline

Every monitoring run executes an 8-stage analysis pipeline:

| Stage | Engine | Output |
|-------|--------|--------|
| 1. HTTP Probe | ApiRunner | Status code, response time, response body |
| 2. Performance Analysis | PerformanceTracker | Rolling avg/median/stddev, deviation %, spike detection |
| 3. Schema Validation | SchemaValidator | Missing fields, new fields, type mismatches |
| 4. Security Scan | CredentialScanner | Credential leaks (16 pattern types) |
| 5. AI Anomaly Detection | AnomalyEngine | Severity score, diagnosis, root cause, confidence |
| 6. Risk Scoring | RiskEngine | Composite score (0-100), risk level |
| 7. Contract Validation | ContractValidator | OpenAPI spec violations |
| 8. Alert Dispatch | AlertDispatcher | Webhook notifications to n8n/Slack/etc. |

The pipeline runs on a configurable interval per endpoint (default: 5 minutes) via the APScheduler, or can be triggered on-demand via the API or CLI.

---

### 3.2 AI-Powered Anomaly Detection

SentinelAI uses GPT-4o-mini to analyze API behavior and generate structured anomaly assessments.

**Cost-Optimized**: The LLM is only invoked when at least one signal warrants investigation — status mismatch, performance spike, schema drift, or HTTP error. Healthy runs skip the AI call entirely.

**Structured Output**:
- `anomaly_detected` — boolean flag
- `severity_score` — 0 to 100 scale
- `reasoning` — human-readable explanation
- `probable_cause` — root cause hypothesis
- `confidence` — 0.0 to 1.0 trust level
- `recommendation` — actionable next step

**Resilient Fallback**: If the LLM is unavailable or errors, a deterministic rules-based engine takes over — status mismatch scores 60, critical spikes score 50, schema drift scores 40. The system never fails silently.

**Debug Assistant**: For high-severity anomalies (score >= 40), a dedicated debug prompt generates step-by-step remediation playbooks with diagnosis, debugging steps, likely root cause, severity assessment, and related patterns.

---

### 3.3 Deterministic Risk Scoring

Every API run receives a composite risk score from 0 to 100, computed from 7 weighted signals:

| Signal | Weight | What It Measures |
|--------|--------|-----------------|
| Status Match | 25% | Actual vs expected HTTP status code |
| Performance | 20% | Response time deviation from rolling average |
| Schema Drift | 12% | Number of field additions, removals, type changes |
| AI Severity | 13% | LLM anomaly severity assessment |
| Security | 13% | Credential leak count weighted by severity |
| Contract | 10% | OpenAPI spec violation count |
| History | 7% | Historical failure rate |

**Risk Levels**:
| Score | Level | Meaning |
|-------|-------|---------|
| 0–24 | LOW | Healthy, operating normally |
| 25–49 | MEDIUM | Degraded, investigate soon |
| 50–74 | HIGH | Failing, action required |
| 75–100 | CRITICAL | Catastrophic, immediate response needed |

Each component score is also returned individually, giving full transparency into what's driving the overall risk.

---

### 3.4 Credential Leak Detection

The security scanner runs 16 regex patterns against every API response body to detect accidentally exposed secrets:

| Pattern | Severity | Example Match |
|---------|----------|--------------|
| AWS Access Key | CRITICAL | `AKIA...` (20 chars) |
| AWS Secret Key | CRITICAL | `aws_secret_access_key` + base64 value |
| Private Key | CRITICAL | `-----BEGIN RSA PRIVATE KEY-----` |
| GitHub Token | CRITICAL | `ghp_...` or `ghs_...` (36+ chars) |
| GitLab Token | CRITICAL | `glpat-...` (20+ chars) |
| Stripe Key | CRITICAL | `sk_live_...` or `pk_test_...` |
| Connection String | CRITICAL | `postgres://user:pass@host` |
| JWT Token | HIGH | `eyJ...` (3 base64url segments) |
| Slack Token | HIGH | `xoxb-...` or `xoxp-...` |
| Password Field | HIGH | `"password": "..."` in JSON |
| SendGrid Key | HIGH | `SG.xxxxx.xxxxx` |
| Generic Secret | MEDIUM | `"api_key"`, `"token"`, `"client_secret"` fields |

Findings are persisted with redacted previews (first 4 + `****` + last 4 characters), deduplicated per run, and feed into the risk engine with severity-weighted scoring.

---

### 3.5 Schema Drift Detection

Tracks structural changes in API responses over time:

- **Recursive diff engine** — compares expected vs actual response schemas at every nesting level
- **Three drift types** — missing fields (removed), new fields (added), type mismatches (changed)
- **Schema snapshots** — every unique schema is stored with a SHA-256 hash, field count, and diff from the previous version
- **Visual timeline** — chronological history of all schema changes with drift badges
- **Side-by-side diff viewer** — color-coded comparison between any two snapshots
- **Accept as baseline** — one-click action to accept the current schema as the new expected shape

---

### 3.6 API Contract Testing

Upload an OpenAPI 3.x specification per endpoint and SentinelAI validates every response against it:

- **Status code validation** — checks the returned status is documented in the spec
- **Response body validation** — validates fields, types, and required properties against the schema for that status code
- **Violation tracking** — each violation includes rule, JSON path, human-readable message, and severity
- **Pipeline integration** — contract violations contribute to the risk score (weight: 10%)

---

### 3.7 Incident Management

Incidents are created automatically when anomalies exceed severity thresholds, or manually by operators.

- **Lifecycle**: OPEN → INVESTIGATING → RESOLVED
- **Severity**: LOW, MEDIUM, HIGH, CRITICAL (derived from trigger)
- **Timeline**: Every status change, note, and auto-resolution is recorded as an event
- **Auto-resolution**: Incidents auto-resolve after configurable consecutive successes (default: 3 days)
- **Notes**: Free-text notes attached to incidents for investigation tracking
- **Trigger types**: anomaly, alert_rule, manual

---

### 3.8 Alert Rules & Webhooks

Configurable per-endpoint alert rules with 7 condition types:

| Condition | Description |
|-----------|-------------|
| LATENCY_ABOVE | Response time exceeds threshold (ms) |
| FAILURE_COUNT | Consecutive failures exceed count |
| STATUS_CODE | Specific HTTP status detected |
| SCHEMA_CHANGE | Schema drift detected |
| RISK_ABOVE | Risk score exceeds threshold |
| SLA_BREACH | Uptime drops below SLA target |
| CREDENTIAL_LEAK | Security finding detected |

**Alert Dispatch**:
- Webhook delivery to configurable URL (n8n, Slack, PagerDuty, etc.)
- 15-minute cooldown per endpoint to prevent alert fatigue
- Minimum risk level gate (configurable, default: MEDIUM)
- Payload includes full pipeline context (run, risk, anomaly, security, performance)

---

### 3.9 SLA Tracking

Define uptime targets per endpoint and track compliance:

- **Configurable target**: Default 99.9%, adjustable per endpoint
- **Time windows**: 24 hours, 7 days, or 30 days
- **Uptime calculation**: (successful runs / total runs) * 100 within the window
- **Compliance status**: Boolean flag indicating whether the target is being met
- **Breach detection**: Automatic incident creation when SLA is violated
- **Dashboard integration**: Uptime overview across all monitored endpoints

---

### 3.10 Performance Analytics

Rolling statistical analysis of response times:

- **Metrics**: Mean, median, standard deviation over configurable window (3-100 runs)
- **Deviation tracking**: Current response time vs rolling average (percentage)
- **Spike detection**: Absolute deviation >= 50% flags a spike; >= 150% flags a critical spike
- **Risk integration**: Only slower-than-average deviations contribute to risk score
- **Chart visualization**: Time-series response trend graphs on the dashboard

---

### 3.11 Real-Time WebSocket Events

Org-scoped WebSocket connections broadcast live events:

| Event | Trigger |
|-------|---------|
| `new_run` | API monitoring run completed |
| `risk_update` | Risk score calculated |
| `anomaly_detected` | AI detected an anomaly |
| `incident_created` | New incident opened |
| `sla_breach` | SLA compliance violated |

Authentication via JWT token in the first WebSocket message. Connections are isolated per organization.

---

### 3.12 AI Telemetry Dashboard

Track LLM usage and costs across the platform:

- **KPI cards**: Total calls, total tokens, total cost (USD), average latency, tokens per call
- **Token usage chart**: Daily token consumption over time (area chart)
- **Cost breakdown**: Cost per endpoint (bar chart)
- **Health monitoring**: LLM success rate, error rate, last error details, model name
- **Token distribution**: Prompt vs completion token ratio with visual bar

All costs are calculated using per-model pricing tables (GPT-4o-mini: $0.15/M input, $0.60/M output tokens).

---

### 3.13 CSV Export

Download monitoring data as CSV files with optional filtering:

| Export Type | Columns |
|-------------|---------|
| Monitoring Runs | endpoint, timestamp, status code, response time, success, error |
| Incidents | endpoint, incident ID, title, status, severity, started, resolved |
| Risk Scores | endpoint, score, level, component scores (7 individual) |
| SLA Compliance | endpoint, target %, window, current uptime %, compliant |

Filters: endpoint selection, date range (24h, 7d, 30d, 90d, all time). Responses are streamed (not buffered in memory).

---

### 3.14 CLI Tool

A standalone Python CLI (`sentinel`) for terminal and CI/CD integration:

```bash
sentinel login --email admin@sentinelai.com
sentinel endpoints list                    # Table of endpoints with status
sentinel endpoints run <id-or-name>        # Trigger pipeline run
sentinel endpoints status <id-or-name>     # Latest risk, SLA, anomaly
sentinel incidents list --status open      # Open incidents
sentinel incidents resolve <id>            # Resolve incident
sentinel export runs --days 7 -o runs.csv  # Export to CSV
sentinel health                            # API health check
```

Built with Click and Rich for formatted terminal output.

---

### 3.15 CI/CD Integration

A dedicated CI endpoint for pipeline automation:

```
POST /api/v1/ci/run?endpoint_id=<uuid>
```

Returns a structured result including risk score, risk level, anomaly status, and security findings count — designed for use in GitHub Actions, GitLab CI, or any CI pipeline as a gate check.

A GitHub Actions workflow template is included at `cli/github-actions/sentinel-monitor.yml`.

---

## 4. Multi-Tenancy & Security

### Authentication
- JWT-based authentication with access tokens (15 min) and refresh tokens (7 days, httpOnly cookie)
- Token rotation on refresh (old token revoked)
- Brute-force protection: account lockout after 5 failed attempts for 15 minutes
- Rate limiting: 5 login attempts/min, 10 token refreshes/min

### Authorization
- Three roles: **ADMIN** (full access), **MEMBER** (create/edit), **VIEWER** (read-only)
- Role-based access control on all mutating endpoints
- Same email allowed across different organizations

### Tenant Isolation
- Every database query is scoped to the authenticated user's organization
- Resources from other orgs return 404 (not 403) to prevent information leakage
- WebSocket connections are org-scoped
- Audit logs capture org_id, user_id, action, IP address, and user-agent

### Infrastructure Security
- Non-root Docker containers (UID 1000)
- Nginx security headers: HSTS, CSP, X-Frame-Options, X-Content-Type-Options
- TLS 1.2/1.3 with Let's Encrypt auto-renewal
- UFW firewall (ports 22, 80, 443 only)
- fail2ban for SSH brute-force protection
- Docker log rotation (10 MB max, 3 files)

---

## 5. Database Schema

15 tables across 10 Alembic migrations:

| Table | Purpose | Key Relationships |
|-------|---------|------------------|
| organizations | Multi-tenant orgs | → users, endpoints |
| users | Auth & identity | → organization |
| api_endpoints | Monitored APIs | → runs, alerts, SLA, incidents |
| api_runs | Probe results | → risk_scores, anomalies, security_findings |
| risk_scores | Composite risk | → api_run (1:1) |
| anomalies | AI analysis | → api_run (1:1) |
| alert_rules | Alerting config | → endpoint |
| endpoint_sla | SLA targets | → endpoint (1:1) |
| incidents | Issue tracking | → endpoint, events |
| incident_events | Timeline events | → incident |
| schema_snapshots | Schema history | → endpoint |
| security_findings | Credential leaks | → api_run, endpoint |
| ai_telemetry | LLM cost tracking | → endpoint |
| audit_logs | Activity audit | → org, user |
| refresh_tokens | Token management | → user |

---

## 6. API Reference

70+ RESTful endpoints organized into 15 modules:

| Module | Routes | Description |
|--------|--------|-------------|
| Health | 2 | Liveness + detailed subsystem health |
| Auth | 4 | Login, refresh, logout, profile |
| Endpoints | 5 | CRUD for monitored API endpoints |
| Monitor | 2 | Trigger runs, get performance stats |
| Runs | 4 | Run history and failure rates |
| Anomalies | 4 | AI anomaly records |
| Risk Scores | 4 | Risk scoring records |
| Alert Rules | 6 | CRUD + toggle for alert rules |
| SLA | 5 | SLA config and uptime tracking |
| Incidents | 8 | Incident lifecycle management |
| Dashboard | 5 | Aggregate KPIs and chart data |
| Export | 4 | Streaming CSV downloads |
| Security | 3 | Credential leak findings and stats |
| Contracts | 3 | OpenAPI spec upload and validation |
| AI Telemetry | 2 | LLM usage and cost tracking |
| Debug | 1 | AI debugging suggestions |
| Schema | 2 | Schema snapshots and diffs |
| CI | 1 | CI/CD pipeline integration |
| WebSocket | 1 | Real-time event stream |
| Scheduler | 2 | Job sync and status |
| Proxy | 1 | API request proxy/tester |

Full interactive documentation available at `/docs` (Swagger UI).

---

## 7. Frontend

### Pages

| Page | Path | Description |
|------|------|-------------|
| Login | `/login` | Email + org slug authentication |
| Dashboard | `/` | KPI cards, response trends, risk distribution, uptime overview, top failures, onboarding checklist |
| Endpoint Detail | `/endpoints/:id` | Full endpoint view: runs, performance chart, risk breakdown, anomaly analysis, debug assistant, alert rules, SLA, schema drift, schema timeline, security findings, contract violations, incidents |
| Add Endpoint | `/endpoints/new` | Create endpoint with V2 config (URL, method, headers, auth, body, cookies, query params, advanced settings) |
| Edit Endpoint | `/endpoints/:id/edit` | Update endpoint configuration |
| Incidents | `/incidents` | List with status tabs (All, Open, Investigating, Resolved) |
| Incident Detail | `/incidents/:id` | Timeline, notes, status management, metadata |
| AI Telemetry | `/ai-telemetry` | LLM cost dashboard with KPI cards, charts, health monitor |
| Security | `/security` | Credential leak findings, stats cards, type breakdown |
| Export | `/export` | CSV downloads with type/date/endpoint filters |
| API Tester | `/api-tester` | Manual API testing with full request configuration |

### Design System

- **Typography**: Sentient (variable serif) for headings, Inter for body text, JetBrains Mono for code
- **Color tokens**: Design tokens for surfaces, text, borders, risk levels, accents, and semantic colors
- **Components**: Card system, button variants (primary/secondary), input styles, skeleton loaders, toast notifications
- **Charts**: Recharts (area, bar, line) with custom tooltips
- **Animations**: Fade-in, slide-in, pulse-ring keyframes
- **Responsive**: Mobile-first grid layouts, collapsible sidebar

---

## 8. Infrastructure & Deployment

### Docker Compose Services

| Service | Image | Ports | Health Check |
|---------|-------|-------|-------------|
| db | postgres:16-alpine | 5432 (internal) | `pg_isready` every 5s |
| api | Custom (Python 3.13-slim) | 8000 (internal) | `/api/v1/health` every 30s |
| nginx | nginx:1.27-alpine | 80, 443 | — |

### Deployment Flow

```bash
# 1. Server setup (one-time)
bash deploy/setup-server.sh          # Docker, UFW, fail2ban, deploy user

# 2. Deploy
bash deploy/deploy.sh email@you.com  # Docker network, SSL certs, all services

# 3. Update (ongoing)
git pull origin main
docker compose build api
docker compose up -d api
docker compose restart nginx
```

### Automated Operations
- **Health checks**: Every 5 minutes via cron (`deploy/healthcheck.sh`)
- **Database backups**: Daily at 2 AM, 7-day retention (`deploy/backup.sh`)
- **SSL renewal**: Certbot auto-renewal via cron
- **Log rotation**: Docker daemon configured for 10 MB max, 3 files

### DNS Configuration

| Subdomain | Target |
|-----------|--------|
| `sentinelai.adityadeoli.com` | Dashboard SPA |
| `api.sentinelai.adityadeoli.com` | FastAPI + Swagger |
| `n8n.sentinelai.adityadeoli.com` | n8n workflow editor |

---

## 9. Configuration Reference

### Required Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_PASSWORD` | sentinel | PostgreSQL password (change in production) |
| `SECRET_KEY` | — | JWT signing key (must set in production) |
| `OPENAI_API_KEY` | — | Required for AI anomaly detection |

### Optional Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DEBUG` | false | Enable debug mode |
| `DB_HOST` | localhost | Database host (use `db` in Docker) |
| `DB_PORT` | 5432 | Database port |
| `DB_USER` | sentinel | Database user |
| `DB_NAME` | sentinel_db | Database name |
| `OPENAI_MODEL` | gpt-4o-mini | LLM model name |
| `OPENAI_TIMEOUT_SECONDS` | 30 | LLM request timeout |
| `AI_ENABLED` | true | Enable/disable AI features |
| `SCHEDULER_ENABLED` | true | Enable/disable monitoring scheduler |
| `SCHEDULER_MAX_CONCURRENT` | 5 | Max concurrent monitoring jobs |
| `WEBHOOK_ENABLED` | true | Enable/disable webhook alerts |
| `WEBHOOK_URL` | — | Webhook destination URL |
| `WEBHOOK_TIMEOUT_SECONDS` | 10 | Webhook request timeout |
| `ALERT_MIN_RISK_LEVEL` | MEDIUM | Minimum risk level for alerts |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | 15 | JWT access token lifetime |
| `REFRESH_TOKEN_EXPIRE_DAYS` | 7 | Refresh token lifetime |
| `BCRYPT_ROUNDS` | 12 | Password hashing cost factor |
| `MAX_LOGIN_ATTEMPTS` | 5 | Failed logins before lockout |
| `LOCKOUT_MINUTES` | 15 | Account lockout duration |
| `RATE_LIMIT_ENABLED` | true | Enable/disable rate limiting |
| `FRONTEND_ORIGIN` | https://sentinelai.adityadeoli.com | CORS origin |

---

## 10. Development

### Local Setup

```bash
# Backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env                 # Configure env vars
alembic upgrade head                 # Run migrations
python scripts/seed.py               # Seed demo data
uvicorn app.main:app --reload        # Start API on :8000

# Frontend
cd frontend
npm install
npm run dev                          # Start dev server on :5173

# Docker (full stack)
docker network create sentinel-shared
docker compose up -d --build
```

### Database Migrations

```bash
alembic revision --autogenerate -m "description"
alembic upgrade head
alembic downgrade -1                 # Rollback last migration
```

### CLI Development

```bash
cd cli
pip install -e .
sentinel health
```

---

## 11. Metrics & Limits

| Metric | Value |
|--------|-------|
| Database tables | 15 |
| API endpoints | 70+ |
| Alembic migrations | 10 |
| Security scan patterns | 16 |
| Risk engine weights | 7 (summing to 100) |
| Frontend pages | 11 |
| Frontend components | 40+ |
| Alert condition types | 7 |
| WebSocket event types | 5 |
| Export formats | 4 (CSV) |
| CSV max rows | 10,000 per export |
| Default monitoring interval | 300 seconds (5 min) |
| JWT access token lifetime | 15 minutes |
| Refresh token lifetime | 7 days |
| Alert cooldown | 15 minutes per endpoint |
| Performance window | 20 runs (configurable 3-100) |
| Spike threshold | 50% deviation |
| Critical spike threshold | 150% deviation |
| Auto-resolve window | 3 days of consecutive success |
