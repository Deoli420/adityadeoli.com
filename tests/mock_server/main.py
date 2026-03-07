"""
SentinelAI Mock API Server for E2E Testing.

Provides configurable HTTP endpoints simulating real-world API behaviors:
healthy, slow, failing, intermittent, credential leaks, schema drift, etc.

Run: uvicorn main:app --host 0.0.0.0 --port 9999
"""

import asyncio
from datetime import datetime, timezone

from fastapi import FastAPI, Header, Query, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

app = FastAPI(title="SentinelAI Mock Server", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# ── Global State ─────────────────────────────────────────────────────────
state = {
    "call_counts": {},
    "custom_response": {"status_code": 200, "body": {"custom": True}, "delay_ms": 0},
    "intermittent_counter": 0,
}

def _track(endpoint: str):
    state["call_counts"][endpoint] = state["call_counts"].get(endpoint, 0) + 1


@app.get("/health")
async def health():
    return {"status": "ok", "service": "mock-server"}


# ── Scenario 1: Healthy API ─────────────────────────────────────────────
@app.get("/api/healthy")
async def healthy():
    _track("healthy")
    return {
        "status": "ok",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "uptime": 99.9,
        "version": "1.0.0",
        "data": {"users": 150, "requests_today": 24531},
    }


# ── Scenario 2: Slow API ────────────────────────────────────────────────
@app.get("/api/slow")
async def slow(delay: int = Query(default=2000, ge=100, le=30000)):
    _track("slow")
    await asyncio.sleep(delay / 1000.0)
    return {"status": "ok", "delay_ms": delay}


# ── Scenario 3: Failing API ─────────────────────────────────────────────
@app.get("/api/failing")
async def failing():
    _track("failing")
    return JSONResponse(status_code=500, content={"error": "Internal Server Error", "code": "ERR_500"})


# ── Scenario 4: Intermittent ────────────────────────────────────────────
@app.get("/api/intermittent")
async def intermittent():
    _track("intermittent")
    state["intermittent_counter"] += 1
    if state["intermittent_counter"] % 2 == 0:
        return {"status": "ok", "call": state["intermittent_counter"]}
    return JSONResponse(status_code=500, content={"error": "Intermittent failure", "call": state["intermittent_counter"]})


# ── Scenario 5: Schema Drift ────────────────────────────────────────────
@app.get("/api/schema-drift")
async def schema_drift():
    _track("schema-drift")
    count = state["call_counts"]["schema-drift"]
    if count <= 3:
        return {"name": "test", "value": 42}
    return {"name": "test", "value": 42, "extra_field": True, "nested": {"deep": 1}, "tags": ["new", "drifted"]}


# ── Scenario 6: Credential Leak ─────────────────────────────────────────
@app.get("/api/credential-leak")
async def credential_leak():
    _track("credential-leak")
    return {
        "status": "ok",
        "config": {"aws_access_key": "AKIAIOSFODNN7EXAMPLE", "aws_secret_key": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"},
        "auth": {"jwt_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U", "password": "super_secret_123"},
        "database": {"url": "postgresql://admin:p4ssw0rd@db.internal:5432/production"},
        "api_key": "sk-proj-abc123def456ghi789jkl012mno345pqr678stu901vwx234",
    }


# ── Scenario 7: Timeout ─────────────────────────────────────────────────
@app.get("/api/timeout")
async def timeout():
    _track("timeout")
    await asyncio.sleep(120)
    return {"status": "ok"}


# ── Scenario 8: Protected ───────────────────────────────────────────────
@app.get("/api/protected")
async def protected(authorization: str = Header(default=None)):
    _track("protected")
    if not authorization or authorization != "Bearer test-token-123":
        return JSONResponse(status_code=401, content={"error": "Unauthorized"})
    return {"status": "ok", "user": "authenticated"}


# ── Scenario 9: Large Response ───────────────────────────────────────────
@app.get("/api/large-response")
async def large_response():
    _track("large-response")
    items = [{"id": i, "name": f"Item {i}", "description": f"Description for item {i} " * 10, "price": round(9.99 + i * 0.5, 2), "tags": [f"tag-{j}" for j in range(5)]} for i in range(500)]
    return {"status": "ok", "count": len(items), "items": items}


# ── Scenario 10: OpenAPI Compliant ───────────────────────────────────────
@app.get("/api/openapi-compliant")
async def openapi_compliant():
    _track("openapi-compliant")
    return {"id": 1, "name": "Widget", "price": 29.99, "in_stock": True, "category": "electronics"}


# ── Scenario 11: OpenAPI Violating ──────────────────────────────────────
@app.get("/api/openapi-violating")
async def openapi_violating():
    _track("openapi-violating")
    return {"id": "not-a-number", "name": 12345, "extra_unexpected": True}


# ── Scenario 12: Echo ────────────────────────────────────────────────────
@app.post("/api/echo")
async def echo(request: Request):
    _track("echo")
    try:
        body = await request.json()
    except Exception:
        body = None
    return {"status": "ok", "method": request.method, "headers": dict(request.headers), "body": body}


# ── Scenario 13: Redirect ───────────────────────────────────────────────
@app.get("/api/redirect")
async def redirect():
    _track("redirect")
    return Response(status_code=301, headers={"Location": "/api/healthy"})


# ── Scenario 14: Custom (configurable via admin) ────────────────────────
@app.get("/api/custom")
async def custom():
    _track("custom")
    cfg = state["custom_response"]
    if cfg.get("delay_ms", 0) > 0:
        await asyncio.sleep(cfg["delay_ms"] / 1000.0)
    return JSONResponse(status_code=cfg.get("status_code", 200), content=cfg.get("body", {"custom": True}))


# ── Admin Controls ───────────────────────────────────────────────────────
@app.post("/admin/reset")
async def admin_reset():
    state["call_counts"] = {}
    state["custom_response"] = {"status_code": 200, "body": {"custom": True}, "delay_ms": 0}
    state["intermittent_counter"] = 0
    return {"status": "reset"}


@app.get("/admin/stats")
async def admin_stats():
    return {"call_counts": state["call_counts"], "intermittent_counter": state["intermittent_counter"]}


@app.post("/admin/configure")
async def admin_configure(request: Request):
    body = await request.json()
    state["custom_response"] = {"status_code": body.get("status_code", 200), "body": body.get("body", {"custom": True}), "delay_ms": body.get("delay_ms", 0)}
    return {"status": "configured", "config": state["custom_response"]}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=9999)
