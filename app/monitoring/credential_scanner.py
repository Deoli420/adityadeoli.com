"""
Credential scanner — detects accidentally exposed secrets in API response bodies.

Scans for:
  - AWS access keys (AKIA...)
  - JWT tokens (eyJ...)
  - Generic API keys (long hex/base64 strings near "key"/"token"/"secret" fields)
  - Password fields ("password": "...")
  - Private key headers (-----BEGIN ... PRIVATE KEY-----)
  - GitHub/GitLab/Slack tokens
  - Connection strings with credentials

Design:
  - Pure computation — no I/O, no database.
  - Returns a list of ``Finding`` dataclasses for the pipeline to persist.
  - Redacts matches to avoid storing actual secrets.
"""

from __future__ import annotations

import logging
import re
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)


@dataclass(frozen=True, slots=True)
class Finding:
    """A single credential/secret match."""

    finding_type: str          # e.g. AWS_KEY, JWT, PASSWORD
    pattern_name: str          # human-readable label
    severity: str              # CRITICAL, HIGH, MEDIUM, LOW
    redacted_preview: str      # first 4 chars + **** + last 4 chars
    field_path: str | None = None  # best-effort JSON path
    match_count: int = 1


@dataclass
class ScanResult:
    """Aggregated result of scanning a single response body."""

    findings: list[Finding] = field(default_factory=list)

    @property
    def has_findings(self) -> bool:
        return len(self.findings) > 0

    @property
    def total_findings(self) -> int:
        return len(self.findings)

    @property
    def max_severity(self) -> str:
        """Return the highest severity across all findings."""
        if not self.findings:
            return "LOW"
        order = {"CRITICAL": 4, "HIGH": 3, "MEDIUM": 2, "LOW": 1}
        return max(self.findings, key=lambda f: order.get(f.severity, 0)).severity


def _redact(value: str, show: int = 4) -> str:
    """Redact a secret value, showing only first/last `show` chars."""
    if len(value) <= show * 2:
        return "*" * len(value)
    return value[:show] + "*" * (len(value) - show * 2) + value[-show:]


# ── Pattern definitions ─────────────────────────────────────────────────

_PATTERNS: list[tuple[str, str, str, re.Pattern[str]]] = [
    # (finding_type, pattern_name, severity, compiled regex)

    # AWS Access Key IDs (always start with AKIA)
    (
        "AWS_KEY",
        "AWS Access Key",
        "CRITICAL",
        re.compile(r"(?:^|[\"'\s,;:=])((AKIA[0-9A-Z]{16}))(?:[\"'\s,;:]|$)"),
    ),

    # AWS Secret Access Key (40 char base64-ish after known prefixes)
    (
        "AWS_SECRET",
        "AWS Secret Key",
        "CRITICAL",
        re.compile(
            r"(?:aws_secret_access_key|secret_key|secretAccessKey)"
            r"[\s]*[=:\"']+[\s]*([A-Za-z0-9/+=]{40})",
            re.IGNORECASE,
        ),
    ),

    # JWT tokens (three base64url segments separated by dots)
    (
        "JWT",
        "JWT Token",
        "HIGH",
        re.compile(r"(eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,})"),
    ),

    # Private key headers
    (
        "PRIVATE_KEY",
        "Private Key",
        "CRITICAL",
        re.compile(r"(-----BEGIN\s+(?:RSA\s+|EC\s+|DSA\s+|OPENSSH\s+)?PRIVATE\s+KEY-----)"),
    ),

    # GitHub personal access tokens (ghp_, gho_, ghs_, ghr_)
    (
        "GITHUB_TOKEN",
        "GitHub Token",
        "CRITICAL",
        re.compile(r"(gh[ps]_[A-Za-z0-9]{36,})"),
    ),

    # GitLab tokens
    (
        "GITLAB_TOKEN",
        "GitLab Token",
        "CRITICAL",
        re.compile(r"(glpat-[A-Za-z0-9\-_]{20,})"),
    ),

    # Slack tokens
    (
        "SLACK_TOKEN",
        "Slack Token",
        "HIGH",
        re.compile(r"(xox[baprs]-[A-Za-z0-9\-]{10,})"),
    ),

    # Generic "password" in JSON — "password": "some_value"
    (
        "PASSWORD",
        "Password Field",
        "HIGH",
        re.compile(
            r"[\"'](?:password|passwd|pwd|pass)[\"']\s*:\s*[\"']([^\"']{3,})[\"']",
            re.IGNORECASE,
        ),
    ),

    # Generic "secret" / "token" / "api_key" fields with values
    (
        "GENERIC_SECRET",
        "Secret/Token Field",
        "MEDIUM",
        re.compile(
            r"[\"'](?:secret|api_?key|access_?key|auth_?token|private_?key|client_?secret)"
            r"[\"']\s*:\s*[\"']([^\"']{8,})[\"']",
            re.IGNORECASE,
        ),
    ),

    # Connection strings with passwords — postgres://user:pass@host
    (
        "CONNECTION_STRING",
        "Connection String with Credentials",
        "CRITICAL",
        re.compile(
            r"((?:postgres|mysql|mongodb|redis|amqp|mssql)(?:ql)?://[^:]+:[^@]+@[^\s\"']+)",
            re.IGNORECASE,
        ),
    ),

    # Stripe API keys
    (
        "STRIPE_KEY",
        "Stripe API Key",
        "CRITICAL",
        re.compile(r"((?:sk|pk)_(?:live|test)_[A-Za-z0-9]{20,})"),
    ),

    # SendGrid API keys
    (
        "SENDGRID_KEY",
        "SendGrid API Key",
        "HIGH",
        re.compile(r"(SG\.[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]{43})"),
    ),
]


class CredentialScanner:
    """
    Stateless scanner — call ``scan()`` with a response body string.

    Returns a ``ScanResult`` with zero or more ``Finding`` instances.
    """

    def scan(self, response_body: str | None) -> ScanResult:
        """
        Scan the response body for known credential patterns.

        Returns a ScanResult containing all findings.
        """
        if not response_body or len(response_body.strip()) < 10:
            return ScanResult()

        findings: list[Finding] = []
        seen: set[tuple[str, str]] = set()  # (type, redacted) to dedup

        for finding_type, pattern_name, severity, regex in _PATTERNS:
            matches = regex.findall(response_body)
            if not matches:
                continue

            # Deduplicate matches of the same type
            unique_matches: list[str] = []
            for m in matches:
                # findall returns groups — take the first capture group
                val = m if isinstance(m, str) else m[0] if m else ""
                if not val or len(val) < 3:
                    continue
                unique_matches.append(val)

            if not unique_matches:
                continue

            # Create one finding per unique match (deduped by redacted form)
            for match_val in unique_matches:
                redacted = _redact(match_val)
                dedup_key = (finding_type, redacted)
                if dedup_key in seen:
                    continue
                seen.add(dedup_key)

                findings.append(
                    Finding(
                        finding_type=finding_type,
                        pattern_name=pattern_name,
                        severity=severity,
                        redacted_preview=redacted,
                        match_count=1,
                    )
                )

        if findings:
            logger.warning(
                "Credential scan found %d finding(s): %s",
                len(findings),
                ", ".join(f.finding_type for f in findings),
            )

        return ScanResult(findings=findings)


# Module-level singleton
credential_scanner = CredentialScanner()
