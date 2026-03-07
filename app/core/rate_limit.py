"""
Rate limiting configuration using slowapi.

Applied to security-sensitive endpoints (login, refresh).
Set RATE_LIMIT_ENABLED=false to disable for testing.
"""

import os

from slowapi import Limiter
from slowapi.util import get_remote_address

_enabled = os.getenv("RATE_LIMIT_ENABLED", "true").lower() not in ("false", "0", "no")

limiter = Limiter(key_func=get_remote_address, enabled=_enabled)
