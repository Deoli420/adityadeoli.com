"""
HTTP client — wraps httpx with auth token management.

Reads credentials from:
  1. ~/.sentinel/config.json (persistent after `sentinel login`)
  2. Environment variables: SENTINEL_API_URL, SENTINEL_TOKEN

Token refresh is attempted automatically on 401 responses.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any

import httpx

CONFIG_DIR = Path.home() / ".sentinel"
CONFIG_FILE = CONFIG_DIR / "config.json"

DEFAULT_API_URL = "https://api.sentinelai.adityadeoli.com"


def _load_config() -> dict[str, str]:
    """Load stored config from ~/.sentinel/config.json."""
    if CONFIG_FILE.exists():
        try:
            return json.loads(CONFIG_FILE.read_text())
        except (json.JSONDecodeError, OSError):
            return {}
    return {}


def _save_config(cfg: dict[str, str]) -> None:
    """Persist config to ~/.sentinel/config.json."""
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    CONFIG_FILE.write_text(json.dumps(cfg, indent=2))


class SentinelClient:
    """Authenticated HTTP client for the SentinelAI REST API."""

    def __init__(self) -> None:
        cfg = _load_config()
        import os

        self.api_url = os.environ.get("SENTINEL_API_URL", cfg.get("api_url", DEFAULT_API_URL))
        self.token = os.environ.get("SENTINEL_TOKEN", cfg.get("token", ""))
        self._email = cfg.get("email", "")
        self._password = cfg.get("password", "")
        self._http = httpx.Client(
            base_url=self.api_url.rstrip("/"),
            timeout=30.0,
        )

    @property
    def is_authenticated(self) -> bool:
        return bool(self.token)

    def _headers(self) -> dict[str, str]:
        h: dict[str, str] = {"Content-Type": "application/json"}
        if self.token:
            h["Authorization"] = f"Bearer {self.token}"
        return h

    # ── Auth ──────────────────────────────────────────────────────────

    def login(self, email: str, password: str, api_url: str | None = None) -> dict:
        """Authenticate and store the token."""
        if api_url:
            self.api_url = api_url
            self._http = httpx.Client(
                base_url=self.api_url.rstrip("/"),
                timeout=30.0,
            )

        resp = self._http.post(
            "/api/v1/auth/login",
            json={"email": email, "password": password},
        )
        resp.raise_for_status()
        data = resp.json()

        self.token = data.get("access_token", "")
        self._email = email
        self._password = password

        _save_config({
            "api_url": self.api_url,
            "token": self.token,
            "email": email,
            "password": password,
        })
        return data

    def logout(self) -> None:
        """Clear stored credentials."""
        self.token = ""
        self._email = ""
        self._password = ""
        if CONFIG_FILE.exists():
            CONFIG_FILE.unlink()

    def _refresh_token(self) -> bool:
        """Attempt to re-login with stored credentials."""
        if not self._email or not self._password:
            return False
        try:
            self.login(self._email, self._password)
            return True
        except Exception:
            return False

    # ── Generic request ──────────────────────────────────────────────

    def request(
        self,
        method: str,
        path: str,
        *,
        params: dict[str, Any] | None = None,
        json_body: dict[str, Any] | None = None,
    ) -> Any:
        """Make an authenticated API request, auto-refreshing on 401."""
        resp = self._http.request(
            method,
            path,
            headers=self._headers(),
            params=params,
            json=json_body,
        )

        # Auto-refresh on 401
        if resp.status_code == 401 and self._refresh_token():
            resp = self._http.request(
                method,
                path,
                headers=self._headers(),
                params=params,
                json=json_body,
            )

        if resp.status_code >= 400:
            try:
                detail = resp.json().get("detail", resp.text)
            except Exception:
                detail = resp.text
            from rich.console import Console

            Console(stderr=True).print(
                f"[red]API error ({resp.status_code}):[/red] {detail}"
            )
            sys.exit(1)

        if resp.status_code == 204:
            return None

        return resp.json()

    def get(self, path: str, **kwargs: Any) -> Any:
        return self.request("GET", path, **kwargs)

    def post(self, path: str, **kwargs: Any) -> Any:
        return self.request("POST", path, **kwargs)

    def patch(self, path: str, **kwargs: Any) -> Any:
        return self.request("PATCH", path, **kwargs)

    def delete(self, path: str, **kwargs: Any) -> Any:
        return self.request("DELETE", path, **kwargs)

    # ── Download (for CSV exports) ───────────────────────────────────

    def download(self, path: str, output_file: str, params: dict | None = None) -> None:
        """Download a file (CSV export) and save to disk."""
        resp = self._http.get(
            path,
            headers=self._headers(),
            params=params,
        )

        if resp.status_code == 401 and self._refresh_token():
            resp = self._http.get(
                path,
                headers=self._headers(),
                params=params,
            )

        resp.raise_for_status()

        Path(output_file).write_bytes(resp.content)


# Module-level singleton
client = SentinelClient()
