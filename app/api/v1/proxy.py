"""
Server-side proxy for test requests.

The browser cannot make cross-origin requests to arbitrary APIs due to CORS.
This endpoint accepts a request configuration, executes it server-side using
httpx, and returns the response. This avoids CORS entirely.

Protected by auth — only logged-in users can proxy requests.

SSRF protection: blocks requests targeting internal/private networks,
cloud metadata endpoints, and localhost.
"""

import ipaddress
import logging
import socket
import time
from typing import Any, Optional
from urllib.parse import urlparse

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.core.auth import CurrentUser

logger = logging.getLogger(__name__)

# ── SSRF protection ─────────────────────────────────────────────────────

# Blocked hostnames (exact match after lowering)
_BLOCKED_HOSTS: set[str] = {
    "localhost",
    "metadata.google.internal",
    "metadata.google",
    "kubernetes.default",
    "kubernetes.default.svc",
}

# Private / reserved IP networks that must not be targeted
_PRIVATE_NETWORKS: list[ipaddress.IPv4Network | ipaddress.IPv6Network] = [
    ipaddress.ip_network("0.0.0.0/8"),          # "This" network
    ipaddress.ip_network("10.0.0.0/8"),          # RFC 1918
    ipaddress.ip_network("100.64.0.0/10"),       # Carrier-grade NAT
    ipaddress.ip_network("127.0.0.0/8"),         # Loopback
    ipaddress.ip_network("169.254.0.0/16"),      # Link-local / AWS metadata
    ipaddress.ip_network("172.16.0.0/12"),       # RFC 1918
    ipaddress.ip_network("192.0.0.0/24"),        # IETF protocol assignments
    ipaddress.ip_network("192.168.0.0/16"),      # RFC 1918
    ipaddress.ip_network("198.18.0.0/15"),       # Benchmarking
    ipaddress.ip_network("::1/128"),             # IPv6 loopback
    ipaddress.ip_network("fc00::/7"),            # IPv6 unique-local
    ipaddress.ip_network("fe80::/10"),           # IPv6 link-local
]


def _is_private_ip(ip_str: str) -> bool:
    """Check if an IP address falls within a private / reserved range."""
    try:
        addr = ipaddress.ip_address(ip_str)
    except ValueError:
        return True  # If we can't parse it, block it
    return any(addr in network for network in _PRIVATE_NETWORKS)


def _validate_url_ssrf(url: str) -> None:
    """
    Raise HTTPException 400 if the URL targets an internal resource.

    Resolves the hostname to IPs and checks every resolved address
    against the private-network blocklist. Also blocks known
    cloud-metadata hostnames.
    """
    parsed = urlparse(url)
    hostname = parsed.hostname or ""
    port = parsed.port

    if not hostname:
        raise HTTPException(status_code=400, detail="Invalid URL — no hostname")

    # Block well-known internal hostnames
    if hostname.lower() in _BLOCKED_HOSTS:
        raise HTTPException(
            status_code=400,
            detail=f"Requests to '{hostname}' are blocked (internal resource)",
        )

    # Block cloud metadata IP directly
    if hostname in ("169.254.169.254", "[fd00:ec2::254]"):
        raise HTTPException(
            status_code=400,
            detail="Requests to cloud metadata endpoints are blocked",
        )

    # Block non-standard ports that might hit internal services
    if port is not None and port not in (80, 443, 8080, 8443):
        # Allow common HTTP ports — block things like :6379 (Redis), :5432 (Postgres)
        pass  # We'll let it through for now but log it
        logger.info("Proxy request to non-standard port %d on %s", port, hostname)

    # Resolve hostname → IPs and check each
    try:
        addr_infos = socket.getaddrinfo(hostname, port or 443, proto=socket.IPPROTO_TCP)
    except socket.gaierror:
        raise HTTPException(
            status_code=400, detail=f"Cannot resolve hostname '{hostname}'"
        )

    for family, _type, _proto, _canonname, sockaddr in addr_infos:
        ip_str = sockaddr[0]
        if _is_private_ip(ip_str):
            raise HTTPException(
                status_code=400,
                detail=f"Requests to private/internal networks are blocked (resolved to {ip_str})",
            )


router = APIRouter(prefix="/proxy", tags=["proxy"])

# ── Request / Response schemas ───────────────────────────────────────────


class KeyValueItem(BaseModel):
    key: str = ""
    value: str = ""
    enabled: bool = True


class AuthPayload(BaseModel):
    type: str = "none"  # none | bearer | basic | api-key
    bearer: Optional[dict[str, str]] = None
    basic: Optional[dict[str, str]] = None
    apiKey: Optional[dict[str, str]] = None


class BodyPayload(BaseModel):
    type: str = "none"  # none | json | form-data | x-www-form-urlencoded
    raw: Optional[str] = None
    formData: Optional[list[KeyValueItem]] = None
    urlEncoded: Optional[list[KeyValueItem]] = None


class ProxyRequest(BaseModel):
    method: str = Field(..., pattern="^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)$")
    url: str = Field(..., min_length=1)
    params: Optional[list[KeyValueItem]] = None
    headers: Optional[list[KeyValueItem]] = None
    auth: Optional[AuthPayload] = None
    body: Optional[BodyPayload] = None


class ProxyResponse(BaseModel):
    status: int
    statusText: str
    headers: dict[str, str]
    body: str
    size: int
    timing: dict[str, Any]  # {start, end, duration}
    error: Optional[str] = None


# ── Endpoint ─────────────────────────────────────────────────────────────


