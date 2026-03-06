"""
Contract validator — validates API responses against an OpenAPI spec.

Given an OpenAPI 3.x spec (as a dict) and the response from a pipeline run,
checks:
  1. Status code is documented for the endpoint path + method.
  2. Response body matches the schema for that status code.
  3. Required fields are present.
  4. Field types match the schema.

Design:
  - Pure computation — no I/O, no database.
  - Returns a list of Violation dataclasses.
  - Handles missing/malformed specs gracefully.
"""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)


@dataclass(frozen=True, slots=True)
class Violation:
    """A single contract violation."""

    rule: str         # e.g. "unexpected_status", "missing_field", "type_mismatch"
    path: str         # JSON path or location of the issue
    message: str      # human-readable description
    severity: str     # CRITICAL, HIGH, MEDIUM, LOW


@dataclass
class ContractResult:
    """Aggregated result of contract validation."""

    violations: list[Violation] = field(default_factory=list)

    @property
    def has_violations(self) -> bool:
        return len(self.violations) > 0

    @property
    def total_violations(self) -> int:
        return len(self.violations)


def _resolve_ref(spec: dict, ref: str) -> dict:
    """Resolve a JSON $ref pointer within the spec."""
    if not ref.startswith("#/"):
        return {}
    parts = ref.lstrip("#/").split("/")
    current = spec
    for part in parts:
        if isinstance(current, dict) and part in current:
            current = current[part]
        else:
            return {}
    return current if isinstance(current, dict) else {}


def _find_path_spec(spec: dict, url: str, method: str) -> dict | None:
    """
    Try to find a matching path in the spec's paths object.

    Does a simple suffix-match: if the URL ends with the path pattern,
    it's considered a match. This handles base URL differences.
    """
    paths = spec.get("paths", {})
    method_lower = method.lower()

    for path_pattern, path_obj in paths.items():
        if not isinstance(path_obj, dict):
            continue

        # Exact suffix match (e.g. /api/v1/users matches /users)
        # Or parameterized paths (e.g. /users/{id})
        if method_lower in path_obj:
            # Simple: if URL ends with the path pattern (ignoring params)
            clean_pattern = path_pattern.split("{")[0].rstrip("/")
            if url.rstrip("/").endswith(clean_pattern) or path_pattern == "/":
                return path_obj.get(method_lower, {})

    # Fallback: try first matching method regardless of path
    for path_pattern, path_obj in paths.items():
        if isinstance(path_obj, dict) and method_lower in path_obj:
            return path_obj[method_lower]

    return None


def _get_json_type(value) -> str:
    """Get the JSON Schema type name for a Python value."""
    if isinstance(value, bool):
        return "boolean"
    if isinstance(value, int):
        return "integer"
    if isinstance(value, float):
        return "number"
    if isinstance(value, str):
        return "string"
    if isinstance(value, list):
        return "array"
    if isinstance(value, dict):
        return "object"
    if value is None:
        return "null"
    return "unknown"


def _validate_schema(
    spec: dict,
    schema: dict,
    data,
    path: str,
    violations: list[Violation],
    max_depth: int = 5,
) -> None:
    """Recursively validate data against a JSON Schema definition."""
    if max_depth <= 0:
        return

    # Resolve $ref
    if "$ref" in schema:
        schema = _resolve_ref(spec, schema["$ref"])
        if not schema:
            return

    # Handle allOf, oneOf, anyOf — just validate against first for simplicity
    if "allOf" in schema:
        for sub in schema["allOf"]:
            _validate_schema(spec, sub, data, path, violations, max_depth - 1)
        return

    expected_type = schema.get("type")

    if expected_type == "object" and isinstance(data, dict):
        # Check required fields
        for req_field in schema.get("required", []):
            if req_field not in data:
                violations.append(
                    Violation(
                        rule="missing_field",
                        path=f"{path}.{req_field}",
                        message=f"Required field '{req_field}' is missing",
                        severity="HIGH",
                    )
                )

        # Recurse into properties
        properties = schema.get("properties", {})
        for prop_name, prop_schema in properties.items():
            if prop_name in data:
                _validate_schema(
                    spec, prop_schema, data[prop_name],
                    f"{path}.{prop_name}", violations, max_depth - 1,
                )

    elif expected_type == "array" and isinstance(data, list):
        items_schema = schema.get("items", {})
        if items_schema and len(data) > 0:
            # Validate first item as sample
            _validate_schema(
                spec, items_schema, data[0],
                f"{path}[0]", violations, max_depth - 1,
            )

    elif expected_type and data is not None:
        actual_type = _get_json_type(data)
        # Allow integer where number is expected
        type_compatible = (
            actual_type == expected_type
            or (expected_type == "number" and actual_type in ("integer", "number"))
            or (expected_type == "integer" and actual_type == "integer")
        )
        if not type_compatible:
            violations.append(
                Violation(
                    rule="type_mismatch",
                    path=path,
                    message=f"Expected type '{expected_type}', got '{actual_type}'",
                    severity="MEDIUM",
                )
            )


class ContractValidator:
    """
    Stateless validator — call ``validate()`` with an OpenAPI spec and response data.
    """

    def validate(
        self,
        *,
        openapi_spec: dict | None,
        url: str,
        method: str,
        status_code: int | None,
        response_body: str | None,
    ) -> ContractResult:
        """
        Validate a response against the OpenAPI spec.

        Returns a ContractResult with zero or more violations.
        """
        if not openapi_spec or not isinstance(openapi_spec, dict):
            return ContractResult()

        violations: list[Violation] = []

        # Find the operation spec for this path + method
        operation = _find_path_spec(openapi_spec, url, method)
        if not operation:
            violations.append(
                Violation(
                    rule="undocumented_endpoint",
                    path=f"{method.upper()} {url}",
                    message="Endpoint not found in OpenAPI spec",
                    severity="LOW",
                )
            )
            return ContractResult(violations=violations)

        # Check status code
        responses = operation.get("responses", {})
        status_str = str(status_code) if status_code else "unknown"

        if status_str not in responses and "default" not in responses:
            violations.append(
                Violation(
                    rule="unexpected_status",
                    path=f"response.status",
                    message=f"Status {status_code} not documented in spec (expected: {', '.join(responses.keys())})",
                    severity="HIGH",
                )
            )

        # Validate response body against schema
        response_spec = responses.get(status_str, responses.get("default", {}))
        if isinstance(response_spec, dict) and "$ref" in response_spec:
            response_spec = _resolve_ref(openapi_spec, response_spec["$ref"])

        content_spec = {}
        if isinstance(response_spec, dict):
            content_spec = response_spec.get("content", {})

        json_schema = None
        for ct in ("application/json", "*/*"):
            if ct in content_spec:
                json_schema = content_spec[ct].get("schema")
                break

        if json_schema and response_body:
            try:
                parsed = json.loads(response_body)
                _validate_schema(
                    openapi_spec, json_schema, parsed,
                    "response.body", violations,
                )
            except (json.JSONDecodeError, TypeError):
                pass  # Not JSON — skip body validation

        if violations:
            logger.info(
                "Contract validation: %d violation(s) for %s %s",
                len(violations), method, url,
            )

        return ContractResult(violations=violations)


# Module-level singleton
contract_validator = ContractValidator()
