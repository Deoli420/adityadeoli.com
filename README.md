<p align="center">
  <img src="frontend/public/logo-icon.png" alt="SentinelAI" width="80" />
</p>

<h1 align="center">SentinelAI</h1>

<p align="center">
  <strong>AI-Powered API Monitoring, Security Scanning & Risk Scoring Platform</strong>
</p>

<p align="center">
  <a href="https://sentinelai.adityadeoli.com">Live Dashboard</a> &middot;
  <a href="https://api.sentinelai.adityadeoli.com/docs">API Docs (Swagger)</a> &middot;
  <a href="https://adityadeoli.com/projects/sentinelai">Project Showcase</a> &middot;
  <a href="https://adityadeoli.com">Portfolio</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/python-3.12-3573b5?style=flat-square&logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-336791?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-strict-3178c6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind" />
  <img src="https://img.shields.io/badge/Docker-Compose-2496ed?style=flat-square&logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/OpenAI-gpt--4o--mini-412991?style=flat-square&logo=openai&logoColor=white" alt="OpenAI" />
</p>

---

A production-grade, multi-tenant platform that monitors API endpoints in real time, detects anomalies with AI, scans for credential leaks, validates API contracts against OpenAPI specs, computes 6-signal risk scores (0-100), and alerts teams through configurable webhook pipelines — before outages reach users. Includes a CLI for CI/CD integration and an AI-powered debug assistant.

