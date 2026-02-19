"""
Rate limiting configuration using slowapi.

Applied to security-sensitive endpoints (login, refresh).
"""

from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
