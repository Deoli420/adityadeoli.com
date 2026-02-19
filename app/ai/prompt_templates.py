"""
Prompt templates for the AI anomaly engine.

Structured prompts that feed monitoring data to the LLM and
request a strict JSON response with anomaly analysis.

Design:
  - System prompt sets the role, output format, and severity calibration.
  - User prompt is dynamically built from pipeline data.
  - Both are plain strings — no Jinja or template engines.
  - Few-shot severity examples ensure consistent scoring.
"""

from __future__ import annotations

from typing import Any, Optional

SYSTEM_PROMPT = """You are an API reliability intelligence engine for SentinelAI.

Your job is to analyse API execution summaries and determine whether
an anomaly exists.  You assess severity, provide concise technical
reasoning, and suggest the most probable root cause.

RULES:
- Be concise and technical.  No filler.
- If everything looks normal, set anomaly_detected to false and severity_score to 0.
- Focus on actionable insights a backend engineer can act on.
- NEVER hallucinate anomalies.  If data is ambiguous, lean toward "no anomaly".
- Always include your confidence level (0.0 to 1.0) in the analysis.

SEVERITY SCALE (0–100):
  0      = Perfectly healthy.  No issues.
  1–15   = Minor observation.  Not actionable.  (e.g., 5% latency increase)
  16–39  = Low severity.  Worth noting.  (e.g., occasional 4xx from client, small latency bump)
  40–59  = Medium severity.  Investigate.  (e.g., sustained latency increase 50%+, intermittent 5xx)
  60–79  = High severity.  Act soon.  (e.g., frequent 5xx, response time doubled, schema breaking changes)
  80–100 = Critical.  Act now.  (e.g., endpoint completely down, 100% failures, data corruption)

CONFIDENCE SCALE (0.0–1.0):
  0.0–0.3 = Low confidence — limited data, uncertain analysis
  0.4–0.6 = Moderate confidence — some signals present
  0.7–0.8 = High confidence — clear signals
  0.9–1.0 = Very high confidence — definitive evidence

Respond ONLY with a JSON object in this exact shape:
{
  "anomaly_detected": boolean,
  "severity_score": number,
  "reasoning": "string — concise technical explanation",
  "probable_cause": "string — most likely root cause",
  "confidence": number,
  "recommendation": "string — specific action to take"
}"""


def build_user_prompt(
    *,
    endpoint_name: str,
    url: str,
    method: str,
    expected_status: int,
    actual_status: int | None,
    response_time_ms: float | None,
    avg_response_time_ms: float | None,
    deviation_percent: float | None,
    schema_diff_summary: dict[str, Any] | None,
    failure_rate_percent: float,
    error_message: str | None,
) -> str:
    """
    Build the user prompt from monitoring pipeline data.

    All parameters are optional-safe — missing data is rendered as "N/A".
    """
    lines = [
        "Analyse the following API execution summary:",
        "",
        f"Endpoint: {endpoint_name}",
        f"URL: {method} {url}",
        f"Expected Status: {expected_status}",
        f"Actual Status: {actual_status or 'N/A (request failed)'}",
        f"Response Time: {_fmt_ms(response_time_ms)}",
        f"Average Response Time: {_fmt_ms(avg_response_time_ms)}",
        f"Performance Deviation: {_fmt_pct(deviation_percent)}",
        f"Historical Failure Rate: {failure_rate_percent:.1f}%",
    ]

    if error_message:
        lines.append(f"Error: {error_message}")

    if schema_diff_summary:
        lines.append(f"Schema Differences: {_fmt_schema(schema_diff_summary)}")
    else:
        lines.append("Schema Differences: None")

    lines.extend([
        "",
        "Tasks:",
        "1. Determine if a genuine anomaly exists (NOT minor fluctuations).",
        "2. Provide a severity score (0–100) calibrated to the scale above.",
        "3. Provide concise technical reasoning.",
        "4. Suggest the most probable root cause.",
        "5. Provide a confidence score (0.0–1.0).",
        "6. Suggest a specific recommended action.",
    ])

    return "\n".join(lines)


# ─── formatting helpers ─────────────────────────────────────────────────

def _fmt_ms(value: float | None) -> str:
    if value is None:
        return "N/A"
    return f"{value:.1f} ms"


def _fmt_pct(value: float | None) -> str:
    if value is None:
        return "N/A"
    return f"{value:+.1f}%"


def _fmt_schema(diff: dict[str, Any]) -> str:
    """Compact schema diff summary for the prompt."""
    parts: list[str] = []
    total = diff.get("total_differences", 0)
    parts.append(f"{total} difference(s)")

    missing = diff.get("missing_fields", [])
    if missing:
        paths = ", ".join(f["path"] for f in missing[:5])
        parts.append(f"missing: [{paths}]")

    new = diff.get("new_fields", [])
    if new:
        paths = ", ".join(f["path"] for f in new[:5])
        parts.append(f"new: [{paths}]")

    mismatches = diff.get("type_mismatches", [])
    if mismatches:
        items = [f'{m["path"]} ({m.get("expected_type","?")}→{m.get("actual_type","?")})' for m in mismatches[:5]]
        parts.append(f"type changes: [{', '.join(items)}]")

    return "; ".join(parts)
