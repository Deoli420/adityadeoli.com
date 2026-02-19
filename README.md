<p align="center">
  <img src="frontend/public/logo-icon.png" alt="SentinelAI" width="80" />
</p>

<h1 align="center">SentinelAI</h1>

<p align="center">
  <strong>AI-Powered API Monitoring &amp; Risk Scoring Platform</strong>
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
  <img src="https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-strict-3178c6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind" />
  <img src="https://img.shields.io/badge/Docker-Compose-2496ed?style=flat-square&logo=docker&logoColor=white" alt="Docker" />
</p>

---

A production-grade, multi-tenant platform that monitors API endpoints in real time, detects anomalies with statistical analysis, computes composite risk scores (0-100), and alerts teams through configurable webhook pipelines — before outages reach users.

Designed, architected, and built end-to-end by [Aditya Deoli](https://adityadeoli.com) — from database schema to deployment scripts.

---

## Table of Contents

- [Architecture](#architecture)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Backend Deep Dive](#backend-deep-dive)
- [Frontend Deep Dive](#frontend-deep-dive)
- [Authentication & Security](#authentication--security)
- [Monitoring Pipeline](#monitoring-pipeline)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [Deployment](#deployment)
- [Development Setup](#development-setup)
- [Portfolio Site](#portfolio-site)
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
│                                                                  │
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
│  │    ├─ 33 REST endpoints                                    │  │
│  │    ├─ JWT auth + refresh token rotation                    │  │
│  │    ├─ RBAC (Admin / Member / Viewer)                       │  │
│  │    ├─ Tenant-scoped repository pattern                     │  │
│  │    ├─ APScheduler (configurable cron jobs)                 │  │
│  │    ├─ httpx async API runner                               │  │
│  │    ├─ Statistical anomaly detection                        │  │
│  │    ├─ Composite risk scoring engine                        │  │
│  │    └─ Webhook alert dispatcher → n8n                       │  │
│  │                                                            │  │
│  │  db (PostgreSQL 16) :5432                                  │  │
│  │    └─ 8 tables, Alembic migrations                         │  │
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
```

All three stacks share a Docker bridge network (`sentinel-shared`) and are reverse-proxied through a single nginx instance with TLS 1.3, HTTP/2, and per-route rate limiting.

---

## Features

### Real-Time Monitoring
Automated health probes hit your endpoints on a configurable schedule (APScheduler). Tracks response times, HTTP status codes, SSL validity, and DNS resolution. The dashboard auto-refreshes via React Query polling.

### Anomaly Detection
Statistical analysis flags abnormal latency spikes, unexpected status codes, and response deviations. Every run is scored against a rolling baseline — a 200ms endpoint spiking to 800ms triggers an alert even though 800ms is "fine" in absolute terms.

### Risk Scoring Engine
Each endpoint gets a composite risk score from **0** (healthy) to **100** (critical), computed from:
- Response latency vs. rolling percentile average
- HTTP status code severity weighting
- Failure rate over trailing window
- Anomaly frequency and recency
- SSL certificate expiry proximity

Scores map to four severity tiers: `LOW` → `MEDIUM` → `HIGH` → `CRITICAL`

### Intelligent Alerting
When a risk threshold is breached, SentinelAI fires a webhook into n8n which routes alerts by severity:
- **CRITICAL** → Slack + Email + PagerDuty
- **HIGH** → Slack + Email
- **MEDIUM** → Slack only

Alert rules are configurable per-endpoint with customizable severity thresholds.

### Multi-Tenant Auth & RBAC
Full authentication system with organization-level data isolation:
- JWT access tokens (15-minute expiry)
- httpOnly refresh cookies with automatic rotation (SameSite=Strict)
- SHA-256 hashed refresh tokens in database
- Three roles: **Admin**, **Member**, **Viewer** — enforced at API and UI layers
- Account lockout after 5 failed attempts (15-minute cooldown)
- Full audit trail logging

### Server-Side API Proxy
Test any API directly from the dashboard without CORS restrictions. Built-in SSRF protection:
- DNS resolution → IP validation against RFC 1918 ranges
- Cloud metadata endpoint blocking (169.254.169.254)
- Carrier-grade NAT and IPv6 private range filtering
- Configurable blocked hostname list

### Built-in API Tester (Postman-like)
Full-featured HTTP client embedded in the dashboard:
- URL bar with method selector
- Auth panel (Bearer, Basic, API Key, Custom Header)
- Request body editor (JSON, Form, Raw)
- Response viewer with headers, timing, status
- Request history with replay
- Collection management with save/organize
- cURL import/export

---

## Tech Stack

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| Python | 3.12 | Runtime |
| FastAPI | 0.115.6 | Async web framework |
| SQLAlchemy | 2.0.36 | Async ORM (repository pattern) |
| PostgreSQL | 16 | Primary database |
| Alembic | 1.14.1 | Schema migrations |
| asyncpg | 0.30.0 | Async Postgres driver |
| httpx | 0.28.1 | Async HTTP client (API probing) |
| APScheduler | 3.11.0 | Cron-based job scheduler |
| python-jose | 3.3.0 | JWT token encoding/decoding |
| bcrypt | 4.2.1 | Password hashing (12 rounds) |
| slowapi | 0.1.9 | Rate limiting |
| OpenAI | 1.82.0 | LLM-powered anomaly analysis |
| Pydantic | v2 | Schema validation |
| Uvicorn | 0.34.0 | ASGI server |

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 18 | UI framework |
| TypeScript | strict | Type safety |
| Tailwind CSS | v4 | Utility-first styling (@theme) |
| Vite | latest | Build tooling |
| Zustand | latest | Auth state management (in-memory) |
| React Query | @tanstack | Server state + cache |
| React Router | v6 | Client-side routing |
| Recharts | latest | Performance time-series charts |
| Lucide React | latest | Icon system |
| Framer Motion | latest | Animations |
| Axios | latest | HTTP client with interceptors |

### Infrastructure
| Technology | Purpose |
|-----------|---------|
| Docker Compose | Container orchestration |
| nginx 1.27 | Reverse proxy, TLS termination, rate limiting |
| Let's Encrypt | Automated SSL certificates |
| n8n | Webhook-driven alert routing |
| DigitalOcean | Hosting (2 vCPU / 4 GB) |
| Ubuntu 24.04 | Server OS |
| UFW | Firewall (22/80/443) |
| fail2ban | Brute-force protection |
| Certbot | Certificate management + auto-renewal |

---

## Project Structure

```
.
├── app/                          # FastAPI backend application
│   ├── ai/                       # LLM integration (OpenAI)
│   │   ├── llm_client.py         #   Async OpenAI wrapper
│   │   └── prompt_templates.py   #   Anomaly analysis prompts
│   ├── alerts/                   # Alert system
│   │   ├── dispatcher.py         #   Alert dispatch orchestrator
│   │   ├── payload.py            #   Webhook payload builder
│   │   └── webhook.py            #   httpx webhook sender
│   ├── api/v1/                   # REST API routes (33 endpoints)
│   │   ├── auth.py               #   Login, refresh, logout, me
│   │   ├── endpoints.py          #   CRUD for monitored endpoints
│   │   ├── runs.py               #   API run history
│   │   ├── anomalies.py          #   Anomaly records
│   │   ├── risk_scores.py        #   Risk score history
│   │   ├── monitor.py            #   Trigger monitoring runs
│   │   ├── scheduler.py          #   Manage cron schedules
│   │   ├── alerts.py             #   Alert config + test webhook
│   │   ├── dashboard.py          #   Aggregated stats endpoint
│   │   ├── proxy.py              #   Server-side API proxy (SSRF-safe)
│   │   ├── health.py             #   Public health check
│   │   └── router.py             #   Route aggregator
│   ├── core/                     # Application core
│   │   ├── auth.py               #   FastAPI deps (get_current_user, require_role, TenantId)
│   │   ├── config.py             #   Pydantic settings (25 config values)
│   │   └── rate_limit.py         #   slowapi limiter setup
│   ├── db/                       # Database layer
│   │   ├── base.py               #   SQLAlchemy Base
│   │   └── session.py            #   Async session factory
│   ├── models/                   # SQLAlchemy ORM models (8 tables)
│   │   ├── organization.py       #   Multi-tenant organizations
│   │   ├── user.py               #   Users with roles (Admin/Member/Viewer)
│   │   ├── refresh_token.py      #   SHA-256 hashed refresh tokens
│   │   ├── audit_log.py          #   Auth event audit trail
│   │   ├── api_endpoint.py       #   Monitored API endpoints
│   │   ├── api_run.py            #   Individual monitoring run results
│   │   ├── anomaly.py            #   Detected anomalies
│   │   └── risk_score.py         #   Computed risk scores
│   ├── monitoring/               # Monitoring engine
│   │   ├── api_runner.py         #   httpx async endpoint prober
│   │   ├── anomaly_engine.py     #   Statistical anomaly detector
│   │   ├── risk_engine.py        #   Composite risk score calculator
│   │   ├── runner_service.py     #   Orchestrates probe → detect → score → alert
│   │   ├── performance_tracker.py#   Latency percentile tracker
│   │   └── schema_validator.py   #   Response schema drift detector
│   ├── repositories/             # Data access layer (tenant-scoped)
│   │   ├── auth.py               #   User, org, token queries
│   │   ├── api_endpoint.py       #   Endpoint CRUD
│   │   ├── api_run.py            #   Run queries + aggregations
│   │   ├── anomaly.py            #   Anomaly queries
│   │   └── risk_score.py         #   Risk score queries
│   ├── schemas/                  # Pydantic request/response schemas
│   │   ├── auth.py               #   Login, token, user schemas
│   │   ├── api_endpoint.py       #   Endpoint create/update/read
│   │   ├── api_run.py            #   Run data schemas
│   │   ├── anomaly.py            #   Anomaly schemas
│   │   ├── risk_score.py         #   Risk score schemas
│   │   ├── monitor.py            #   Monitor trigger schemas
│   │   ├── performance.py        #   Performance data schemas
│   │   ├── risk_readout.py       #   Risk breakdown schemas
│   │   ├── anomaly_readout.py    #   Anomaly detail schemas
│   │   └── schema_drift.py       #   Schema diff schemas
│   ├── scheduler/                # APScheduler integration
│   │   ├── engine.py             #   Scheduler lifecycle management
│   │   └── jobs.py               #   Cron job definitions
│   ├── services/                 # Business logic layer
│   │   ├── auth.py               #   Login, JWT, refresh rotation, bcrypt
│   │   ├── api_endpoint.py       #   Endpoint business logic
│   │   ├── api_run.py            #   Run business logic
│   │   ├── anomaly.py            #   Anomaly business logic
│   │   └── risk_score.py         #   Risk score business logic
│   ├── utils/                    # Shared utilities
│   │   └── schema_diff.py        #   JSON schema diffing
│   └── main.py                   # FastAPI app factory + middleware
│
├── frontend/                     # React SPA (SentinelAI dashboard)
│   ├── src/
│   │   ├── app/                  # App shell
│   │   │   ├── router.tsx        #   Route definitions + PrivateRoute
│   │   │   └── layout.tsx        #   Sidebar + TopBar layout
│   │   ├── components/           # 26 reusable components
│   │   │   ├── auth/             #   PrivateRoute guard
│   │   │   ├── layout/           #   Sidebar, TopBar
│   │   │   ├── common/           #   Skeleton, RiskBadge, EmptyState, ErrorBoundary, StatCard
│   │   │   ├── detail/           #   AnomalyAnalysis, PerformanceChart, RiskBreakdown, RunTimeline, SchemaDrift
│   │   │   └── api-tester/       #   UrlBar, RequestPanel, ResponsePanel, AuthPanel, BodyPanel, etc.
│   │   ├── pages/                # 7 page components
│   │   │   ├── LoginPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── EndpointDetailPage.tsx
│   │   │   ├── CreateEndpointPage.tsx
│   │   │   ├── EditEndpointPage.tsx
│   │   │   ├── ApiTesterPage.tsx
│   │   │   └── NotFoundPage.tsx
│   │   ├── hooks/                # Custom React hooks
│   │   │   ├── useAuth.ts        #   Auth + RBAC helpers
│   │   │   ├── useEndpoints.ts   #   Endpoint list + dashboard stats
│   │   │   └── useEndpointDetails.ts  # Risk, runs, anomalies per endpoint
│   │   ├── services/             # API layer
│   │   │   ├── apiClient.ts      #   Axios instance + 401 refresh interceptor
│   │   │   ├── authService.ts    #   Login, refresh, logout, me
│   │   │   ├── endpointsService.ts  # Endpoint CRUD + stats
│   │   │   └── requestRunner.ts  #   API tester proxy calls
│   │   ├── stores/               # Zustand state
│   │   │   ├── authStore.ts      #   Auth state (in-memory only — no persist)
│   │   │   ├── appStore.ts       #   Sidebar collapse state
│   │   │   └── apiTesterStore.ts #   API tester collections + history
│   │   ├── types/                # TypeScript interfaces
│   │   │   ├── auth.ts, endpoint.ts, apiRun.ts, risk.ts, anomaly.ts, apiTester.ts
│   │   │   └── index.ts          #   Barrel export
│   │   └── utils/                # Formatting, risk colors, cURL parser
│   ├── public/                   # Static assets (favicons, logos)
│   └── index.html                # Vite entry point
│
├── portfolio/                    # Portfolio site (adityadeoli.com)
│   ├── src/
│   │   ├── components/           # 20 React components
│   │   │   ├── Hero.tsx          #   Landing hero with SentinelAI button
│   │   │   ├── Projects.tsx      #   Project showcase grid
│   │   │   ├── Experience.tsx    #   Work experience timeline
│   │   │   ├── Skills.tsx        #   Technical skills grid
│   │   │   ├── Contact.tsx       #   Contact form
│   │   │   ├── LaserPointerCat.tsx  # Easter egg: cat chases cursor
│   │   │   └── ...               #   14 more components
│   │   └── data/                 # Static content (case studies, etc.)
│   ├── public/
│   │   ├── projects/
│   │   │   └── sentinelai.html   # SentinelAI deep-dive landing page
│   │   └── assets/               # Vite build output
│   ├── server.js                 # Express server (named routes + SPA fallback)
│   ├── Dockerfile.portfolio      # Production container
│   └── docker-compose.yml        # Portfolio stack config
│
├── portfolio-showcase/           # SentinelAI landing page source
│   ├── sentinelai.html           # 733-line self-contained showcase
│   └── server-patch.js           # Express route patch instructions
│
├── alembic/                      # Database migrations
│   ├── versions/
│   │   ├── 001_add_auth_tables.py
│   │   └── 002_add_v2_endpoint_config.py
│   └── env.py
│
├── deploy/                       # Production deployment scripts
│   ├── setup-server.sh           # Initial server provisioning (Docker, UFW, fail2ban)
│   ├── deploy.sh                 # Full deploy: build → certbot → SSL → n8n → cron
│   ├── healthcheck.sh            # 5-minute health check cron
│   └── backup.sh                 # Daily PostgreSQL backup
│
├── nginx/                        # Reverse proxy configuration
│   ├── nginx.conf                # Full SSL config (4 server blocks)
│   └── nginx.initial.conf        # HTTP-only config (for initial certbot)
│
├── n8n/                          # Workflow automation
│   ├── docker-compose.yml        # n8n + n8n-db stack
│   └── .env.example
│
├── scripts/
│   └── seed.py                   # Default org + admin user seeder
│
├── docker-compose.yml            # Main SentinelAI stack (api + db + nginx)
├── Dockerfile                    # API image (Python 3.12-slim)
├── requirements.txt              # Python dependencies (18 packages)
├── .env.example                  # Environment template
├── .gitignore                    # Comprehensive ignore rules
└── DEPLOYMENT.md                 # Full deployment guide
```

---

## Backend Deep Dive

### Layered Architecture

The backend follows a strict **4-layer architecture** where each layer only communicates with the layer directly below it:

```
Routes (app/api/v1/)
  ↓ Pydantic schemas in, Pydantic schemas out
Services (app/services/)
  ↓ Domain objects, business rules
Repositories (app/repositories/)
  ↓ SQLAlchemy queries, tenant-scoped
Models (app/models/)
  ↓ ORM ↔ PostgreSQL
```

**Why this matters**: Every database query is scoped by `organization_id` at the repository layer. This makes tenant isolation auditable (grep one directory), testable (mock the repo), and migration-safe (schema changes in one place).

### Monitoring Pipeline

When a scheduled probe fires, the system executes this pipeline:

```
1. APScheduler fires cron job
2. httpx async probe hits the target endpoint
   → Captures: status_code, response_time_ms, headers, body, SSL info
3. Anomaly detector compares against rolling baseline
   → Flags: latency spikes, status changes, response deviations
4. Risk engine computes composite score (0–100)
   → Factors: latency %, failure rate, anomaly frequency, cert expiry
5. Results persisted to PostgreSQL (run + anomaly + risk_score)
6. If score >= threshold → webhook fires to n8n
7. Dashboard auto-refreshes via React Query polling
```

### Async Everything

The entire backend is async from top to bottom:
- **asyncpg** for non-blocking database queries
- **httpx** for non-blocking HTTP probes
- **SQLAlchemy 2.0** async sessions
- **Uvicorn** ASGI server

This means monitoring multiple endpoints simultaneously doesn't block the API server.

---

## Frontend Deep Dive

### State Management Strategy

| State Type | Tool | Persistence |
|-----------|------|-------------|
| Auth (user, token) | Zustand | **None** (in-memory only — security) |
| Server data (endpoints, runs, stats) | React Query | Cache (auto-refetch) |
| UI state (sidebar, theme) | Zustand | localStorage |
| API tester (collections, history) | Zustand | localStorage |

**Why no auth persistence?** Storing JWT tokens in localStorage or sessionStorage exposes them to XSS attacks. By keeping tokens only in JavaScript memory and using httpOnly cookies for refresh tokens, a compromised page cannot exfiltrate credentials.

### 401 Refresh Queue

The axios interceptor implements a request-queuing pattern for seamless token refresh:

```
Request A → 401 (token expired)
  ├─ Pause Request A
  ├─ Request B arrives → 401 → Queue Request B
  ├─ Request C arrives → 401 → Queue Request C
  ├─ POST /auth/refresh (using httpOnly cookie)
  │   ├─ Success → new access_token
  │   │   ├─ Replay Request A with new token
  │   │   ├─ Replay Request B with new token
  │   │   └─ Replay Request C with new token
  │   └─ Failure → logout → redirect to /login
  └─ Only ONE refresh call, regardless of concurrent 401s
```

### Component Architecture

Pages compose specialized components with clear data boundaries:

```
DashboardPage
  ├─ DashboardKPIs (stats cards)
  ├─ Search + Method filter bar
  └─ EndpointRow[] (each row fetches own risk + runs via React Query)

EndpointDetailPage
  ├─ Endpoint header + actions
  ├─ StatCards (risk, latency, success rate, uptime)
  ├─ PerformanceChart (Recharts time-series)
  ├─ RiskBreakdown (score components)
  ├─ AnomalyAnalysis (AI reasoning cards)
  ├─ RunTimeline (paginated run history)
  └─ SchemaDrift (response schema diff)
```

---

## Authentication & Security

### Auth Flow

```
Login:
  POST /api/v1/auth/login { email, password, organization_slug }
    → Verify org exists and is active
    → Find user by email + org (constant-time lookup)
    → Check lockout (403 if locked_until > now)
    → bcrypt verify password (12 rounds)
    → On failure: increment attempts, lock if >= 5, audit log
    → On success: reset attempts, issue tokens, audit log
    → Response: { access_token } + Set-Cookie: refresh_token (httpOnly)

Refresh:
  POST /api/v1/auth/refresh (cookie: refresh_token)
    → SHA-256 hash the token
    → Look up hash in database
    → Verify: not revoked, not expired, user active, org active
    → Revoke old token (rotation)
    → Issue new refresh_token + new access_token
    → Response: { access_token } + Set-Cookie: new refresh_token

Logout:
  POST /api/v1/auth/logout (Authorization: Bearer xxx)
    → Revoke refresh token
    → Clear cookie
    → Audit log
    → 204 No Content
```

### Security Hardening

| Layer | Protection |
|-------|-----------|
| **nginx** | TLS 1.3, HSTS (31536000s + includeSubDomains), rate limiting (50r/s global, 5/min login) |
| **Headers** | CSP, X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy |
| **Auth** | bcrypt (12 rounds), JWT (15min), httpOnly cookies (SameSite=Strict), refresh rotation (SHA-256) |
| **Account** | Lockout after 5 attempts (15min), full audit trail |
| **Data** | Tenant isolation (organization_id on every query), cascade deletes |
| **Proxy** | SSRF protection: DNS resolve → RFC 1918 check, cloud metadata blocking, hostname allowlist |
| **Infra** | UFW (22/80/443 only), fail2ban, non-root Docker, auto cert renewal |

---

## Database Schema

```
organizations
  ├── id (UUID, PK)
  ├── name, slug (unique)
  ├── is_active
  └── created_at, updated_at

users
  ├── id (UUID, PK)
  ├── email, password_hash, display_name
  ├── role (ADMIN | MEMBER | VIEWER)
  ├── organization_id (FK → organizations)
  ├── token_version (for JWT invalidation)
  ├── failed_login_attempts, locked_until
  └── created_at, updated_at

refresh_tokens
  ├── id (UUID, PK)
  ├── user_id (FK → users)
  ├── token_hash (SHA-256, indexed)
  ├── expires_at, is_revoked
  └── created_at

audit_logs
  ├── id (UUID, PK)
  ├── organization_id, user_id
  ├── action (LOGIN_SUCCESS, LOGIN_FAILED, LOGOUT, TOKEN_REFRESH, ...)
  ├── ip_address, user_agent, detail (JSON)
  └── created_at

api_endpoints
  ├── id (UUID, PK)
  ├── organization_id (FK → organizations)
  ├── name, url, method, headers, body
  ├── expected_status_code, timeout_seconds
  ├── schedule_enabled, schedule_interval_seconds
  └── created_at, updated_at

api_runs
  ├── id (UUID, PK)
  ├── endpoint_id (FK → api_endpoints)
  ├── organization_id (denormalized for query perf)
  ├── status_code, response_time_ms, is_success
  ├── error_message, response_body, response_headers
  └── created_at

anomalies
  ├── id (UUID, PK)
  ├── run_id (FK → api_runs)
  ├── severity_score, reasoning, probable_cause
  └── created_at

risk_scores
  ├── id (UUID, PK)
  ├── run_id (FK → api_runs)
  ├── endpoint_id (FK → api_endpoints)
  ├── score (0-100), level (LOW|MEDIUM|HIGH|CRITICAL)
  ├── breakdown (JSON: status, performance, drift, ai, history)
  └── created_at
```

---

## API Reference

### Auth
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/auth/login` | Public | Login → access_token + refresh cookie |
| POST | `/api/v1/auth/refresh` | Cookie | Rotate refresh token, new access_token |
| POST | `/api/v1/auth/logout` | Bearer | Revoke tokens, clear cookie |
| GET | `/api/v1/auth/me` | Bearer | Current user + org + role |

### Endpoints
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/endpoints/` | Bearer | List all endpoints (tenant-scoped) |
| POST | `/api/v1/endpoints/` | Bearer | Create endpoint |
| GET | `/api/v1/endpoints/{id}` | Bearer | Get endpoint detail |
| PUT | `/api/v1/endpoints/{id}` | Bearer | Update endpoint |
| DELETE | `/api/v1/endpoints/{id}` | Bearer | Delete endpoint + cascade |

### Monitoring
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/monitor/{id}` | Bearer | Trigger immediate probe |
| POST | `/api/v1/monitor/all` | Bearer | Probe all endpoints |
| GET | `/api/v1/runs/endpoint/{id}` | Bearer | Run history for endpoint |
| GET | `/api/v1/anomalies/endpoint/{id}` | Bearer | Anomalies for endpoint |
| GET | `/api/v1/risk-scores/endpoint/{id}` | Bearer | Risk history for endpoint |
| GET | `/api/v1/risk-scores/endpoint/{id}/latest` | Bearer | Current risk score |
| GET | `/api/v1/dashboard/stats` | Bearer | Aggregated dashboard KPIs |

### Scheduler
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/scheduler/start` | Admin | Start monitoring scheduler |
| POST | `/api/v1/scheduler/stop` | Admin | Stop scheduler |

### Alerts & Proxy
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/alerts/config` | Bearer | Get alert configuration |
| POST | `/api/v1/alerts/test` | Admin | Send test webhook to n8n |
| POST | `/api/v1/proxy` | Bearer | SSRF-safe server-side proxy |

### Health
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/health` | Public | Health check (no auth required) |

---

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for the full deployment guide. Quick overview:

```bash
# 1. Provision server
ssh root@YOUR_IP
bash deploy/setup-server.sh

# 2. Configure
cp .env.example .env    # Edit with your values
cp n8n/.env.example n8n/.env

# 3. Deploy
bash deploy/deploy.sh your@email.com

# 4. Verify
curl https://api.sentinelai.adityadeoli.com/api/v1/health
```

The deploy script handles: Docker network creation → build → Certbot SSL → nginx SSL switch → n8n start → cron jobs (cert renewal, health checks, daily backups).

---

## Development Setup

### Backend
```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Start PostgreSQL (Docker)
docker compose up -d db

# Run migrations
alembic upgrade head

# Seed default org + admin
python -m scripts.seed

# Start dev server
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env    # Set VITE_API_BASE_URL=http://localhost:8000

npm run dev             # http://localhost:5173
```

### Portfolio
```bash
cd portfolio
npm install
npm run dev             # http://localhost:3000
```

---

## Portfolio Site

The portfolio site ([adityadeoli.com](https://adityadeoli.com)) lives in the `portfolio/` directory. It's a React + Vite + Tailwind app with a cyberpunk aesthetic, served by Express.js in production.

Key features:
- SentinelAI discovery button in the hero section
- Detailed SentinelAI landing page at `/projects/sentinelai` (733-line self-contained HTML)
- Case studies section
- Interactive test runner (legacy Bantr project)
- Easter egg: laser pointer cat that chases your cursor 🐱

The portfolio Dockerfile (`Dockerfile.portfolio`) COPYs the built `public/` directory and `server.js` — any changes require a `docker compose build --no-cache`.

---

## Engineering Decisions

### Same-Origin Serving over Separate Frontend Deploy
nginx serves both the React SPA and proxies `/api/` on `sentinelai.adityadeoli.com`. This eliminates CORS entirely and lets httpOnly cookies work with `SameSite=Strict` — the most secure cookie configuration available.

### Denormalized `organization_id` on `api_runs`
ApiRun stores `organization_id` even though it could be inferred via the parent endpoint. This avoids joining through `api_endpoints` on every dashboard query — critical for keeping the stats endpoint fast as run counts grow.

### Refresh Token Rotation over Long-Lived Access Tokens
Access tokens expire in 15 minutes. On 401, the frontend silently calls `/auth/refresh` which atomically rotates the refresh token (old one revoked, new one issued). Stolen tokens have a blast radius of minutes, not days.

### Statistical Baselines over Fixed Thresholds
Rather than alerting on "latency > 1000ms", the anomaly detector compares each response against a rolling average. A 200ms endpoint spiking to 800ms is far more concerning than a 2s endpoint at 2.2s — context matters.

### Repository Pattern over Raw SQL
Every database operation goes through a repository class with explicit `tenant_id` parameters. This makes tenant-scoping auditable, testable, and migration-safe.

### In-Memory Auth State (No localStorage)
Zustand auth store has zero persistence. Tokens live only in JavaScript memory. On page refresh, the app attempts a silent refresh via the httpOnly cookie. If the cookie is expired, you land on `/login`. This is intentional — XSS cannot steal what isn't stored.

---

## Stats

| Metric | Count |
|--------|-------|
| Total lines of code | ~13,000 |
| Python files (backend) | 64 |
| TypeScript/TSX files (frontend) | 53 |
| React components + pages | 33 |
| REST API endpoints | 33 |
| Database models | 8 |
| Alembic migrations | 2 |
| Portfolio components | 20 |
| Backend dependencies | 18 |
| Frontend dependencies | 21 |
| Config settings | 25 |
| Deploy scripts | 4 |
| Docker services | 6 (api, db, nginx, n8n, n8n-db, portfolio) |

---

<p align="center">
  Built by <a href="https://adityadeoli.com">Aditya Deoli</a>
</p>