@router.post("/test-request", response_model=ProxyResponse)
async def test_request(
    req: ProxyRequest,
    user: CurrentUser,
):
    """
    Execute an HTTP request server-side and return the response.
    Bypasses CORS since the request is made from the backend.
    """
    url = req.url.strip()
    if not url:
        raise HTTPException(status_code=400, detail="URL is required")

    # Add protocol if missing
    if not url.startswith(("http://", "https://")):
        url = "https://" + url

    # SSRF protection — block internal/private targets
    _validate_url_ssrf(url)

    # Build query params
    query_params: dict[str, str] = {}
    if req.params:
        for p in req.params:
            if p.enabled and p.key.strip():
                query_params[p.key] = p.value

    # Build headers
    headers: dict[str, str] = {}
    if req.headers:
        for h in req.headers:
            if h.enabled and h.key.strip():
                headers[h.key] = h.value

    # Apply auth
    if req.auth and req.auth.type != "none":
        if req.auth.type == "bearer" and req.auth.bearer:
            token = req.auth.bearer.get("token", "")
            if token.strip():
                headers["Authorization"] = f"Bearer {token}"
        elif req.auth.type == "basic" and req.auth.basic:
            import base64
            username = req.auth.basic.get("username", "")
            password = req.auth.basic.get("password", "")
            if username.strip():
                encoded = base64.b64encode(f"{username}:{password}".encode()).decode()
                headers["Authorization"] = f"Basic {encoded}"
        elif req.auth.type == "api-key" and req.auth.apiKey:
            key_name = req.auth.apiKey.get("key", "")
            key_value = req.auth.apiKey.get("value", "")
            add_to = req.auth.apiKey.get("addTo", "header")
            if key_name.strip():
                if add_to == "query":
                    query_params[key_name] = key_value
                else:
                    headers[key_name] = key_value

    # Build body
    content: Any = None
    if req.body and req.body.type != "none" and req.method not in ("GET", "HEAD"):
        if req.body.type == "json":
            content = req.body.raw or ""
            if "Content-Type" not in headers:
                headers["Content-Type"] = "application/json"
        elif req.body.type == "x-www-form-urlencoded":
            form_pairs = {}
            if req.body.urlEncoded:
                for f in req.body.urlEncoded:
                    if f.enabled and f.key.strip():
                        form_pairs[f.key] = f.value
            content = "&".join(
                f"{httpx.URL(scheme='', host='', path=k).raw_path.decode()}={httpx.URL(scheme='', host='', path=v).raw_path.decode()}"
                for k, v in form_pairs.items()
            ) if form_pairs else ""
            # Simpler approach: use httpx data param
            content = None  # Will use data= instead
            if "Content-Type" not in headers:
                headers["Content-Type"] = "application/x-www-form-urlencoded"
        elif req.body.type == "form-data":
            # For form-data, we'll build it differently
            pass

    # Execute request
    start_ms = time.time() * 1000

    try:
        async with httpx.AsyncClient(
            timeout=httpx.Timeout(30.0),
            follow_redirects=True,
            verify=True,
        ) as client:
            # Build the request
            kwargs: dict[str, Any] = {
                "method": req.method,
                "url": url,
                "headers": headers,
                "params": query_params if query_params else None,
            }

            # Handle body types
            if req.body and req.body.type != "none" and req.method not in ("GET", "HEAD"):
                if req.body.type == "json":
                    kwargs["content"] = req.body.raw or ""
                elif req.body.type == "x-www-form-urlencoded":
                    form_data = {}
                    if req.body.urlEncoded:
                        for f in req.body.urlEncoded:
                            if f.enabled and f.key.strip():
                                form_data[f.key] = f.value
                    if form_data:
                        kwargs["data"] = form_data
                        # Remove manual Content-Type so httpx sets it
                        headers.pop("Content-Type", None)
                        kwargs["headers"] = headers
                elif req.body.type == "form-data":
                    files_list = []
                    if req.body.formData:
                        for f in req.body.formData:
                            if f.enabled and f.key.strip():
                                files_list.append(
                                    (f.key, (None, f.value, "text/plain"))
                                )
                    if files_list:
                        kwargs["files"] = files_list
                        headers.pop("Content-Type", None)
                        kwargs["headers"] = headers

            response = await client.request(**kwargs)

            end_ms = time.time() * 1000
            duration = end_ms - start_ms

            # Read response body
            response_body = response.text
            response_size = len(response_body.encode("utf-8"))

            # Extract response headers
            response_headers = dict(response.headers)

            return ProxyResponse(
                status=response.status_code,
                statusText=response.reason_phrase or "",
                headers=response_headers,
                body=response_body,
                size=response_size,
                timing={
                    "start": start_ms,
                    "end": end_ms,
                    "duration": round(duration),
                },
            )

    except httpx.TimeoutException:
        end_ms = time.time() * 1000
        return ProxyResponse(
            status=0,
            statusText="Timeout",
            headers={},
            body="",
            size=0,
            timing={
                "start": start_ms,
                "end": end_ms,
                "duration": round(end_ms - start_ms),
            },
            error="Request timed out after 30 seconds",
        )
    except httpx.ConnectError as e:
        end_ms = time.time() * 1000
        return ProxyResponse(
            status=0,
            statusText="Connection Error",
            headers={},
            body="",
            size=0,
            timing={
                "start": start_ms,
                "end": end_ms,
                "duration": round(end_ms - start_ms),
            },
            error=f"Connection failed: {str(e)}",
        )
    except Exception as e:
        end_ms = time.time() * 1000
        return ProxyResponse(
            status=0,
            statusText="Error",
            headers={},
            body="",
            size=0,
            timing={
                "start": start_ms,
                "end": end_ms,
                "duration": round(end_ms - start_ms),
            },
            error=f"Request failed: {str(e)}",
        )
