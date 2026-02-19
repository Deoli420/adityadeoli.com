"""
Structured JSON schema diff engine.

Compares an expected schema (the "contract") against an actual response
body and produces a list of concrete, machine-readable differences.

Difference categories:
  - missing_field:   A field present in expected but absent in actual.
  - new_field:       A field present in actual but absent in expected.
  - type_mismatch:   A field exists in both but the Python type differs.
  - value_mismatch:  (optional) Enum or fixed-value field changed.

The diff walks nested objects recursively so it catches changes at any
depth (e.g. ``data.user.address.zip`` disappeared).

This module is pure logic — no I/O, no database, no side effects.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Any


class DiffKind(str, Enum):
    MISSING_FIELD = "missing_field"
    NEW_FIELD = "new_field"
    TYPE_MISMATCH = "type_mismatch"


@dataclass(frozen=True, slots=True)
class SchemaDifference:
    """One concrete difference between expected and actual."""

    kind: DiffKind
    path: str  # Dot-separated path, e.g. "data.user.name"
    expected: str | None = None  # e.g. "str", "int", "dict"
    actual: str | None = None  # e.g. "NoneType", "list"


@dataclass(frozen=True, slots=True)
class SchemaDiffResult:
    """Aggregate result of a schema comparison."""

    has_drift: bool
    missing_fields: list[SchemaDifference] = field(default_factory=list)
    new_fields: list[SchemaDifference] = field(default_factory=list)
    type_mismatches: list[SchemaDifference] = field(default_factory=list)
    total_differences: int = 0

    def to_summary_dict(self) -> dict[str, Any]:
        """Serialisable summary for logging, AI prompts, and API responses."""
        return {
            "has_drift": self.has_drift,
            "total_differences": self.total_differences,
            "missing_fields": [
                {"path": d.path, "expected_type": d.expected}
                for d in self.missing_fields
            ],
            "new_fields": [
                {"path": d.path, "actual_type": d.actual}
                for d in self.new_fields
            ],
            "type_mismatches": [
                {
                    "path": d.path,
                    "expected_type": d.expected,
                    "actual_type": d.actual,
                }
                for d in self.type_mismatches
            ],
        }


# ─── public API ─────────────────────────────────────────────────────────

NO_DRIFT = SchemaDiffResult(has_drift=False)


def compute_diff(
    expected: dict[str, Any],
    actual: dict[str, Any],
) -> SchemaDiffResult:
    """
    Compare *expected* schema/body against *actual* response body.

    Both arguments must be dicts.  If either is ``None`` or not a dict
    the caller should handle that before calling this function.

    Returns:
        ``SchemaDiffResult`` with categorised differences.
    """
    missing: list[SchemaDifference] = []
    new: list[SchemaDifference] = []
    type_mm: list[SchemaDifference] = []

    _walk(expected, actual, prefix="", missing=missing, new=new, type_mm=type_mm)

    total = len(missing) + len(new) + len(type_mm)
    return SchemaDiffResult(
        has_drift=total > 0,
        missing_fields=missing,
        new_fields=new,
        type_mismatches=type_mm,
        total_differences=total,
    )


# ─── recursive walker ───────────────────────────────────────────────────

def _walk(
    expected: dict[str, Any],
    actual: dict[str, Any],
    *,
    prefix: str,
    missing: list[SchemaDifference],
    new: list[SchemaDifference],
    type_mm: list[SchemaDifference],
) -> None:
    """Recursively walk both dicts and collect differences."""

    expected_keys = set(expected.keys())
    actual_keys = set(actual.keys())

    # Fields in expected but missing from actual
    for key in sorted(expected_keys - actual_keys):
        path = f"{prefix}{key}"
        missing.append(
            SchemaDifference(
                kind=DiffKind.MISSING_FIELD,
                path=path,
                expected=_type_label(expected[key]),
            )
        )

    # Fields in actual but not in expected
    for key in sorted(actual_keys - expected_keys):
        path = f"{prefix}{key}"
        new.append(
            SchemaDifference(
                kind=DiffKind.NEW_FIELD,
                path=path,
                actual=_type_label(actual[key]),
            )
        )

    # Fields present in both — check type and recurse if nested
    for key in sorted(expected_keys & actual_keys):
        path = f"{prefix}{key}"
        exp_val = expected[key]
        act_val = actual[key]

        exp_type = type(exp_val).__name__
        act_type = type(act_val).__name__

        # None in actual means the field exists but is null —
        # only flag as type mismatch if expected is not also None.
        if act_val is None and exp_val is not None:
            type_mm.append(
                SchemaDifference(
                    kind=DiffKind.TYPE_MISMATCH,
                    path=path,
                    expected=exp_type,
                    actual="null",
                )
            )
            continue

        if exp_val is None:
            # Expected was null, actual is anything — no mismatch.
            continue

        if exp_type != act_type:
            type_mm.append(
                SchemaDifference(
                    kind=DiffKind.TYPE_MISMATCH,
                    path=path,
                    expected=exp_type,
                    actual=act_type,
                )
            )
            continue

        # Both are dicts → recurse
        if isinstance(exp_val, dict) and isinstance(act_val, dict):
            _walk(
                exp_val,
                act_val,
                prefix=f"{path}.",
                missing=missing,
                new=new,
                type_mm=type_mm,
            )

        # Both are lists → compare element structure of first item
        if (
            isinstance(exp_val, list)
            and isinstance(act_val, list)
            and exp_val
            and act_val
            and isinstance(exp_val[0], dict)
            and isinstance(act_val[0], dict)
        ):
            _walk(
                exp_val[0],
                act_val[0],
                prefix=f"{path}[].",
                missing=missing,
                new=new,
                type_mm=type_mm,
            )


def _type_label(value: Any) -> str:
    """Human-readable type label."""
    if value is None:
        return "null"
    return type(value).__name__
