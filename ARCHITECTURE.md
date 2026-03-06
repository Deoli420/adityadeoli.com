# SentinelAI — Architecture Document

> Multi-tenant API monitoring & risk-scoring platform with AI-powered anomaly detection, credential leak scanning, contract testing, and a CLI for CI/CD integration.

**Stack**: FastAPI (Python 3.12) · React 19 + TypeScript · PostgreSQL 16 · Docker Compose · nginx · n8n
**Lines of code**: ~28,000 across backend, frontend, CLI, and infrastructure
**Live**: `sentinelai.adityadeoli.com` (DigitalOcean droplet, Ubuntu 24.04)

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Infrastructure & Deployment](#infrastructure--deployment)
3. [Backend Architecture](#backend-architecture)
4. [Database Schema](#database-schema)
5. [Authentication & Security](#authentication--security)
6. [Monitoring Pipeline](#monitoring-pipeline)
7. [AI Anomaly Detection](#ai-anomaly-detection)
8. [Risk Scoring Engine](#risk-scoring-engine)
9. [Alert System](#alert-system)
10. [SLA Tracking](#sla-tracking)
11. [Custom Alert Rules](#custom-alert-rules)
12. [Incident Management](#incident-management)
13. [WebSocket Real-time Updates](#websocket-real-time-updates)
14. [Export & Reporting](#export--reporting)
15. [Onboarding Flow](#onboarding-flow)
16. [AI Telemetry Dashboard](#ai-telemetry-dashboard)
17. [Enhanced Schema Drift Detection](#enhanced-schema-drift-detection)
18. [AI Debug Assistant](#ai-debug-assistant)
19. [Credential Leak Detection](#credential-leak-detection)
20. [Sentinel CLI](#sentinel-cli)
21. [API Contract Testing](#api-contract-testing)
22. [Frontend Architecture](#frontend-architecture)
23. [API Reference (75+ Endpoints)](#api-reference-75-endpoints)
24. [Data Flow Examples](#data-flow-examples)
25. [Key Engineering Decisions](#key-engineering-decisions)
26. [Current Status & What's Next](#current-status--whats-next)
27. [File Structure Reference](#file-structure-reference)

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                   DigitalOcean Droplet (Ubuntu 24.04)           │
│                   IP: 64.227.143.70                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  nginx :80/:443 (reverse proxy + SSL termination)      │     │
│  │  ├─ sentinelai.adityadeoli.com → SPA + /api → :8000   │     │
│  │  ├─ api.sentinelai.adityadeoli.com → FastAPI :8000     │     │
│  │  ├─ n8n.sentinelai.adityadeoli.com → n8n :5678        │     │
│  │  └─ adityadeoli.com → portfolio :3000                  │     │
│  └────────────────────────────────────────────────────────┘     │
│                 ↕ (sentinel-shared Docker network)               │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  FastAPI Application (:8000)                           │     │
│  │  ├─ 75+ REST endpoints + WebSocket (v1 API)            │     │
│  │  ├─ 23 registered route modules                        │     │
│  │  ├─ JWT auth + refresh token rotation                  │     │
│  │  ├─ APScheduler (interval-based monitoring jobs)       │     │
│  │  ├─ Pipeline: probe → scan → detect → score → alert   │     │
│  │  ├─ Credential leak scanner (12 regex patterns)        │     │
│  │  ├─ Contract validator (OpenAPI 3.x)                   │     │
│  │  ├─ AI debug assistant (LLM-powered remediation)       │     │
│  │  ├─ WebSocket: org-scoped real-time event broadcast    │     │
│  │  └─ Server-side proxy (SSRF-protected)                 │     │
│  └────────────────────────────────────────────────────────┘     │
│                 ↕ (asyncpg connection pool)                      │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  PostgreSQL :5432                                      │     │
│  │  ├─ 16 tables (orgs, users, endpoints, runs, ...)     │     │
│  │  ├─ Alembic migrations (10 versions)                   │     │
│  │  ├─ AI telemetry + schema snapshots + security findings│     │
│  │  └─ Tenant isolation via organization_id               │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  n8n :5678 (workflow engine)                           │     │
│  │  ├─ Webhook receiver (from FastAPI alert dispatcher)   │     │
│  │  └─ Routes alerts → Slack / Email / PagerDuty          │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  Portfolio :3000 (Express + React SPA)                 │     │
│  │  └─ adityadeoli.com (separate site)                    │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

External: Sentinel CLI (pip install) → calls REST API from CI/CD
```

The SPA at `sentinelai.adityadeoli.com` is served by nginx as static files, with `/api/*` proxied to FastAPI. This **same-origin** setup means httpOnly cookies work with `SameSite=Strict` (most secure), no CORS complexity, single SSL cert.

---

## Infrastructure & Deployment

### Docker Compose Stack (6 Services)

| Service | Image | Port | Network | Purpose |
|---------|-------|------|---------|---------|
| `db` | postgres:16-alpine | 5432 | sentinel | Primary data store, persistent volume |
| `api` | Python 3.12-slim | 8000 | sentinel + sentinel-shared | FastAPI + Uvicorn, multi-worker |
| `nginx` | nginx:1.27 | 80, 443 | sentinel + sentinel-shared | Reverse proxy, SSL, rate limiting |
| `n8n` | n8n | 5678 | sentinel-shared | Alert workflow engine |
| `n8n-db` | postgres:16-alpine | 5433 | sentinel-shared | n8n's own database |
| `portfolio` | node:18-alpine | 3000 | sentinel-shared | Portfolio site (Express) |

**Networks**: `sentinel` (internal: api ↔ db ↔ nginx), `sentinel-shared` (cross-service: api ↔ n8n ↔ portfolio ↔ nginx)

### nginx Configuration

- **TLS**: 1.2/1.3 with Let's Encrypt certificates (auto-renewed daily via cron)
- **HSTS**: `max-age=31536000; includeSubDomains`
- **Rate limiting**: 50 req/s global, 5/min for `/auth/login`
- **Security headers**: CSP, X-Frame-Options DENY, X-XSS-Protection, Referrer-Policy strict-origin-when-cross-origin, Permissions-Policy
- **Gzip**: enabled for text/html, application/json, text/css, application/javascript
- **WebSocket upgrade**: supported (for n8n)
- **HTTP → HTTPS**: automatic redirect

### Deploy Scripts (`deploy/`)

| Script | Purpose |
|--------|---------|
| `setup-server.sh` | Initial provisioning: Docker, UFW (22/80/443 only), fail2ban |
| `deploy.sh` | Full deploy: build images, Certbot SSL, start compose, setup cron |
| `healthcheck.sh` | Every 5 min: verify services running, restart if down |
| `backup.sh` | Daily PostgreSQL backup to local disk |

### Environment Configuration (`.env`)

```
# Database
DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME

# AI
OPENAI_API_KEY          (optional — enables AI anomaly analysis + debug assistant)
OPENAI_MODEL            (default: gpt-4o-mini)

# Auth
SECRET_KEY              (JWT signing key)
JWT_ALGORITHM           (default: HS256)
ACCESS_TOKEN_EXPIRE_MINUTES  (default: 15)
REFRESH_TOKEN_EXPIRE_DAYS    (default: 7)
BCRYPT_ROUNDS           (default: 12)
MAX_LOGIN_ATTEMPTS      (default: 5)
LOCKOUT_MINUTES         (default: 15)

# Scheduler
SCHEDULER_ENABLED       (default: true)
SCHEDULER_MAX_CONCURRENT (default: 5)

# Alerts
WEBHOOK_ENABLED         (default: true)
WEBHOOK_URL             (n8n webhook endpoint)
ALERT_MIN_RISK_LEVEL    (default: MEDIUM)

# CORS
FRONTEND_ORIGIN         (e.g., https://sentinelai.adityadeoli.com)
```

---

## Backend Architecture

### Layered Design (4 Layers)

Each layer only communicates downward. No layer skips:

```
Routes  (app/api/v1/*.py)           ← HTTP in/out, Pydantic validation
   ↓
Services (app/services/*.py)        ← Business logic, orchestration
   ↓
Repositories (app/repositories/*.py) ← Tenant-scoped DB queries
   ↓
Models (app/models/*.py)            ← SQLAlchemy ORM → PostgreSQL
```

**Why this matters:**
- Every DB query is scoped by `organization_id` at the repository layer — easy to audit tenant isolation
- Business logic lives in services — testable without mocking the database
- Routes stay thin: validation + dependency injection only
- Schema changes impact one layer only

### Key Backend Files

| File | Purpose |
|------|---------|
| `app/main.py` | App factory, lifespan events (DB pool + scheduler), CORS middleware |
| `app/core/config.py` | Pydantic Settings (25+ config values from `.env`) |
| `app/core/auth.py` | FastAPI dependencies: `get_current_user`, `require_role(ADMIN)` |
| `app/core/rate_limit.py` | slowapi rate limiter setup |
| `app/db/session.py` | Async SQLAlchemy session factory (asyncpg) |
| `app/db/base.py` | Declarative Base + metadata |
| `app/monitoring/credential_scanner.py` | 12-pattern regex credential leak scanner |
| `app/monitoring/contract_validator.py` | OpenAPI 3.x contract validator with `$ref` resolution |
| `app/services/debug_assistant.py` | AI-powered debugging suggestion generator |
| `app/ai/llm_client.py` | OpenAI client with token tracking + telemetry persistence |

### Application Lifecycle (`main.py`)

```python
@asynccontextmanager
async def lifespan(app):
    # STARTUP
    await init_db()              # Create async engine + session factory
    await run_migrations()       # Alembic upgrade head
    if settings.SCHEDULER_ENABLED:
        scheduler.startup()      # Start APScheduler
        await scheduler.sync_jobs()  # Load all endpoints as jobs
    yield
    # SHUTDOWN
    scheduler.shutdown()
    await close_db()
```

---

## Database Schema

### 16 Tables

```
organizations
├── id              UUID PK
├── name            VARCHAR(100) NOT NULL
├── slug            VARCHAR(100) UNIQUE NOT NULL
├── is_active       BOOLEAN DEFAULT true
├── created_at      TIMESTAMP
└── updated_at      TIMESTAMP

users
├── id              UUID PK
├── email           VARCHAR(255) UNIQUE per org
├── password_hash   VARCHAR(255) (bcrypt, 12 rounds)
├── display_name    VARCHAR(100)
├── role            ENUM(ADMIN, MEMBER, VIEWER)
├── organization_id UUID FK → organizations
├── token_version   INT DEFAULT 0 (for mass JWT invalidation)
├── is_active       BOOLEAN DEFAULT true
├── failed_login_attempts INT DEFAULT 0
├── locked_until    TIMESTAMP NULLABLE
├── created_at      TIMESTAMP
└── updated_at      TIMESTAMP

refresh_tokens
├── id              UUID PK
├── user_id         UUID FK → users
├── token_hash      VARCHAR(255) INDEXED (SHA-256)
├── expires_at      TIMESTAMP
├── is_revoked      BOOLEAN DEFAULT false
└── created_at      TIMESTAMP

audit_logs
├── id              UUID PK
├── organization_id UUID FK NULLABLE
├── user_id         UUID FK NULLABLE
├── action          VARCHAR (LOGIN_SUCCESS, LOGIN_FAILED, LOGOUT, TOKEN_REFRESH, ...)
├── ip_address      VARCHAR
├── user_agent      VARCHAR
├── detail          JSONB NULLABLE
└── created_at      TIMESTAMP INDEXED

api_endpoints
├── id              UUID PK
├── organization_id UUID FK → organizations
├── name            VARCHAR NOT NULL
├── url             VARCHAR NOT NULL
├── method          VARCHAR DEFAULT 'GET'
├── expected_status INT NULLABLE
├── expected_schema JSONB NULLABLE
├── monitoring_interval_seconds INT DEFAULT 300
│
│   V2 Config (migration 002):
├── query_params    JSONB
├── request_headers JSONB
├── cookies         JSONB
├── auth_config     JSONB  {type: bearer|basic|api-key, ...}
├── body_config     JSONB  {type: json|form|urlencoded, content: ...}
├── advanced_config JSONB
├── config_version  INT DEFAULT 1
│
│   Contract Testing (migration 010):
├── openapi_spec    JSONB NULLABLE  ← OpenAPI 3.x spec for contract validation
│
├── created_at      TIMESTAMP
└── updated_at      TIMESTAMP

api_runs
├── id              UUID PK
├── endpoint_id     UUID FK → api_endpoints
├── organization_id UUID FK (DENORMALIZED — avoids join on dashboard)
├── status_code     INT NULLABLE
├── response_time_ms INT NULLABLE
├── response_body   TEXT NULLABLE
├── is_success      BOOLEAN
├── error_message   TEXT NULLABLE
└── created_at      TIMESTAMP INDEXED

anomalies
├── id              UUID PK
├── api_run_id      UUID FK → api_runs (UNIQUE)
├── anomaly_detected BOOLEAN
├── severity_score  INT (0-100)
├── confidence      FLOAT (0-1)
├── reasoning       TEXT
├── probable_cause  TEXT
├── recommendation  TEXT
├── ai_called       BOOLEAN (tracking: was LLM used?)
├── used_fallback   BOOLEAN (tracking: did rule-based run?)
└── created_at      TIMESTAMP

risk_scores
├── id              UUID PK
├── api_run_id      UUID FK → api_runs (UNIQUE)
├── calculated_score INT (0-100)
├── risk_level      ENUM(LOW, MEDIUM, HIGH, CRITICAL)
└── created_at      TIMESTAMP

endpoint_sla  (Phase 1 — SLA Tracking)
├── id              UUID PK
├── endpoint_id     UUID FK → api_endpoints
├── organization_id UUID FK → organizations
├── sla_target_percent FLOAT (e.g. 99.9)
├── uptime_window   ENUM(24h, 7d, 30d)
├── is_active       BOOLEAN DEFAULT true
├── created_at      TIMESTAMP
└── updated_at      TIMESTAMP

alert_rules  (Phase 2 — Custom Alert Rules)
├── id              UUID PK
├── endpoint_id     UUID FK → api_endpoints
├── organization_id UUID FK → organizations
├── name            VARCHAR NOT NULL
├── condition_type  ENUM(LATENCY_ABOVE, FAILURE_COUNT, STATUS_CODE,
│                        SCHEMA_CHANGE, RISK_ABOVE, SLA_BREACH,
│                        CREDENTIAL_LEAK)   ← Phase 10 addition
├── threshold       FLOAT NOT NULL
├── consecutive_count INT DEFAULT 1
├── current_consecutive INT DEFAULT 0
├── is_active       BOOLEAN DEFAULT true
├── last_triggered_at TIMESTAMP NULLABLE
├── created_at      TIMESTAMP
└── updated_at      TIMESTAMP

incidents  (Phase 3 — Incident Management)
├── id              UUID PK
├── endpoint_id     UUID FK → api_endpoints
├── organization_id UUID FK → organizations
├── title           VARCHAR NOT NULL
├── status          ENUM(OPEN, INVESTIGATING, RESOLVED)
├── severity        ENUM(LOW, MEDIUM, HIGH, CRITICAL)
├── trigger_type    ENUM(anomaly, alert_rule, manual)
├── trigger_run_id  UUID FK → api_runs NULLABLE
├── notes           TEXT NULLABLE
├── started_at      TIMESTAMP DEFAULT now
├── acknowledged_at TIMESTAMP NULLABLE
├── resolved_at     TIMESTAMP NULLABLE
├── auto_resolve_after INT DEFAULT 5
├── created_at      TIMESTAMP
└── updated_at      TIMESTAMP

incident_events  (Phase 3 — Incident Timeline)
├── id              UUID PK
├── incident_id     UUID FK → incidents
├── event_type      ENUM(created, status_change, note_added, auto_resolved)
├── detail          JSONB NULLABLE
└── created_at      TIMESTAMP INDEXED

ai_telemetry_records  (Phase 7 — AI FinOps)
├── id              UUID PK
├── endpoint_id     UUID FK → api_endpoints NULLABLE
├── organization_id UUID FK → organizations
├── model_name      VARCHAR (e.g. "gpt-4o-mini")
├── prompt_tokens   INT
├── completion_tokens INT
├── total_tokens    INT
├── latency_ms      FLOAT
├── success         BOOLEAN
├── cost_usd        FLOAT (computed from per-model rate table)
├── error_message   TEXT NULLABLE
└── created_at      TIMESTAMP INDEXED

schema_snapshots  (Phase 8 — Schema Drift History)
├── id              UUID PK
├── endpoint_id     UUID FK → api_endpoints
├── organization_id UUID FK → organizations
├── schema_hash     VARCHAR(64) (SHA-256 of normalized schema)
├── schema_body     JSONB (full schema at point-in-time)
├── diff_from_previous JSONB NULLABLE (field-level diff)
├── field_count     INT
├── created_at      TIMESTAMP INDEXED
└── UNIQUE(endpoint_id, schema_hash)   ← deduplicate identical schemas

security_findings  (Phase 10 — Credential Leak Detection)
├── id              UUID PK
├── api_run_id      UUID FK → api_runs
├── endpoint_id     UUID FK → api_endpoints
├── organization_id UUID FK → organizations
├── finding_type    VARCHAR (AWS_KEY, JWT, PRIVATE_KEY, PASSWORD, ...)
├── pattern_name    VARCHAR (human-readable pattern name)
├── field_path      VARCHAR NULLABLE (JSON path where found)
├── severity        VARCHAR (CRITICAL, HIGH, MEDIUM)
├── redacted_preview VARCHAR (first 20 chars with redaction)
├── match_count     INT DEFAULT 1
└── created_at      TIMESTAMP INDEXED
```

### Key Schema Decisions

- **`organization_id` denormalized on `api_runs`**: Avoids joining through `api_endpoints` for dashboard queries. Critical as runs table scales to millions of rows.
- **`token_hash` SHA-256 indexed**: Refresh token lookup is O(1). Raw tokens never stored.
- **`token_version` on users**: Increment to invalidate ALL tokens for a user (password change, compromise).
- **Cascade deletes**: Deleting an organization cascades to all child records.
- **`api_run_id` UNIQUE on anomalies/risk_scores**: Enforces 1:1 relationship per run.
- **`current_consecutive` on alert_rules**: Stateful counter avoids re-querying run history on every evaluation.
- **`auto_resolve_after` on incidents**: Configurable consecutive-success threshold for auto-resolution (default 5).
- **Incident events as separate table**: Timeline/audit trail decoupled from incident state — append-only, never modified.
- **`schema_hash` UNIQUE constraint**: Prevents storing duplicate schema snapshots — only new shapes trigger a new row.
- **`cost_usd` pre-computed on telemetry**: Avoids runtime rate lookups — cost calculated at write time using per-model rate table.
- **`openapi_spec` on api_endpoints**: Co-located with the endpoint for single-query contract validation — no join needed.
- **`CREDENTIAL_LEAK` condition type**: Extends the alert rules enum so users can set alert rules that fire on security findings.

### Alembic Migrations (10 Versions)

| Version | Purpose |
|---------|---------|
| `001_add_auth_tables` | organizations, users, refresh_tokens, audit_logs |
| `002_add_v2_endpoint_config` | V2 columns on api_endpoints (headers, auth, body, etc.) |
| `003_add_anomaly_trust_fields` | `ai_called` + `used_fallback` on anomalies |
| `004_sla_and_dashboard` | endpoint_sla table + dashboard chart support |
| `005_add_alert_rules` | alert_rules table for custom alerting conditions |
| `006_add_incidents` | incidents + incident_events tables for incident lifecycle |
| `007_add_ai_telemetry` | ai_telemetry_records table for LLM usage tracking |
| `008_add_schema_snapshots` | schema_snapshots table for drift history |
| `009_add_security_findings` | security_findings table for credential leak detection |
| `010_add_openapi_spec` | `openapi_spec` JSONB column on api_endpoints |

---

## Authentication & Security

### JWT Authentication Flow

```
1. LOGIN: POST /api/v1/auth/login { email, password, organization_slug }
   ├─ Find org by slug, verify is_active
   ├─ Find user by email + org, verify is_active
   ├─ Check lockout (403 if locked_until > now)
   ├─ bcrypt.verify(password, password_hash) — constant-time
   ├─ On FAILURE:
   │   ├─ Increment failed_login_attempts
   │   ├─ If >= 5: set locked_until = now + 15 min
   │   └─ Audit log: LOGIN_FAILED
   ├─ On SUCCESS:
   │   ├─ Reset failed_login_attempts to 0
   │   ├─ Generate access_token (JWT, 15-min expiry)
   │   │   Payload: { sub: user_id, org: org_id, role: ADMIN|MEMBER|VIEWER, tv: token_version }
   │   ├─ Generate refresh_token (UUID → SHA-256 hash → store in DB, 7-day expiry)
   │   ├─ Audit log: LOGIN_SUCCESS
   │   └─ Response: { access_token } + Set-Cookie: refresh_token (httpOnly, SameSite=Strict, Secure)
   └─ Rate limit: 5 requests/minute

2. REFRESH: POST /api/v1/auth/refresh (cookie: refresh_token)
   ├─ Read refresh_token from httpOnly cookie
   ├─ SHA-256 hash it → lookup in DB
   ├─ Verify: not revoked, not expired, user active, org active, token_version matches
   ├─ ROTATE: revoke old token, issue new refresh_token + new access_token
   └─ Rate limit: 10 requests/minute

3. LOGOUT: POST /api/v1/auth/logout
   ├─ Revoke refresh token in DB
   ├─ Clear httpOnly cookie
   ├─ Audit log: LOGOUT
   └─ Response: 204

4. PROTECTED ROUTES: GET /api/v1/endpoints/ etc.
   ├─ Authorization: Bearer {access_token}
   ├─ Decode JWT, verify signature + expiry + token_version
   ├─ Inject current_user + organization_id into route handler
   └─ On 401: frontend auto-refreshes via /auth/refresh, replays request
```

### Security Hardening Summary

| Layer | Protection |
|-------|-----------|
| Passwords | bcrypt (12 rounds), constant-time comparison |
| Login | Rate limited (5/min), account lockout (5 attempts → 15-min lock) |
| Access Token | 15-min expiry, never in cookies/localStorage |
| Refresh Token | SHA-256 hashed in DB, rotated on every refresh, httpOnly + SameSite=Strict |
| Token Invalidation | Per-session (revoke refresh), per-user (increment token_version) |
| Tenant Isolation | `organization_id` on every repository query |
| SSRF Protection | DNS resolve → RFC 1918 blocklist, cloud metadata IP blocked (169.254.169.254) |
| Credential Scanning | 12-pattern regex scanner detects leaked secrets in API responses |
| nginx | TLS 1.2/1.3, HSTS, rate limiting, security headers (CSP, X-Frame-Options) |
| Audit Trail | All auth events logged: IP, user-agent, action, timestamp |
| Infrastructure | UFW (22/80/443 only), fail2ban (SSH brute-force), non-root Docker containers |

---

## Monitoring Pipeline

When APScheduler fires a job for an endpoint, this is the complete execution path:

```
 STEP 1: LOAD ENDPOINT
 └─ Repository fetches ApiEndpoint from DB (tenant-scoped)

 STEP 2: EXECUTE HTTP REQUEST  (app/monitoring/api_runner.py)
 └─ ApiRunner.execute()
    ├─ Build httpx request from V2 config (headers, auth, params, body, cookies)
    ├─ Retry on network errors (max 2 attempts, exponential backoff)
    ├─ Timeout: 30s
    ├─ Response body capped at 512KB
    └─ Returns: RunResult(status_code, response_time_ms, response_body, is_success, error)

 STEP 3: PERSIST API_RUN
 └─ Save RunResult to DB as ApiRun record

 STEP 4: PERFORMANCE ANALYSIS  (app/monitoring/performance_tracker.py)
 └─ PerformanceTracker.analyse()
    ├─ Fetch last 20 response times from DB
    ├─ Compute rolling average
    ├─ Detect spike: deviation > 150% of rolling avg
    ├─ Detect critical spike: deviation > 300%
    └─ Returns: PerformanceResult(rolling_avg_ms, deviation_percent, is_spike, is_critical_spike)

 STEP 5a: SCHEMA DRIFT DETECTION  (app/monitoring/schema_validator.py)
 └─ SchemaValidator.validate()
    ├─ If expected_schema is null → skip
    ├─ Compare expected vs actual JSON structure
    ├─ Count field-level differences (added, removed, changed)
    └─ Returns: DriftAnalysis(has_drift, drift_count, diff)

 STEP 5b: SCHEMA SNAPSHOT  (app/services/schema_snapshot.py)
 └─ snapshot_if_changed()
    ├─ Hash current response schema (SHA-256)
    ├─ If hash differs from latest snapshot → persist new snapshot + diff
    └─ Enables historical drift timeline tracking

 STEP 5c: CREDENTIAL LEAK SCAN  (app/monitoring/credential_scanner.py)   ← Phase 10
 └─ CredentialScanner.scan()
    ├─ Run 12 regex patterns against response body:
    │   ├─ AWS_KEY (AKIA...), AWS_SECRET (40-char base64)
    │   ├─ JWT (eyJ...), PRIVATE_KEY (-----BEGIN)
    │   ├─ GITHUB_TOKEN (ghp_/gho_/ghs_), GITLAB_TOKEN (glpat-)
    │   ├─ SLACK_TOKEN (xoxb-/xoxp-/xoxs-)
    │   ├─ PASSWORD ("password": / "passwd":)
    │   ├─ GENERIC_SECRET ("secret":/"token":/"api_key":)
    │   ├─ CONNECTION_STRING (://user:pass@host)
    │   ├─ STRIPE_KEY (sk_live_/pk_live_/rk_live_)
    │   └─ SENDGRID_KEY (SG.)
    ├─ Persist SecurityFinding records for each match
    └─ Returns: ScanResult(has_findings, findings_count, findings[])

 STEP 5d: CONTRACT VALIDATION  (app/monitoring/contract_validator.py)   ← Phase 12
 └─ ContractValidator.validate()  (only if openapi_spec is uploaded)
    ├─ Find matching path+method in OpenAPI spec (suffix match)
    ├─ Check: status code documented?
    ├─ Check: response body matches schema? (recursive with $ref resolution)
    ├─ Check: required fields present?
    ├─ Check: field types match? (integer, string, boolean, array, object)
    └─ Returns: ContractResult(violations[Violation(rule, path, message, severity)])

 STEP 6: ANOMALY DETECTION  (app/monitoring/anomaly_engine.py)   ← COST-GATED
 └─ AnomalyEngine.analyse()
    ├─ Collect signals:
    │   ├─ status_failure (non-2xx or != expected_status)
    │   ├─ http_error (connection refused, timeout, DNS failure)
    │   ├─ latency_spike (from performance tracker)
    │   ├─ critical_latency_spike
    │   └─ schema_drift (from schema validator)
    ├─ If NO signals → return NO_ANOMALY (skip LLM — saves cost)
    ├─ If signals AND LLM available:
    │   ├─ Build prompt with all context (endpoint info, run result, perf data, drift data)
    │   ├─ Call OpenAI API (gpt-4o-mini)
    │   ├─ Parse structured JSON response
    │   ├─ Persist AI telemetry record (tokens, latency, cost)   ← Phase 7
    │   └─ Returns: AnomalyResult(severity_score, confidence, reasoning, probable_cause, recommendation)
    └─ If LLM unavailable OR fails:
        ├─ Rule-based fallback: compute severity from signal weights
        └─ Returns: AnomalyResult with used_fallback=true

 STEP 7: PERSIST ANOMALY
 └─ If anomaly_detected → save Anomaly record linked to api_run

 STEP 8: RISK SCORING  (app/monitoring/risk_engine.py)   ← ALWAYS RUNS
 └─ RiskEngine.score()
    ├─ Weighted composite of 6 signals:
    │   ├─ Status failure:          30% weight
    │   ├─ Performance deviation:   20% weight
    │   ├─ Schema drift:            15% weight
    │   ├─ AI severity score:       15% weight
    │   ├─ Security findings:       15% weight   ← Phase 10 addition
    │   └─ Historical failure rate:  5% weight
    ├─ Security scoring: severity-weighted count
    │   (CRITICAL=1.0, HIGH=0.7, MEDIUM=0.4, LOW=0.2)
    ├─ Clamp to 0-100
    ├─ Classify: 0-24 LOW, 25-49 MEDIUM, 50-74 HIGH, 75-100 CRITICAL
    └─ Returns: RiskResult(calculated_score, risk_level, component_scores, security_score)

 STEP 9: PERSIST RISK SCORE
 └─ Save RiskScore record linked to api_run (always, even if score is 0)

 STEP 10: ALERT DISPATCH  (app/alerts/dispatcher.py)
 └─ maybe_alert()
    ├─ Check: risk_level >= ALERT_MIN_RISK_LEVEL?
    ├─ Build alert payload (endpoint name, URL, risk, anomaly reasoning, perf data)
    ├─ POST webhook to n8n
    └─ n8n routes by severity:
       ├─ CRITICAL → Slack + Email + PagerDuty
       ├─ HIGH     → Slack + Email
       ├─ MEDIUM   → Slack only
       └─ LOW      → skipped

 STEP 11: SLA BREACH CHECK  (app/scheduler/jobs.py)
 └─ _check_sla_breach(endpoint_id, pipeline)
    ├─ Load active SLA config for endpoint
    ├─ Calculate current uptime % for window (24h/7d/30d)
    ├─ If uptime < sla_target_percent → breach detected
    └─ Dispatch sla_breach event

 STEP 12: CUSTOM ALERT RULES  (app/scheduler/jobs.py)
 └─ _evaluate_alert_rules(endpoint_id, pipeline)
    ├─ Load all active alert rules for endpoint
    ├─ For each rule, check condition against pipeline data:
    │   ├─ LATENCY_ABOVE: response_time_ms > threshold
    │   ├─ FAILURE_COUNT: consecutive failures > threshold
    │   ├─ STATUS_CODE: status_code matches threshold
    │   ├─ SCHEMA_CHANGE: schema drift detected
    │   ├─ RISK_ABOVE: risk score > threshold
    │   ├─ SLA_BREACH: current uptime below SLA target
    │   └─ CREDENTIAL_LEAK: security scan has findings   ← Phase 10
    ├─ Track consecutive matches via current_consecutive counter
    └─ Trigger alert when consecutive_count reached

 STEP 13: INCIDENT MANAGEMENT  (app/scheduler/jobs.py)
 └─ _manage_incidents(endpoint_id, pipeline)
    ├─ AUTO-CREATE: If anomaly detected → create OPEN incident
    ├─ AUTO-RESOLVE: If consecutive successes >= auto_resolve_after
    └─ Commit changes

 STEP 14: WEBSOCKET BROADCAST  (app/scheduler/jobs.py)
 └─ _broadcast_pipeline_events(endpoint_id, pipeline)
    ├─ Always: broadcast "new_run" event
    ├─ Always: broadcast "risk_update" with score + level
    ├─ If anomaly: broadcast "anomaly_detected"
    ├─ If incident created: broadcast "incident_created"
    └─ If SLA breach: broadcast "sla_breach"
    (All events scoped to organization_id via ConnectionManager)
```

**Key insight**: The entire pipeline is **async**. Multiple endpoints probe in parallel via APScheduler's concurrent job execution (capped at `SCHEDULER_MAX_CONCURRENT`). Steps 11-14 each run in independent `try/except` blocks so a failure in one doesn't block others.

---

## AI Anomaly Detection

### How It Works (`app/monitoring/anomaly_engine.py` + `app/ai/`)

The AI layer is **cost-gated**: the LLM is only called when rule-based signals detect something abnormal.

```
Signals collected:
  ├─ is_success = false?             → STATUS_FAILURE
  ├─ error_message present?          → HTTP_ERROR
  ├─ performance.is_spike?           → LATENCY_SPIKE
  ├─ performance.is_critical_spike?  → CRITICAL_LATENCY_SPIKE
  └─ drift.has_drift?                → SCHEMA_DRIFT

Decision tree:
  ├─ 0 signals → return NO_ANOMALY (no LLM call, $0 cost)
  ├─ 1+ signals AND OPENAI_API_KEY set:
  │   ├─ Build prompt with full context
  │   ├─ Call OpenAI (gpt-4o-mini) → structured JSON response
  │   ├─ Parse: anomaly_detected, severity_score (0-100), confidence (0-1),
  │   │         reasoning, probable_cause, recommendation
  │   ├─ Persist telemetry: tokens, latency, cost_usd   ← Phase 7
  │   └─ Return AnomalyResult(ai_called=true)
  └─ 1+ signals AND no API key OR LLM failure:
      ├─ Rule-based fallback:
      │   ├─ STATUS_FAILURE → severity 60
      │   ├─ HTTP_ERROR → severity 80
      │   ├─ CRITICAL_LATENCY_SPIKE → severity 50
      │   ├─ LATENCY_SPIKE → severity 30
      │   ├─ SCHEMA_DRIFT → severity 40
      │   └─ Max of all signals = final severity
      └─ Return AnomalyResult(used_fallback=true)
```

### LLM Prompt Structure (`app/ai/prompt_templates.py`)

The system prompt instructs the LLM to act as an API reliability engineer. Two prompt types:

1. **Anomaly Analysis Prompt** — used during pipeline runs:
   - Endpoint name, URL, method
   - Status code received vs expected
   - Response time vs rolling average
   - Error message (if any)
   - Schema drift details (if any)
   - Last 5 run results for context
   - Response format: strict JSON with `anomaly_detected`, `severity_score`, `confidence`, `reasoning`, `probable_cause`, `recommendation`

2. **Debug Assistant Prompt** — used for on-demand debugging (Phase 9):
   - Full context: last 10 runs, anomaly history, SLA status, alert rules
   - Response format: `diagnosis`, `steps[]`, `likely_root_cause`, `severity_assessment`, `related_patterns[]`

---

## Risk Scoring Engine

### How It Works (`app/monitoring/risk_engine.py`)

Pure computation — no I/O, no LLM calls. Deterministic and explainable.

```
Input signals (6 components):
  ├─ is_success (boolean)              → 30% weight (binary: 0 or 100)
  ├─ performance.deviation_percent     → 20% weight (continuous: 0-100+)
  ├─ drift.has_drift (boolean)         → 15% weight (binary: 0 or 100)
  ├─ anomaly.severity_score (0-100)    → 15% weight (continuous)
  ├─ security findings (count)         → 15% weight (severity-weighted)    ← Phase 10
  └─ historical_failure_rate (0-1)     →  5% weight (continuous: % failed in 24h)

Security scoring:
  ├─ Severity multipliers: CRITICAL=1.0, HIGH=0.7, MEDIUM=0.4, LOW=0.2
  ├─ Weighted count = Σ(finding × multiplier)
  └─ Normalized to 0-100 (capped at count >= 5)

Calculation:
  raw_score = (status * 0.30)
            + (min(perf_deviation, 100) * 0.20)
            + (drift * 0.15)
            + (ai_severity * 0.15)
            + (security * 0.15)
            + (failure_rate * 100 * 0.05)

  final_score = clamp(raw_score, 0, 100)

Risk levels:
  0-24:   LOW
  25-49:  MEDIUM
  50-74:  HIGH
  75-100: CRITICAL
```

**Why deterministic?** Same inputs always produce same outputs. Users can see exactly why their score is high (component breakdown visible in UI). No model drift, no retraining, fully auditable.

---

## Alert System

### Architecture (`app/alerts/`)

```
alerts/
├── dispatcher.py    → Gate: should we alert? (risk_level >= threshold)
├── payload.py       → Build structured alert payload
├── webhook.py       → Send POST to n8n via httpx
└── rule_evaluator.py → Evaluate custom alert rules (7 condition types)
```

### Flow

```
RiskResult received
  ↓
dispatcher.maybe_alert(endpoint, risk_result, anomaly_result, performance_result)
  ├─ if risk_level < ALERT_MIN_RISK_LEVEL → skip
  ├─ Build payload:
  │   {
  │     endpoint: { name, url, method },
  │     risk: { score, level, components },
  │     anomaly: { detected, severity, reasoning, probable_cause, recommendation },
  │     performance: { response_time_ms, rolling_avg_ms, deviation_percent },
  │     timestamp, organization_id
  │   }
  ├─ POST to WEBHOOK_URL (n8n)
  └─ n8n workflow:
      ├─ CRITICAL → Slack #alerts + Email ops-team + PagerDuty incident
      ├─ HIGH     → Slack #alerts + Email ops-team
      ├─ MEDIUM   → Slack #alerts
      └─ LOW      → no action
```

---

## SLA Tracking

### Architecture (`app/services/endpoint_sla.py`, `app/api/v1/sla.py`)

Each endpoint can have an active SLA configuration with a target uptime percentage and a measurement window.

```
SLA Config:
  ├─ sla_target_percent: 99.9 (user-defined)
  ├─ uptime_window: 24h | 7d | 30d
  └─ is_active: boolean

Uptime Calculation:
  ├─ Query all runs within window for endpoint
  ├─ uptime % = (successful_runs / total_runs) × 100
  ├─ Compare against target
  └─ Display compliance status in dashboard

Dashboard Integration:
  ├─ /api/v1/dashboard/uptime-overview → all endpoints with SLA
  ├─ Each entry shows: endpoint name, target %, actual %, window, compliance
  └─ Visual: progress bars with green (compliant) / red (breaching) indicators
```

---

## Custom Alert Rules

### Architecture (`app/services/alert_rule.py`, `app/api/v1/alert_rules.py`)

Users can create custom alerting conditions per endpoint. Rules are evaluated on every monitoring run.

```
Rule Definition:
  ├─ name: "High latency alert"
  ├─ condition_type: LATENCY_ABOVE | FAILURE_COUNT | STATUS_CODE |
  │                  SCHEMA_CHANGE | RISK_ABOVE | SLA_BREACH |
  │                  CREDENTIAL_LEAK
  ├─ threshold: 2000 (e.g., 2000ms for latency)
  ├─ consecutive_count: 3 (must match N times in a row)
  └─ is_active: toggle on/off without deleting

Evaluation Flow (per run):
  ├─ Load all active rules for endpoint
  ├─ For each rule:
  │   ├─ Check condition against current pipeline data
  │   ├─ If match → increment current_consecutive
  │   ├─ If no match → reset current_consecutive to 0
  │   ├─ If current_consecutive >= consecutive_count → TRIGGER
  │   │   ├─ Update last_triggered_at
  │   │   └─ Dispatch alert via webhook
  │   └─ Persist counter state
  └─ Stateful tracking avoids re-querying run history
```

---

## Incident Management

### Architecture (`app/services/incident.py`, `app/api/v1/incidents.py`)

Incidents provide lifecycle tracking for anomalies — from detection through investigation to resolution.

```
Incident Lifecycle:
  OPEN → INVESTIGATING → RESOLVED
    │         │              ↑
    │         └──────────────┤ (manual resolve)
    └────────────────────────┘ (auto-resolve after N consecutive successes)

Auto-Creation (from scheduler):
  ├─ Anomaly detected with is_anomaly=true
  ├─ Create OPEN incident with:
  │   ├─ title: "Anomaly on {endpoint_name}"
  │   ├─ severity: mapped from risk score
  │   ├─ trigger_type: "anomaly"
  │   └─ trigger_run_id: the run that caused it
  └─ Add "created" event to timeline

Auto-Resolution:
  ├─ After each successful run, count consecutive successes
  ├─ If count >= auto_resolve_after (default: 5)
  │   ├─ Set status = RESOLVED, resolved_at = now
  │   └─ Add "auto_resolved" event to timeline
  └─ Prevents stale incidents from lingering

Manual Actions (via API/UI):
  ├─ Investigate: OPEN → INVESTIGATING (sets acknowledged_at)
  ├─ Resolve: any → RESOLVED (sets resolved_at)
  ├─ Reopen: RESOLVED → OPEN (clears resolved_at)
  └─ Add notes: append to timeline with "note_added" event
```

---

## WebSocket Real-time Updates

### Architecture (`app/api/v1/ws.py`, `frontend/src/hooks/useWebSocket.ts`)

```
Backend (ConnectionManager):
  ├─ Singleton ws_manager with org-scoped connection pools
  ├─ dict[org_id → set[WebSocket]] with asyncio lock
  ├─ Endpoint: /api/v1/ws/monitor
  ├─ Auth: JWT token sent as first message → verify → add to org pool
  ├─ Broadcast: send event to all connections in org pool
  └─ Events: new_run, risk_update, anomaly_detected, incident_created, sla_breach

Frontend (useWebSocket hook):
  ├─ Connects to ws://<host>/api/v1/ws/monitor
  ├─ Sends JWT token on open
  ├─ Event handler: invalidates React Query caches per event type
  ├─ Auto-reconnect with exponential backoff (3s → 30s max)
  └─ Intentional close tracking prevents reconnect on unmount

Polling Optimization:
  ├─ When WS connected: polling slows from 30s→120s (endpoints, runs)
  ├─ Dashboard hooks: 60s→180s when connected
  └─ Non-reactive WS state read via useWsStore.getState()
```

---

## Export & Reporting

### Architecture (`app/services/export.py`, `app/api/v1/export.py`)

CSV export with streaming responses for large datasets. All exports are tenant-scoped.

```
Export Types:
  ├─ Monitoring Runs → status codes, response times, success/failure per probe
  ├─ Incidents → lifecycle data, severity, duration, resolution
  ├─ Risk Scores → score history with anomaly details
  └─ SLA Compliance → current uptime vs targets for all SLA-configured endpoints

Streaming:
  ├─ Uses async generators → memory-efficient for large exports
  ├─ StreamingResponse with text/csv content type
  └─ Row limit: 10,000 (runs/risk), 5,000 (incidents)
```

---

## Onboarding Flow

### Architecture (`app/api/v1/onboarding.py`, `frontend/src/components/dashboard/OnboardingChecklist.tsx`)

Server-computed onboarding checklist that guides new users through initial setup.

```
Backend (GET /api/v1/onboarding/status):
  ├─ Queries entity counts for current tenant
  ├─ Builds 5-step checklist:
  │   ├─ "Add your first endpoint"
  │   ├─ "Run your first monitor"
  │   ├─ "Configure SLA targets"
  │   ├─ "Create an alert rule"
  │   └─ "Review incidents"
  └─ Returns: { steps[], completed_count, total_count, percent }

Frontend (OnboardingChecklist component):
  ├─ Rendered at top of DashboardPage (above KPIs)
  ├─ Progress bar with step count + percentage
  ├─ Dismissible via X button (persisted in localStorage)
  └─ CompletionBanner: Sparkles icon + "All set!" message when 100%
```

---

## AI Telemetry Dashboard

### Architecture (`app/api/v1/ai_telemetry.py`, `app/repositories/ai_telemetry.py`)

**Phase 7**: FinOps dashboard that tracks every LLM call — tokens consumed, latency, cost in USD, success/failure rates. The `LLMMetrics` class in `app/ai/llm_client.py` already tracked these in-memory; this phase persists them to PostgreSQL and builds a visual dashboard.

```
Telemetry Flow:
  LLM call made (anomaly detection or debug assistant)
    ↓
  llm_client records: model, prompt_tokens, completion_tokens, latency_ms, success
    ↓
  Compute cost_usd = (prompt_tokens × input_rate + completion_tokens × output_rate)
    Per-model rate table:
    ├─ gpt-4o-mini:  $0.15 / $0.60 per 1M tokens
    ├─ gpt-4o:       $2.50 / $10.00 per 1M tokens
    └─ gpt-4-turbo:  $10.00 / $30.00 per 1M tokens
    ↓
  Persist AiTelemetryRecord to DB

API Endpoints:
  GET /api/v1/ai-telemetry/stats         → aggregate (total calls, tokens, cost, avg latency)
  GET /api/v1/ai-telemetry/daily         → daily breakdown for time-series chart
  GET /api/v1/ai-telemetry/by-endpoint   → per-endpoint AI usage ranking
  GET /api/v1/ai-telemetry/health        → LLM health (success rate, error rate, last error)

Frontend Dashboard:
  ├─ 4 KPI cards: Total Calls, Total Tokens, Total Cost, Avg Latency
  ├─ TokenUsageChart (Recharts Area) — daily token consumption over time
  ├─ CostBreakdownChart (Recharts Bar) — cost by endpoint
  └─ AiHealthCard — success rate gauge, last error display
```

---

## Enhanced Schema Drift Detection

### Architecture (`app/services/schema_snapshot.py`, `app/api/v1/schema.py`)

**Phase 8**: Extends the existing `schema_validator.py` with schema versioning, history timeline, and side-by-side visual diff.

```
Schema Snapshot Flow:
  Pipeline run completes → response body parsed
    ↓
  snapshot_if_changed(endpoint_id, response_schema)
    ├─ Hash current schema (SHA-256 normalization)
    ├─ Compare with latest snapshot hash
    ├─ If changed:
    │   ├─ Compute field-level diff (added, removed, type changes)
    │   ├─ Persist new SchemaSnapshot with diff_from_previous
    │   └─ Enables historical timeline
    └─ If unchanged: skip (deduplicated by UNIQUE constraint)

API Endpoints:
  GET  /api/v1/schema/{endpoint_id}/history               → chronological drift events
  GET  /api/v1/schema/{endpoint_id}/snapshots              → all schema snapshots
  GET  /api/v1/schema/{endpoint_id}/diff/{snap_a}/{snap_b} → compare two snapshots
  POST /api/v1/schema/{endpoint_id}/accept                 → accept current as new baseline

Frontend:
  ├─ SchemaTimeline — chronological drift history with timestamps
  ├─ SchemaDiffViewer — side-by-side JSON diff with color-coded changes
  │   ├─ Green: added fields
  │   ├─ Red: removed fields
  │   └─ Yellow: type changes
  └─ "Accept Schema" button — sets current response as new expected_schema
```

---

## AI Debug Assistant

### Architecture (`app/services/debug_assistant.py`, `app/api/v1/debug.py`)

**Phase 9**: On-demand AI-powered debugging that generates step-by-step remediation playbooks when anomalies are detected.

```
Debug Flow:
  User clicks "Ask AI to Debug" on EndpointDetailPage
    ↓
  POST /api/v1/debug/{endpoint_id}/suggest
    ├─ Gather full context:
    │   ├─ Endpoint config (URL, method, expected status)
    │   ├─ Last 10 API runs with response times + status codes
    │   ├─ Latest anomaly with reasoning + severity
    │   ├─ Active SLA config and current uptime
    │   ├─ Active alert rules and their states
    │   └─ Recent risk score history
    ├─ Build DEBUG_SYSTEM_PROMPT (specialized debugging persona)
    ├─ Call LLM with structured output format
    ├─ Record telemetry (Phase 7)
    └─ Return structured response:
        {
          "diagnosis": "Root cause analysis summary",
          "steps": ["Step 1: Check DNS resolution", "Step 2: ...", ...],
          "likely_root_cause": "DNS propagation delay after provider change",
          "severity_assessment": "HIGH — affects all users on this endpoint",
          "related_patterns": ["Similar latency spikes 3 days ago", ...]
        }

Cost Gating:
  ├─ Only callable when latest anomaly severity >= 40
  ├─ Each call tracked via AI Telemetry (Phase 7)
  └─ Prevents unnecessary LLM spend on healthy endpoints

API Endpoints:
  POST /api/v1/debug/{endpoint_id}/suggest  → trigger AI debug analysis
  GET  /api/v1/debug/{endpoint_id}/latest   → cached latest suggestion

Frontend (DebugAssistant component):
  ├─ "Ask AI to Debug" button (only visible when anomaly detected)
  ├─ Loading state with animated indicator
  └─ Structured display: diagnosis card, numbered steps, root cause, patterns
```

---

## Credential Leak Detection

### Architecture (`app/monitoring/credential_scanner.py`, `app/api/v1/security.py`)

**Phase 10**: Scans API response bodies for accidentally exposed secrets — API keys, JWTs, passwords, private keys. Runs as a pipeline step on every monitoring probe.

```
Scanner Engine:
  12 regex patterns, each with:
  ├─ Pattern name (human-readable)
  ├─ Finding type (machine-readable: AWS_KEY, JWT, etc.)
  ├─ Severity (CRITICAL, HIGH, MEDIUM)
  └─ Compiled regex (re.IGNORECASE where appropriate)

Pattern Catalog:
  ┌──────────────────────┬────────────┬──────────────────────────────┐
  │ Pattern              │ Severity   │ Detection                    │
  ├──────────────────────┼────────────┼──────────────────────────────┤
  │ AWS Access Key       │ CRITICAL   │ AKIA[0-9A-Z]{16}            │
  │ AWS Secret Key       │ CRITICAL   │ 40-char base64 after key=   │
  │ JWT Token            │ HIGH       │ eyJ[A-Za-z0-9-_]+\.eyJ...   │
  │ Private Key          │ CRITICAL   │ -----BEGIN .* PRIVATE KEY    │
  │ GitHub Token         │ CRITICAL   │ ghp_/gho_/ghs_[A-Za-z0-9]  │
  │ GitLab Token         │ CRITICAL   │ glpat-[A-Za-z0-9\-_]{20,}  │
  │ Slack Token          │ HIGH       │ xoxb-/xoxp-/xoxs-          │
  │ Password Field       │ HIGH       │ "password"/"passwd": "..."  │
  │ Generic Secret       │ MEDIUM     │ "secret"/"token"/"api_key"  │
  │ Connection String    │ CRITICAL   │ ://user:pass@host           │
  │ Stripe Key           │ CRITICAL   │ sk_live_/pk_live_/rk_live_  │
  │ SendGrid Key         │ HIGH       │ SG\.[A-Za-z0-9\-_]{22,}    │
  └──────────────────────┴────────────┴──────────────────────────────┘

Pipeline Integration:
  ├─ Runs after schema drift detection (step 5c)
  ├─ Before anomaly detection (so security findings feed into risk score)
  ├─ Findings persisted as SecurityFinding records
  └─ Security weight in risk engine: 15% of composite score

Risk Engine Integration:
  ├─ Security score uses severity-weighted count:
  │   score = min(Σ(multiplier × count), 5) × 20
  │   Multipliers: CRITICAL=1.0, HIGH=0.7, MEDIUM=0.4, LOW=0.2
  └─ Single CRITICAL finding contributes more than several LOW findings

Alert Rule Integration:
  ├─ CREDENTIAL_LEAK condition type added to alert rules
  └─ Fires when security scan has any findings

API Endpoints:
  GET /api/v1/security/findings                → all findings for org (paginated)
  GET /api/v1/security/findings/{endpoint_id}  → findings for endpoint
  GET /api/v1/security/stats                   → aggregate stats (total, by type, by severity)

Frontend:
  ├─ SecurityPage — dedicated page with stats cards + findings table
  │   ├─ SecurityStatsCards: 4 KPIs (Total, Affected Endpoints, Critical, Types)
  │   └─ SecurityFindingsTable: severity badges, redacted previews, endpoint links
  ├─ SecurityFindings on EndpointDetailPage — inline findings panel
  └─ Sidebar: Shield icon nav item → /security
```

---

## Sentinel CLI

### Architecture (`cli/sentinel/`)

**Phase 11**: Standalone Python CLI package that calls the existing REST API, enabling CI/CD integration and command-line monitoring management.

```
Package Structure:
  cli/
  ├── pyproject.toml              → package config (click, httpx, rich, pydantic)
  ├── sentinel/
  │   ├── __init__.py
  │   ├── main.py                 → Click CLI group + health command
  │   ├── client.py               → HTTP client with auth token management
  │   └── commands/
  │       ├── auth.py             → login / logout
  │       ├── endpoints.py        → list / run / status
  │       ├── incidents.py        → list / resolve
  │       └── export.py           → runs / incidents / risk / sla (CSV)
  └── github-actions/
      └── sentinel-monitor.yml    → GitHub Actions workflow template

Auth Management:
  ├─ Credentials stored at ~/.sentinel/config.json
  ├─ Token auto-refresh on 401 responses
  └─ login: email + password + API URL → stores access + refresh tokens

CLI Commands:
  sentinel login --email admin@sentinelai.com --org sentinelai
  sentinel endpoints list                    # Rich table of endpoints with status
  sentinel endpoints run <id-or-name>        # Trigger pipeline run, show results
  sentinel endpoints status <id-or-name>     # Risk, SLA, anomalies summary
  sentinel incidents list --status open      # Open incidents
  sentinel incidents resolve <id>            # Resolve incident
  sentinel export runs --days 7 --output runs.csv
  sentinel health                            # API health check

Backend CI Endpoint:
  POST /api/v1/ci/run
  ├─ Accepts endpoint name OR UUID
  ├─ Runs full pipeline synchronously
  └─ Returns: status_code, response_time_ms, risk_score, risk_level,
              anomaly_detected, anomaly_severity, security_findings count

GitHub Actions Integration:
  ├─ Template workflow: .github/workflows/sentinel-monitor.yml
  ├─ Runs on: push, schedule (cron)
  ├─ Steps: install CLI → login → run endpoints → fail on CRITICAL risk
  └─ Environment secrets: SENTINEL_EMAIL, SENTINEL_PASSWORD, SENTINEL_API_URL
```

---

## API Contract Testing

### Architecture (`app/monitoring/contract_validator.py`, `app/api/v1/contracts.py`)

**Phase 12**: Upload an OpenAPI 3.x spec per endpoint; the pipeline validates every response against it, detecting undocumented endpoints, unexpected status codes, missing required fields, and type mismatches.

```
Contract Validation Flow:
  User uploads OpenAPI spec → stored on api_endpoints.openapi_spec (JSONB)
    ↓
  Pipeline run: after schema drift (step 5d)
    ├─ If no spec uploaded → skip
    ├─ Find matching path+method in spec:
    │   ├─ Suffix match (handles base URL differences)
    │   ├─ Parameterized paths (/users/{id})
    │   └─ Fallback: first matching method regardless of path
    ├─ Check status code documented:
    │   └─ Status code not in spec.responses AND no "default" → violation
    ├─ Validate response body against schema:
    │   ├─ Resolve $ref pointers recursively
    │   ├─ Check required fields present
    │   ├─ Check field types match (string, integer, number, boolean, array, object)
    │   ├─ Handle allOf composition
    │   └─ Recursive depth limit: 5 levels
    └─ Returns: ContractResult with violation list

Violation Types:
  ├─ undocumented_endpoint — path+method not in spec (LOW)
  ├─ unexpected_status — status code not documented (HIGH)
  ├─ missing_field — required field absent (HIGH)
  └─ type_mismatch — field type doesn't match schema (MEDIUM)

API Endpoints:
  POST /api/v1/contracts/{endpoint_id}/upload   → upload OpenAPI spec (JSON)
  GET  /api/v1/contracts/{endpoint_id}/violations → validate latest run
  POST /api/v1/contracts/{endpoint_id}/validate  → trigger fresh run + validate

Frontend (ContractViolations component):
  ├─ File upload for JSON OpenAPI spec
  ├─ Upload confirmation with paths count
  ├─ Violations list with severity badges (CRITICAL/HIGH/MEDIUM/LOW)
  ├─ Each violation: rule, JSON path, message
  └─ Integrated on EndpointDetailPage
```

---

## Frontend Architecture

### Tech Stack

| Library | Version | Purpose |
|---------|---------|---------|
| React | 19 | UI framework (concurrent rendering) |
| TypeScript | strict | Type safety |
| Tailwind CSS | v4 | Utility-first styling (@theme API) |
| Vite | latest | Build tool + dev server |
| Zustand | v5 | Lightweight state management |
| React Query | @tanstack/react-query v5 | Server state + caching + polling |
| React Router | v6 | Client-side routing |
| Recharts | v3 | Time-series charts (responsive) |
| Framer Motion | latest | Animations |
| Axios | latest | HTTP client + interceptors |
| Lucide React | latest | Icon system |
| React Hot Toast | latest | Toast notifications |

### State Management Strategy

| State Type | Tool | Persistence | Why |
|------------|------|-------------|-----|
| Auth (user, token) | Zustand | **None (in-memory only)** | Security: XSS can't steal tokens from memory |
| Server data (endpoints, runs, stats) | React Query | Cache (auto-refetch) | Automatic polling + stale detection |
| UI state (sidebar collapsed, etc.) | Zustand | localStorage | Persistent UI preferences |
| API tester (collections, history) | Zustand | localStorage | Remembers recent requests |
| WebSocket state (connected, lastEvent) | Zustand | **None (in-memory)** | Transient connection state |

### Pages & Components (56+ TSX files)

```
src/pages/
├── LoginPage.tsx             Form: email, password, org slug
├── DashboardPage.tsx         Onboarding + KPIs + endpoint table + SLA + charts
├── EndpointDetailPage.tsx    Risk, runs, anomalies, performance, SLA, alert rules,
│                             incidents, debug assistant, security findings, contracts
├── EditEndpointPage.tsx      Edit endpoint (V1 or V2 config)
├── CreateEndpointPage.tsx    Create endpoint form
├── IncidentsPage.tsx         Incident list with status tabs
├── IncidentDetailPage.tsx    Status strip, meta grid, notes + timeline
├── ExportPage.tsx            Export wizard: type selector, date range, endpoint filter
├── AiTelemetryPage.tsx       AI cost dashboard with token/cost/latency charts
├── SecurityPage.tsx          Security findings with stats + findings table
├── ApiTesterPage.tsx         Postman-like API tester
└── NotFoundPage.tsx          404

src/components/
├── auth/PrivateRoute.tsx
├── layout/Sidebar.tsx, TopBar.tsx, Layout.tsx
├── common/Skeleton.tsx, RiskBadge.tsx, StatCard.tsx, EmptyState.tsx, ErrorBoundary.tsx
├── dashboard/OnboardingChecklist.tsx
├── detail/
│   ├── PerformanceChart.tsx       Recharts time-series
│   ├── AnomalyAnalysis.tsx        AI reasoning cards
│   ├── RiskBreakdown.tsx          6-component score breakdown (with security)
│   ├── RunTimeline.tsx            Run history timeline
│   ├── SchemaDrift.tsx            Schema diff viewer + drift timeline
│   ├── SchemaDiffViewer.tsx       Side-by-side JSON diff (color-coded)
│   ├── SchemaTimeline.tsx         Chronological drift history
│   ├── DebugAssistant.tsx         AI debug button + structured response display
│   ├── SecurityFindings.tsx       Inline credential leak findings
│   └── ContractViolations.tsx     Contract violations + spec upload
├── security/
│   ├── SecurityStatsCards.tsx     4 KPI cards
│   └── SecurityFindingsTable.tsx  Full findings table
├── ai-telemetry/
│   ├── TokenUsageChart.tsx        Recharts Area (daily tokens)
│   ├── CostBreakdownChart.tsx     Recharts Bar (cost by endpoint)
│   └── AiHealthCard.tsx           Success rate + last error
└── api-tester/
    ├── UrlBar.tsx, RequestPanel.tsx, ResponsePanel.tsx
```

---

## API Reference (75+ Endpoints)

### Authentication (4)

| Method | Path | Auth | Rate Limit | Purpose |
|--------|------|------|-----------|---------|
| POST | `/api/v1/auth/login` | No | 5/min | Login → access_token + refresh cookie |
| POST | `/api/v1/auth/refresh` | Cookie | 10/min | Rotate tokens |
| POST | `/api/v1/auth/logout` | Yes | — | Revoke tokens, clear cookie |
| GET | `/api/v1/auth/me` | Yes | — | Current user profile |

### Endpoints CRUD (5)

| Method | Path | Auth | Role | Purpose |
|--------|------|------|------|---------|
| GET | `/api/v1/endpoints/` | Yes | Any | List endpoints (tenant-scoped) |
| POST | `/api/v1/endpoints/` | Yes | ADMIN/MEMBER | Create endpoint |
| GET | `/api/v1/endpoints/{id}` | Yes | Any | Get endpoint detail |
| PATCH | `/api/v1/endpoints/{id}` | Yes | ADMIN/MEMBER | Update endpoint |
| DELETE | `/api/v1/endpoints/{id}` | Yes | ADMIN | Delete endpoint + cascade |

### Monitoring & Runs (4)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/v1/monitor/run/{id}` | Yes | Trigger immediate probe |
| GET | `/api/v1/monitor/performance/{id}` | Yes | Rolling avg performance |
| GET | `/api/v1/runs/endpoint/{id}` | Yes | Run history (paginated) |
| GET | `/api/v1/runs/endpoint/{id}/failure-rate` | Yes | Failure rate % |

### Anomalies & Risk Scores (3)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/v1/anomalies/endpoint/{id}` | Yes | Anomalies for endpoint |
| GET | `/api/v1/risk-scores/endpoint/{id}` | Yes | Risk score history |
| GET | `/api/v1/risk-scores/endpoint/{id}/latest` | Yes | Current risk level |

### Dashboard (5)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/v1/dashboard/stats` | Yes | KPIs |
| GET | `/api/v1/dashboard/response-trends` | Yes | Hourly avg response times |
| GET | `/api/v1/dashboard/top-failures` | Yes | Top N by failure rate |
| GET | `/api/v1/dashboard/risk-distribution` | Yes | Count per risk level |
| GET | `/api/v1/dashboard/uptime-overview` | Yes | SLA compliance |

### SLA (5)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/v1/sla/{endpoint_id}` | Yes | Get SLA config |
| GET | `/api/v1/sla/{endpoint_id}/uptime` | Yes | Uptime stats |
| POST | `/api/v1/sla/` | Yes | Create SLA |
| PATCH | `/api/v1/sla/{endpoint_id}` | Yes | Update SLA |
| DELETE | `/api/v1/sla/{endpoint_id}` | Yes | Delete SLA |

### Alert Rules (6)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/v1/alert-rules/endpoint/{endpoint_id}` | Yes | List rules |
| GET | `/api/v1/alert-rules/{rule_id}` | Yes | Get rule |
| POST | `/api/v1/alert-rules/` | Yes | Create rule |
| PATCH | `/api/v1/alert-rules/{rule_id}` | Yes | Update rule |
| DELETE | `/api/v1/alert-rules/{rule_id}` | Yes | Delete rule |
| POST | `/api/v1/alert-rules/{rule_id}/toggle` | Yes | Toggle active |

### Incidents (7)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/v1/incidents/` | Yes | List incidents |
| GET | `/api/v1/incidents/{id}` | Yes | Get incident detail |
| GET | `/api/v1/incidents/{id}/timeline` | Yes | Event timeline |
| GET | `/api/v1/incidents/endpoint/{endpoint_id}` | Yes | By endpoint |
| POST | `/api/v1/incidents/` | Yes | Create incident |
| PATCH | `/api/v1/incidents/{id}/status` | Yes | Update status |
| POST | `/api/v1/incidents/{id}/notes` | Yes | Add note |

### Export (4)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/v1/export/runs` | Yes | Download runs CSV |
| GET | `/api/v1/export/incidents` | Yes | Download incidents CSV |
| GET | `/api/v1/export/risk-scores` | Yes | Download risk CSV |
| GET | `/api/v1/export/sla` | Yes | Download SLA CSV |

### AI Telemetry (4) — Phase 7

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/v1/ai-telemetry/stats` | Yes | Aggregate AI usage stats |
| GET | `/api/v1/ai-telemetry/daily` | Yes | Daily breakdown (chart) |
| GET | `/api/v1/ai-telemetry/by-endpoint` | Yes | Per-endpoint usage |
| GET | `/api/v1/ai-telemetry/health` | Yes | LLM health metrics |

### Schema (4) — Phase 8

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/v1/schema/{endpoint_id}/history` | Yes | Drift event history |
| GET | `/api/v1/schema/{endpoint_id}/snapshots` | Yes | All schema versions |
| GET | `/api/v1/schema/{endpoint_id}/diff/{a}/{b}` | Yes | Compare two snapshots |
| POST | `/api/v1/schema/{endpoint_id}/accept` | Yes | Accept current schema |

### Debug (2) — Phase 9

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/v1/debug/{endpoint_id}/suggest` | Yes | Trigger AI debug |
| GET | `/api/v1/debug/{endpoint_id}/latest` | Yes | Cached suggestion |

### Security (3) — Phase 10

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/v1/security/findings` | Yes | All findings for org |
| GET | `/api/v1/security/findings/{endpoint_id}` | Yes | By endpoint |
| GET | `/api/v1/security/stats` | Yes | Aggregate stats |

### Contracts (3) — Phase 12

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/v1/contracts/{endpoint_id}/upload` | Yes | Upload OpenAPI spec |
| GET | `/api/v1/contracts/{endpoint_id}/violations` | Yes | Latest violations |
| POST | `/api/v1/contracts/{endpoint_id}/validate` | Yes | Trigger run + validate |

### CI/CD (1) — Phase 11

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/v1/ci/run` | Yes | Run endpoint by name/ID |

### Onboarding (1)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/v1/onboarding/status` | Yes | Onboarding checklist |

### WebSocket (1)

| Protocol | Path | Auth | Purpose |
|----------|------|------|---------|
| WS | `/api/v1/ws/monitor` | JWT (first message) | Real-time events |

### Scheduler (2)

| Method | Path | Auth | Role | Purpose |
|--------|------|------|------|---------|
| POST | `/api/v1/scheduler/start` | Yes | ADMIN | Start scheduler |
| POST | `/api/v1/scheduler/stop` | Yes | ADMIN | Stop scheduler |

### Alerts (2)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/v1/alerts/config` | Yes | Alert configuration |
| POST | `/api/v1/alerts/test` | Yes | Send test webhook |

### Proxy (1)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/v1/proxy/test-request` | Yes | SSRF-protected proxy |

### Health (1)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/v1/health` | No | Public health check |

---

## Data Flow Examples

### Example 1: User Logs In

```
Browser → POST /api/v1/auth/login { email, password, org_slug }
  → nginx (rate limit: 5/min for /auth/login)
    → FastAPI route handler
      → AuthService.login()
        → AuthRepository.find_org_by_slug()    → org
        → AuthRepository.find_user_by_email()  → user
        → Check lockout (locked_until > now?)
        → bcrypt.verify(password, hash)
        → SUCCESS:
          → Generate JWT access_token (15-min, in-memory only)
          → Generate refresh_token (SHA-256 → DB, httpOnly cookie)
          → Audit log: LOGIN_SUCCESS
        → FAILURE:
          → Increment failed_login_attempts
          → Lock if >= 5 attempts
          → Audit log: LOGIN_FAILED
  ← { access_token, user } + Set-Cookie: refresh_token

Browser:
  → Zustand: setAuth(user, access_token)  // in-memory only
  → Axios: set Authorization header
  → Redirect to /dashboard
```

### Example 2: Scheduled Monitoring Probe (Full Pipeline)

```
APScheduler fires job for endpoint_id
  → jobs.run_endpoint(endpoint_id)
    → RunnerService.execute_endpoint()
      → 1. Load ApiEndpoint from DB
      → 2. ApiRunner.execute() — httpx async request
      → 3. Save ApiRun to DB
      → 4. PerformanceTracker.analyse() — rolling avg, spike detection
      → 5a. SchemaValidator.validate() — expected vs actual JSON
      → 5b. SchemaSnapshot.snapshot_if_changed() — persist if schema evolved
      → 5c. CredentialScanner.scan() — 12-pattern regex on response body
      → 5d. ContractValidator.validate() — OpenAPI spec compliance
      → 6. AnomalyEngine.analyse() — cost-gated LLM or fallback
      → 7. Save Anomaly (if detected)
      → 8. RiskEngine.score() — 6-signal weighted composite (includes security)
      → 9. Save RiskScore
      → 10. dispatcher.maybe_alert() → n8n webhook → Slack/Email/PagerDuty
      → 11. Check SLA breach
      → 12. Evaluate custom alert rules (7 condition types)
      → 13. Manage incidents (auto-create/resolve)
      → 14. WebSocket broadcast

Frontend (React Query polling + WebSocket):
  → Detects new data
  → Updates dashboard KPIs, endpoint table, risk badges
  → Toast notifications for anomalies/incidents
  → User sees changes without page refresh
```

### Example 3: CI/CD Pipeline Run

```
GitHub Actions workflow fires on push
  → sentinel login --email $EMAIL --org sentinelai
    → Stores token at ~/.sentinel/config.json
  → sentinel endpoints run "my-api"
    → POST /api/v1/ci/run { identifier: "my-api" }
      → Lookup endpoint by name
      → Run full pipeline synchronously
      → Return: { risk_score: 45, risk_level: "MEDIUM", security_findings: 0 }
  → sentinel exits with code 1 if risk_level == CRITICAL
    → GitHub Actions marks build as failed
```

---

## Key Engineering Decisions

| Decision | Why |
|----------|-----|
| **Async throughout** | FastAPI async routes + SQLAlchemy async ORM + httpx async = 1000s of concurrent probes without thread overhead |
| **Same-origin serving** | nginx serves SPA + proxies API on same domain → httpOnly SameSite=Strict cookies, no CORS, single cert |
| **In-memory auth state** | Tokens never touch localStorage → XSS can't steal them. Silent refresh via httpOnly cookie on page load |
| **Refresh token rotation** | Every refresh revokes old + issues new → stolen tokens expire in minutes, not days |
| **Cost-gated AI** | LLM only called when signals are abnormal → $0 when healthy, proportional cost when anomalous |
| **AI telemetry persistence** | Every LLM call recorded with token count + cost → full FinOps visibility, budget tracking |
| **Denormalized org_id on runs** | Avoids join through endpoints on every dashboard query → O(1) tenant filtering at scale |
| **Repository pattern** | Every query takes `tenant_id` param → grep-able, testable, auditable tenant isolation |
| **Statistical vs fixed thresholds** | Rolling average comparison: 200ms→800ms is anomalous, 2s→2.2s is normal → fewer false positives |
| **Deterministic risk scoring** | Weighted formula (no ML) → same inputs = same output, fully explainable 6-component breakdown in UI |
| **6-signal risk engine** | Added security (15%) by rebalancing original 5 weights → credential leaks directly impact risk score |
| **Schema snapshots via hash** | SHA-256 deduplication prevents storing identical schemas → only shape changes create new records |
| **APScheduler per-endpoint jobs** | Each endpoint has its own timer → scales to 1000s, no polling loop, interval-independent |
| **Stateful alert rule counters** | `current_consecutive` stored in DB → no need to re-query run history each evaluation, survives restarts |
| **7 alert condition types** | CREDENTIAL_LEAK extends the original 6 types → security findings trigger the same alert pipeline |
| **Auto-resolve incidents** | Configurable consecutive-success threshold → incidents self-heal when the issue resolves, reducing noise |
| **Org-scoped WebSocket pools** | Each org gets its own connection set → tenant isolation extends to real-time, no cross-org data leakage |
| **Non-reactive WS polling** | `useWsStore.getState()` inside `refetchInterval` → avoids Zustand hook ordering issues, polling adapts at eval time |
| **Append-only incident timeline** | Events never mutated, only appended → complete audit trail, no lost history |
| **Streaming CSV exports** | Async generators + StreamingResponse → constant memory regardless of export size, up to 10k rows |
| **Server-computed onboarding** | Checklist derived from entity counts (not stored flags) → always accurate, no sync issues |
| **OpenAPI spec co-located** | `openapi_spec` JSONB on api_endpoints → single-query validation, no extra table join |
| **Contract validator suffix match** | URL suffix matching handles base URL differences → `/api/v1/users` matches spec path `/users` |
| **CLI with stored credentials** | `~/.sentinel/config.json` → persistent auth across commands, auto-refresh on 401 |
| **CI endpoint by name** | `POST /ci/run` accepts endpoint name or UUID → human-friendly for GitHub Actions YAML |

---

## Current Status & What's Next

### What Works (Production-Ready)

**Core Platform:**
- [x] Full JWT auth with refresh token rotation and account lockout
- [x] Multi-tenant data isolation (organization_id on every query)
- [x] Endpoint CRUD with V2 config (headers, auth, params, body, cookies)
- [x] Automated monitoring via APScheduler (configurable intervals)
- [x] HTTP probe execution with retry, timeout, response parsing
- [x] Performance tracking (rolling average, spike detection)
- [x] Schema drift detection (expected vs actual JSON)
- [x] AI anomaly detection (OpenAI gpt-4o-mini, cost-gated, rule-based fallback)
- [x] Deterministic risk scoring (6-signal weighted composite with security)
- [x] Alert dispatch via n8n webhooks (severity-based routing)
- [x] SSRF protection on proxy (RFC 1918 blocklist, metadata IP blocking)
- [x] Audit logging (all auth events)
- [x] Docker Compose deployment with nginx SSL, health checks, backups

**Phase 1 — SLA Tracking & Smart Dashboard:**
- [x] SLA configuration per endpoint (target uptime %, window: 24h/7d/30d)
- [x] Uptime calculation and compliance tracking
- [x] Dashboard charts: response trends, top failures, risk distribution, SLA overview

**Phase 2 — Custom Alert Rules:**
- [x] 7 condition types (latency, failure count, status code, schema change, risk, SLA breach, credential leak)
- [x] Consecutive match tracking with stateful counters
- [x] Toggle active/inactive without deleting

**Phase 3 — Incident Management:**
- [x] Full incident lifecycle (OPEN → INVESTIGATING → RESOLVED)
- [x] Auto-creation from detected anomalies
- [x] Auto-resolution after configurable consecutive successes
- [x] Timeline/audit trail with append-only events

**Phase 4 — WebSocket Real-time Updates:**
- [x] Org-scoped WebSocket connection pools with JWT auth
- [x] Pipeline event broadcasting (5 event types)
- [x] React Query cache invalidation + adaptive polling

**Phase 5 — Export & Reporting:**
- [x] 4 CSV export types with streaming responses
- [x] Date range filtering + endpoint multi-select

**Phase 6 — Onboarding Flow:**
- [x] Server-computed 5-step onboarding checklist
- [x] Progress bar with completion celebration

**Phase 7 — AI Telemetry Dashboard:**
- [x] Per-call telemetry persistence (model, tokens, latency, cost)
- [x] 4 API endpoints (stats, daily, by-endpoint, health)
- [x] Frontend: KPI cards + token chart + cost chart + health card

**Phase 8 — Enhanced Schema Drift:**
- [x] Schema snapshots with SHA-256 deduplication
- [x] Side-by-side diff viewer (color-coded additions/removals/changes)
- [x] Accept current schema as new baseline
- [x] Chronological drift timeline

**Phase 9 — AI Debug Assistant:**
- [x] On-demand LLM-powered debugging (diagnosis, steps, root cause)
- [x] Cost-gated (severity >= 40 required)
- [x] Integrated on EndpointDetailPage with structured display

**Phase 10 — Credential Leak Detection:**
- [x] 12-pattern regex scanner in monitoring pipeline
- [x] SecurityFinding persistence with redacted previews
- [x] Severity-weighted security score in risk engine (15%)
- [x] CREDENTIAL_LEAK alert rule condition type
- [x] Security page with stats cards + findings table

**Phase 11 — Sentinel CLI:**
- [x] Click-based CLI with Rich output formatting
- [x] Auth management (login/logout with stored credentials)
- [x] Endpoint management (list/run/status)
- [x] Incident management (list/resolve)
- [x] CSV export (runs/incidents/risk/sla)
- [x] GitHub Actions workflow template
- [x] CI endpoint (POST /ci/run with name lookup)

**Phase 12 — API Contract Testing:**
- [x] OpenAPI 3.x spec upload per endpoint
- [x] Contract validation in monitoring pipeline
- [x] $ref resolution + recursive schema validation
- [x] 4 violation types (undocumented, unexpected status, missing field, type mismatch)
- [x] Frontend spec upload + violations display

**Frontend:**
- [x] 56+ React components, 11 pages
- [x] AI Telemetry dashboard with charts
- [x] Security page with findings table
- [x] Debug assistant with structured AI responses
- [x] Contract violations with spec upload
- [x] Schema diff viewer with timeline
- [x] Embedded API tester (Postman-like)
- [x] WebSocket real-time updates + toast notifications

### Not Yet Built

- [ ] User invitation / org management UI
- [ ] API key authentication (for programmatic access beyond JWT)
- [ ] Multi-region probes (currently single-region from DigitalOcean)
- [ ] Redis caching layer (system works without it)
- [ ] BOLA security scanner (needs careful design)

---

## File Structure Reference

```
SentinelAI/
├── app/                                    # FastAPI backend (~11,300 LOC)
│   ├── main.py                             # App factory, lifespan, CORS
│   ├── core/
│   │   ├── config.py                       # Pydantic Settings (25+ env vars)
│   │   ├── auth.py                         # get_current_user, require_role deps
│   │   └── rate_limit.py                   # slowapi limiter
│   ├── models/                             # 15 model files → 16 tables
│   │   ├── organization.py, user.py, refresh_token.py, audit_log.py
│   │   ├── api_endpoint.py                 # V1 + V2 + openapi_spec config
│   │   ├── api_run.py, anomaly.py, risk_score.py
│   │   ├── endpoint_sla.py, alert_rule.py  # 7 condition types
│   │   ├── incident.py                     # Incident + IncidentEvent
│   │   ├── ai_telemetry.py                 # AI usage records
│   │   ├── schema_snapshot.py              # Schema version history
│   │   └── security_finding.py             # Credential leak findings
│   ├── schemas/                            # Pydantic request/response models
│   │   ├── auth.py, api_endpoint.py, api_run.py
│   │   ├── anomaly.py, risk_score.py, monitor.py
│   │   ├── performance.py, schema_drift.py, dashboard.py
│   │   ├── endpoint_sla.py, alert_rule.py, incident.py
│   │   ├── ai_telemetry.py, schema_snapshot.py
│   │   ├── security_finding.py, contract.py
│   │   └── debug.py
│   ├── repositories/                       # Tenant-scoped data access
│   │   ├── auth.py, api_endpoint.py, api_run.py
│   │   ├── anomaly.py, risk_score.py
│   │   ├── endpoint_sla.py, alert_rule.py, incident.py
│   │   ├── ai_telemetry.py, schema_snapshot.py
│   │   └── security_finding.py
│   ├── services/                           # Business logic
│   │   ├── auth.py, api_endpoint.py, api_run.py
│   │   ├── endpoint_sla.py, alert_rule.py, incident.py
│   │   ├── export.py, schema_snapshot.py
│   │   └── debug_assistant.py              # AI debug suggestions
│   ├── monitoring/                         # Pipeline engines
│   │   ├── api_runner.py                   # HTTP probe execution
│   │   ├── runner_service.py               # Pipeline orchestrator (14 steps)
│   │   ├── anomaly_engine.py               # AI/rule-based anomaly detection
│   │   ├── risk_engine.py                  # 6-signal risk scoring
│   │   ├── performance_tracker.py          # Rolling avg + spike detection
│   │   ├── schema_validator.py             # JSON schema comparison
│   │   ├── credential_scanner.py           # 12-pattern secret scanner
│   │   └── contract_validator.py           # OpenAPI contract validation
│   ├── ai/
│   │   ├── llm_client.py                   # OpenAI client + telemetry
│   │   └── prompt_templates.py             # Anomaly + debug prompts
│   ├── alerts/
│   │   ├── dispatcher.py, payload.py, webhook.py
│   │   └── rule_evaluator.py               # 7 condition type evaluator
│   ├── api/v1/                             # 23 route modules → 75+ endpoints
│   │   ├── router.py                       # Route aggregator
│   │   ├── auth.py, endpoints.py, runs.py
│   │   ├── anomalies.py, risk_scores.py, monitor.py
│   │   ├── dashboard.py, sla.py, alert_rules.py
│   │   ├── incidents.py, export.py, onboarding.py
│   │   ├── alerts.py, proxy.py, health.py
│   │   ├── scheduler.py, ws.py
│   │   ├── ai_telemetry.py                 # AI FinOps endpoints
│   │   ├── schema.py                       # Schema drift endpoints
│   │   ├── debug.py                        # AI debug endpoints
│   │   ├── security.py                     # Security findings endpoints
│   │   ├── ci.py                           # CI/CD run endpoint
│   │   └── contracts.py                    # Contract testing endpoints
│   ├── scheduler/
│   │   └── jobs.py                         # Pipeline orchestration (SLA, rules, incidents, WS)
│   ├── utils/
│   │   └── schema_diff.py                  # Field-level diff + hash
│   └── db/
│       ├── session.py, base.py
│
├── alembic/                                # Database migrations
│   └── versions/                           # 10 migration files (001-010)
│
├── cli/                                    # Sentinel CLI package (~600 LOC)
│   ├── pyproject.toml                      # Package config
│   ├── sentinel/
│   │   ├── main.py                         # Click CLI group
│   │   ├── client.py                       # HTTP client + auth
│   │   └── commands/
│   │       ├── auth.py, endpoints.py
│   │       ├── incidents.py, export.py
│   └── github-actions/
│       └── sentinel-monitor.yml            # CI workflow template
│
├── frontend/                               # React SPA (~15,900 LOC)
│   ├── src/
│   │   ├── app/router.tsx                  # 11 routes
│   │   ├── pages/                          # 11 page components
│   │   ├── components/                     # 45+ shared components
│   │   ├── hooks/                          # React Query hooks
│   │   ├── services/                       # API client functions
│   │   ├── stores/                         # Zustand stores (auth, ws, ui)
│   │   └── types/                          # TypeScript interfaces
│   └── package.json
│
├── deploy/                                 # Infrastructure scripts
│   ├── setup-server.sh, deploy.sh
│   ├── healthcheck.sh, backup.sh
│
├── docker-compose.yml                      # 6-service stack
├── Dockerfile                              # Multi-stage Python build
├── ARCHITECTURE.md                         # This document
└── portfolio/                              # Portfolio site (adityadeoli.com)
```
