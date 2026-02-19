# ── SentinelAI — production Dockerfile ──────────────────────────────────
# Multi-stage build: compile dependencies in a builder, copy into a slim
# runtime image.  Non-root user, health-check endpoint, minimal surface.
# ─────────────────────────────────────────────────────────────────────────

# ── Stage 1: builder ────────────────────────────────────────────────────
FROM python:3.13-slim AS builder

WORKDIR /build

# System libs needed to compile asyncpg and psycopg2
RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc libpq-dev && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt


# ── Stage 2: runtime ───────────────────────────────────────────────────
FROM python:3.13-slim AS runtime

# libpq is needed at runtime by asyncpg / psycopg2
RUN apt-get update && \
    apt-get install -y --no-install-recommends libpq5 curl && \
    rm -rf /var/lib/apt/lists/*

# Non-root user
RUN groupadd --gid 1000 sentinel && \
    useradd --uid 1000 --gid sentinel --create-home sentinel

WORKDIR /app

# Copy installed packages from builder
COPY --from=builder /install /usr/local

# Copy application code
COPY --chown=sentinel:sentinel . .

USER sentinel

EXPOSE 8000

# Health check hits the FastAPI health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:8000/api/v1/health || exit 1

# Production: 4 workers, graceful shutdown, access log to stdout
CMD ["uvicorn", "app.main:app", \
     "--host", "0.0.0.0", \
     "--port", "8000", \
     "--workers", "4", \
     "--timeout-graceful-shutdown", "30", \
     "--access-log"]
