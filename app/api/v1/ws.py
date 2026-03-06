"""
WebSocket endpoint for real-time monitoring events.

Auth flow:
  1. Client connects to /api/v1/ws/monitor
  2. Client sends first message: {"token": "<JWT access token>"}
  3. Server verifies JWT → extracts org_id → adds to org pool
  4. Server pushes events: new_run, risk_update, anomaly_detected,
     incident_created, sla_breach

Connection is org-scoped: each org gets its own broadcast group.
"""

from __future__ import annotations

import asyncio
import json
import logging
import uuid
from collections import defaultdict

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from jose import JWTError, jwt

from app.core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter()


class ConnectionManager:
    """Manages WebSocket connections grouped by organization."""

    def __init__(self) -> None:
        # org_id -> set of active WebSocket connections
        self._pools: dict[uuid.UUID, set[WebSocket]] = defaultdict(set)
        self._lock = asyncio.Lock()

    async def add(self, org_id: uuid.UUID, ws: WebSocket) -> None:
        async with self._lock:
            self._pools[org_id].add(ws)
        logger.info("WS connected: org=%s (pool size=%d)", org_id, len(self._pools[org_id]))

    async def remove(self, org_id: uuid.UUID, ws: WebSocket) -> None:
        async with self._lock:
            self._pools[org_id].discard(ws)
            if not self._pools[org_id]:
                del self._pools[org_id]

    async def broadcast(self, org_id: uuid.UUID, event: dict) -> None:
        """Send an event to all connections in an org pool."""
        async with self._lock:
            connections = list(self._pools.get(org_id, set()))

        payload = json.dumps(event)
        disconnected: list[WebSocket] = []

        for ws in connections:
            try:
                await ws.send_text(payload)
            except Exception:
                disconnected.append(ws)

        # Clean up dead connections
        if disconnected:
            async with self._lock:
                for ws in disconnected:
                    self._pools[org_id].discard(ws)

    @property
    def connection_count(self) -> int:
        return sum(len(pool) for pool in self._pools.values())


# Module-level singleton
ws_manager = ConnectionManager()


def _verify_ws_token(token: str) -> dict:
    """Verify JWT and return payload. Raises ValueError on failure."""
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        if "sub" not in payload or "org" not in payload:
            raise ValueError("Missing claims")
        return payload
    except JWTError as e:
        raise ValueError(f"Invalid token: {e}") from e


@router.websocket("/ws/monitor")
async def ws_monitor(websocket: WebSocket) -> None:
    """
    WebSocket endpoint for real-time monitoring events.

    Protocol:
      1. Accept connection
      2. Wait for auth message: {"token": "..."}
      3. On valid auth, join org pool and keep alive
      4. On invalid auth, close with 4001
    """
    await websocket.accept()

    # Wait for auth message (10s timeout)
    try:
        raw = await asyncio.wait_for(websocket.receive_text(), timeout=10.0)
        msg = json.loads(raw)
        token = msg.get("token", "")
        payload = _verify_ws_token(token)
        org_id = uuid.UUID(payload["org"])
    except (asyncio.TimeoutError, ValueError, KeyError, json.JSONDecodeError) as e:
        logger.warning("WS auth failed: %s", e)
        await websocket.close(code=4001, reason="Authentication failed")
        return

    # Authenticated — join pool
    await ws_manager.add(org_id, websocket)

    # Send confirmation
    await websocket.send_text(json.dumps({"type": "connected", "org_id": str(org_id)}))

    try:
        # Keep connection alive — just listen for pings/close
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        await ws_manager.remove(org_id, websocket)
        logger.info("WS disconnected: org=%s", org_id)