Designed, architected, and built end-to-end by [Aditya Deoli](https://adityadeoli.com) — from database schema to deployment scripts.

> **28,000+ lines of code** · **75+ API endpoints** · **56+ React components** · **16 database tables** · **10 Alembic migrations** · **23 route modules**

---

## Table of Contents

- [Architecture](#architecture)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Monitoring Pipeline](#monitoring-pipeline)
- [Project Structure](#project-structure)
- [Authentication & Security](#authentication--security)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [Sentinel CLI](#sentinel-cli)
- [Deployment](#deployment)
- [Development Setup](#development-setup)
- [Engineering Decisions](#engineering-decisions)
- [Stats](#stats)

---

## Architecture

```
Internet
  │
  ▼
┌──────────────────────────────────────────────────────────────────┐
│  DigitalOcean Droplet · Ubuntu 24.04                             │
│  UFW Firewall: ports 22, 80, 443 only                            │
│                                                                  │
│  ┌─── SentinelAI stack (docker-compose.yml) ─────────────────┐  │
│  │                                                            │  │
│  │  nginx :80/:443                                            │  │
│  │    ├─ sentinelai.adityadeoli.com                           │  │
│  │    │    ├─ /assets/*  → Static (Vite hashed, 1yr cache)    │  │
│  │    │    ├─ /api/*     → FastAPI (Uvicorn, async)           │  │
│  │    │    └─ /*         → React SPA (try_files fallback)     │  │
│  │    ├─ api.sentinelai.adityadeoli.com → api:8000            │  │
│  │    ├─ n8n.sentinelai.adityadeoli.com → n8n:5678            │  │
│  │    └─ adityadeoli.com → portfolio:3000                     │  │
│  │                                                            │  │
│  │  api (FastAPI) :8000                                       │  │
│  │    ├─ 75+ REST endpoints + WebSocket (23 route modules)    │  │
│  │    ├─ JWT auth + refresh token rotation + RBAC             │  │
│  │    ├─ 14-step monitoring pipeline                          │  │
│  │    ├─ AI anomaly detection (cost-gated OpenAI gpt-4o-mini) │  │
│  │    ├─ 6-signal composite risk scoring engine               │  │
│  │    ├─ 12-pattern credential leak scanner                   │  │
│  │    ├─ OpenAPI 3.x contract validator                       │  │
│  │    ├─ AI debug assistant (LLM-powered remediation)         │  │
│  │    ├─ AI telemetry & FinOps tracking                       │  │
│  │    ├─ WebSocket: org-scoped real-time broadcast            │  │
│  │    └─ Server-side proxy (SSRF-protected)                   │  │
│  │                                                            │  │
│  │  db (PostgreSQL 16) :5432                                  │  │
│  │    └─ 16 tables, 10 Alembic migrations                    │  │
│  │                                                            │  │
│  └────────────────────────────────────────────────────────────┘  │
│                          ↕ sentinel-shared network               │
│  ┌─── n8n stack ──────────────────────────────────────────────┐  │
│  │  n8n     :5678 → workflow engine (alert routing)           │  │
│  │  n8n-db  :5432 → n8n data                                 │  │
│  └────────────────────────────────────────────────────────────┘  │
│                          ↕ sentinel-shared network               │
│  ┌─── Portfolio stack ────────────────────────────────────────┐  │
│  │  portfolio :3000 → Express + React SPA (adityadeoli.com)   │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘

External: Sentinel CLI (pip install) → calls REST API from CI/CD
```

---

## Features

### Core Monitoring
- **Automated health probes** on configurable schedules (APScheduler)
- **WebSocket real-time updates** with org-scoped connection pools + adaptive polling
- **Performance tracking** with rolling averages and spike detection

### AI Anomaly Detection
- **Cost-gated LLM analysis** — AI only invoked when rule-based signals detect anomalies ($0 when healthy)
- **Rule-based fallback** when OpenAI is unavailable
- **Structured response**: severity score, confidence, reasoning, probable cause, recommendation

### 6-Signal Risk Scoring
Composite score (0-100) from **6 weighted signals**:
- Status failure: **30%** · Performance deviation: **20%** · Schema drift: **15%**
- AI severity: **15%** · Security findings: **15%** · Historical failure rate: **5%**

### Credential Leak Detection
**12-pattern regex scanner** running on every API response:
- AWS keys (AKIA...), AWS secrets, JWT tokens (eyJ...)
- Private keys, GitHub/GitLab/Slack tokens
- Passwords in JSON fields, connection strings, Stripe keys, SendGrid keys
- Severity-weighted risk scoring (CRITICAL=1.0, HIGH=0.7, MEDIUM=0.4)

### API Contract Testing (OpenAPI 3.x)
- Upload OpenAPI spec per endpoint
- Validates status codes, required fields, type compliance
- Recursive `$ref` resolution up to 5 levels
- 4 violation types: undocumented endpoint, unexpected status, missing field, type mismatch

### AI Debug Assistant
- On-demand LLM-powered debugging with structured remediation playbooks
- Gathers full context: last 10 runs, anomaly history, SLA status, alert rules
- Returns: diagnosis, step-by-step actions, root cause, severity assessment, related patterns
- Cost-gated: only available when anomaly severity >= 40

### AI Telemetry & FinOps
- Every LLM call tracked: model, tokens, latency, cost in USD
- Per-model rate tables for accurate cost computation
- Dashboard: daily token usage, cost by endpoint, LLM health metrics

### Alert System (7 Condition Types)
Per-endpoint alert rules with stateful consecutive-match tracking:
- `LATENCY_ABOVE` · `FAILURE_COUNT` · `STATUS_CODE` · `SCHEMA_CHANGE`
- `RISK_ABOVE` · `SLA_BREACH` · `CREDENTIAL_LEAK`

### Incident Management
- Full lifecycle: OPEN → INVESTIGATING → RESOLVED
- Auto-creation from detected anomalies
- Auto-resolution after configurable consecutive successes
- Append-only timeline with audit trail

### Enhanced Schema Drift
- Schema snapshots with SHA-256 deduplication
- Side-by-side JSON diff viewer (color-coded)
- Accept current schema as new baseline
- Chronological drift timeline

### SLA Tracking
- Configurable uptime targets (24h/7d/30d windows)
- Compliance tracking on dashboard
- SLA breach detection integrated with alert rules

### Export & Reporting
- 4 CSV export types: runs, incidents, risk scores, SLA compliance
- Streaming responses for memory-efficient large exports
- Date range + endpoint filtering

### Multi-Tenant Auth & RBAC
- JWT access tokens (15-min) + httpOnly refresh cookies (SameSite=Strict)
- SHA-256 hashed refresh tokens with automatic rotation
- 3 roles: Admin, Member, Viewer
- Account lockout (5 attempts → 15-min cooldown) + audit trail

### Sentinel CLI
- Python CLI for CI/CD integration (Click + Rich + httpx)
- Commands: login, endpoints list/run/status, incidents list/resolve, export
- GitHub Actions workflow template included

### Built-in API Tester
- Postman-like HTTP client embedded in the dashboard
- Auth panel (Bearer, Basic, API Key), body editor, response viewer
- Request history, collections, cURL import/export
- SSRF-protected server-side proxy

---

## Tech Stack

### Backend
| Technology | Purpose |
|-----------|---------|
| Python 3.12 | Runtime |
| FastAPI 0.115 | Async web framework |
| SQLAlchemy 2.0 | Async ORM (repository pattern) |
| PostgreSQL 16 | Primary database |
| Alembic | Schema migrations (10 versions) |
| asyncpg | Async Postgres driver |
| httpx | Async HTTP client (API probing + webhooks) |
| APScheduler | Interval-based job scheduler |
| OpenAI | LLM-powered anomaly analysis + debug assistant |
| python-jose | JWT token encoding/decoding |
| bcrypt | Password hashing (12 rounds) |
| slowapi | Rate limiting |
| Pydantic v2 | Schema validation |
| Uvicorn | ASGI server (4 workers) |

### Frontend
| Technology | Purpose |
|-----------|---------|
| React 19 | UI framework |
| TypeScript (strict) | Type safety |
| Tailwind CSS v4 | Utility-first styling (@theme API) |
| Vite | Build tooling |
| Zustand v5 | Auth + UI state (in-memory) |
| React Query v5 | Server state + cache + polling |
| Recharts v3 | Time-series + bar charts |
| Framer Motion | Animations |
| Axios | HTTP client with 401 refresh interceptor |
| Lucide React | Icon system |

### CLI
| Technology | Purpose |
|-----------|---------|
| Click | CLI framework |
| Rich | Terminal formatting (tables, spinners) |
| httpx | HTTP client |
| Pydantic | Config management |

### Infrastructure
| Technology | Purpose |
|-----------|---------|
| Docker Compose | Container orchestration (6 services) |
| nginx 1.27 | Reverse proxy, TLS termination, rate limiting |
| Let's Encrypt | Automated SSL certificates |
| n8n | Webhook-driven alert routing |
| DigitalOcean | Hosting (Ubuntu 24.04) |
| UFW + fail2ban | Firewall + brute-force protection |

---

## Monitoring Pipeline

When APScheduler fires a probe, the system executes a **14-step pipeline**:

```
 1. Load endpoint config from DB (tenant-scoped)
 2. Execute HTTP request (httpx async, retry, 30s timeout)
 3. Persist API run record
 4. Performance analysis (rolling avg, spike detection)
 5a. Schema drift detection (expected vs actual JSON)
 5b. Schema snapshot (persist if schema evolved)
 5c. Credential leak scan (12 regex patterns)         ← Security
 5d. Contract validation (OpenAPI spec compliance)     ← Contracts
 6. AI anomaly detection (cost-gated LLM or fallback)
 7. Persist anomaly record
 8. Risk scoring (6-signal weighted composite)
 9. Persist risk score
10. Alert dispatch (webhook → n8n → Slack/Email/PagerDuty)
11. SLA breach check
12. Custom alert rule evaluation (7 condition types)
13. Incident management (auto-create/resolve)
14. WebSocket broadcast (org-scoped real-time events)
```

Each step runs in an independent `try/except` block — a failure in one step doesn't block others.

---

## Project Structure

```
SentinelAI/
├── app/                                    # FastAPI backend (~11,300 LOC)
│   ├── main.py                             # App factory, lifespan, CORS
│   ├── core/                               # Config, auth deps, rate limiting
│   ├── models/                             # 15 SQLAlchemy models → 16 tables
│   ├── schemas/                            # Pydantic request/response schemas
│   ├── repositories/                       # Tenant-scoped data access
│   ├── services/                           # Business logic layer
│   ├── monitoring/                         # Pipeline engines
│   │   ├── api_runner.py                   # HTTP probe execution
│   │   ├── runner_service.py               # 14-step pipeline orchestrator
│   │   ├── anomaly_engine.py               # AI/rule-based anomaly detection
│   │   ├── risk_engine.py                  # 6-signal risk scoring
│   │   ├── credential_scanner.py           # 12-pattern secret scanner
│   │   ├── contract_validator.py           # OpenAPI contract validation
│   │   ├── performance_tracker.py          # Rolling avg + spike detection
│   │   └── schema_validator.py             # JSON schema comparison
│   ├── ai/                                 # LLM client + prompt templates
│   ├── alerts/                             # Dispatcher, payload, webhook, rule evaluator
│   ├── api/v1/                             # 23 route modules → 75+ endpoints
│   └── scheduler/                          # APScheduler jobs
│
├── frontend/                               # React SPA (~15,900 LOC)
│   └── src/
│       ├── pages/                          # 11 page components
│       ├── components/                     # 45+ shared components
│       ├── hooks/                          # React Query hooks
│       ├── services/                       # API client functions
│       ├── stores/                         # Zustand (auth, ws, ui)
│       └── types/                          # TypeScript interfaces
│
├── cli/                                    # Sentinel CLI (~600 LOC)
│   ├── sentinel/                           # Click CLI + commands
│   └── github-actions/                     # CI workflow template
│
├── alembic/versions/                       # 10 migration files (001-010)
├── deploy/                                 # Server provisioning + deploy scripts
├── nginx/                                  # Reverse proxy config
├── docker-compose.yml                      # 6-service production stack
├── Dockerfile                              # Multi-stage Python build
├── ARCHITECTURE.md                         # In-depth architecture document
└── portfolio/                              # Portfolio site (adityadeoli.com)
```

---

## Authentication & Security

### Auth Flow
```
Login → bcrypt verify → JWT access_token (15-min) + httpOnly refresh cookie (7-day)
Refresh → SHA-256 hash lookup → rotate (revoke old, issue new)
Logout → revoke token → clear cookie → audit log
Protected → Bearer JWT → verify signature + expiry + token_version → inject tenant context
```

### Security Summary

| Layer | Protection |
|-------|-----------|
| **Passwords** | bcrypt (12 rounds), constant-time comparison |
| **Tokens** | JWT (15-min), httpOnly refresh (SameSite=Strict), SHA-256 hashed, rotation |
| **Account** | Lockout (5 attempts → 15-min), audit trail |
| **Tenancy** | `organization_id` on every repository query |
| **Proxy** | SSRF protection (RFC 1918, cloud metadata blocking) |
| **Credentials** | 12-pattern regex scanner on API responses |
| **Contracts** | OpenAPI 3.x validation with $ref resolution |
| **nginx** | TLS 1.3, HSTS, CSP, rate limiting (50r/s global, 5/min login) |
| **Infrastructure** | UFW (22/80/443), fail2ban, non-root Docker |

---

## Database Schema

**16 tables** across **10 Alembic migrations**:

| Table | Purpose | Migration |
|-------|---------|-----------|
| `organizations` | Multi-tenant orgs | 001 |
| `users` | Users with roles + lockout | 001 |
| `refresh_tokens` | SHA-256 hashed tokens | 001 |
| `audit_logs` | Auth event trail | 001 |
| `api_endpoints` | Monitored endpoints (V2 config + OpenAPI spec) | base + 002 + 010 |
| `api_runs` | Monitoring run results (denormalized org_id) | base |
| `anomalies` | AI-detected anomalies | base + 003 |
| `risk_scores` | Composite risk scores | base |
| `endpoint_sla` | SLA configurations | 004 |
| `alert_rules` | Custom alert conditions (7 types) | 005 |
| `incidents` | Incident lifecycle tracking | 006 |
| `incident_events` | Incident timeline (append-only) | 006 |
| `ai_telemetry_records` | LLM usage tracking (tokens, cost) | 007 |
| `schema_snapshots` | Schema version history (SHA-256 dedup) | 008 |
| `security_findings` | Credential leak findings | 009 |

---

## API Reference

### 75+ Endpoints across 23 Route Modules

| Group | Endpoints | Key Routes |
|-------|-----------|------------|
| **Auth** | 4 | login, refresh, logout, me |
| **Endpoints** | 5 | CRUD (list, create, get, update, delete) |
| **Monitoring** | 4 | trigger probe, performance, run history, failure rate |
| **Anomalies** | 1 | anomalies for endpoint |
| **Risk Scores** | 2 | history, latest |
| **Dashboard** | 5 | stats, trends, top failures, risk distribution, uptime |
| **SLA** | 5 | CRUD + uptime stats |
| **Alert Rules** | 6 | CRUD + toggle active |
| **Incidents** | 7 | CRUD + timeline + notes |
| **Export** | 4 | runs, incidents, risk scores, SLA (CSV) |
| **AI Telemetry** | 4 | stats, daily, by-endpoint, health |
| **Schema** | 4 | history, snapshots, diff, accept |
| **Debug** | 2 | suggest, latest |
| **Security** | 3 | findings (all + by endpoint), stats |
| **Contracts** | 3 | upload spec, violations, validate |
| **CI/CD** | 1 | run by name/ID |
| **Onboarding** | 1 | checklist status |
| **WebSocket** | 1 | real-time events |
| **Scheduler** | 2 | start, stop |
| **Alerts** | 2 | config, test webhook |
| **Proxy** | 1 | SSRF-protected proxy |
| **Health** | 1 | public health check |

Full API documentation available at [api.sentinelai.adityadeoli.com/docs](https://api.sentinelai.adityadeoli.com/docs)

---

## Sentinel CLI

```bash
# Install
pip install -e cli/

# Authenticate
sentinel login --email admin@sentinelai.com --org sentinelai

# Monitor
sentinel endpoints list                    # Rich table of endpoints
sentinel endpoints run <id-or-name>        # Trigger pipeline run
sentinel endpoints status <id-or-name>     # Risk, SLA, anomalies

# Incidents
sentinel incidents list --status open
sentinel incidents resolve <id>

# Export
sentinel export runs --days 7 --output runs.csv

# Health
sentinel health
```

### GitHub Actions Integration

```yaml
# .github/workflows/sentinel-monitor.yml
- name: Run API monitoring
  run: |
    pip install -e cli/
    sentinel login --email ${{ secrets.SENTINEL_EMAIL }}
    sentinel endpoints run "my-api"
```

---

## Deployment

```bash
# 1. Provision server
ssh root@YOUR_IP
bash deploy/setup-server.sh

# 2. Configure
cp .env.example .env    # Edit with your values

# 3. Build frontend
cd frontend && npm install && npm run build && cd ..

# 4. Deploy
docker compose up -d --build

# 5. Verify
curl https://api.sentinelai.adityadeoli.com/api/v1/health
```

---

## Development Setup

### Backend
```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
docker compose up -d db              # Start PostgreSQL
alembic upgrade head                 # Run migrations
python -m scripts.seed               # Seed admin user
uvicorn app.main:app --reload        # http://localhost:8000
```

### Frontend
```bash
cd frontend && npm install
npm run dev                          # http://localhost:5173
```

### CLI
```bash
pip install -e cli/
sentinel health
```

---

## Engineering Decisions

| Decision | Why |
|----------|-----|
| **Cost-gated AI** | LLM only called when signals are abnormal → $0 when healthy |
| **6-signal deterministic risk** | Weighted formula, no ML → same inputs = same output, fully explainable |
| **Severity-weighted security** | CRITICAL leak (AWS key) impacts risk more than MEDIUM (generic secret) |
| **Same-origin serving** | SPA + API on same domain → SameSite=Strict cookies, no CORS |
| **In-memory auth state** | Tokens never in localStorage → XSS can't steal them |
| **Refresh token rotation** | Every refresh revokes old → stolen tokens expire in minutes |
| **Repository pattern** | Every query takes tenant_id → auditable isolation |
| **Statistical baselines** | 200ms→800ms is anomalous, 2s→2.2s is normal → fewer false positives |
| **Schema snapshot dedup** | SHA-256 hash prevents storing identical schemas |
| **OpenAPI spec co-located** | JSONB on api_endpoints → single-query validation |
| **CI endpoint by name** | Human-friendly for GitHub Actions YAML |
| **Pipeline step isolation** | try/except per step → one failure doesn't block others |

---

## Stats

| Metric | Count |
|--------|-------|
| Total lines of code | ~28,000 |
| Backend Python files | 80+ |
| Frontend TSX/TS files | 56+ |
| CLI Python files | 10 |
| REST API endpoints | 75+ |
| Route modules | 23 |
| Database tables | 16 |
| Alembic migrations | 10 |
| React pages | 11 |
| React components | 45+ |
| Risk scoring signals | 6 |
| Credential scan patterns | 12 |
| Alert condition types | 7 |
| Pipeline steps | 14 |
| Docker services | 6 |

---

<p align="center">
  Built by <a href="https://adityadeoli.com">Aditya Deoli</a>
</p>
