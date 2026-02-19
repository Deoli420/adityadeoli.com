import {
  GitCompareArrows,
  Minus,
  Plus,
  ArrowLeftRight,
  CheckCircle2,
  ShieldAlert,
  Info,
} from "lucide-react";
import type { SchemaDriftReadout, FieldDifference } from "@/types/index.ts";
import { Skeleton } from "@/components/common/Skeleton.tsx";
import clsx from "clsx";

interface SchemaDriftProps {
  drift: SchemaDriftReadout | null | undefined;
  isLoading: boolean;
}

/**
 * Schema Drift — field-level diff visualization.
 *
 * Three categories of drift, each with its own colour language:
 *   - Missing fields (red)   — expected but absent in response
 *   - New fields (blue)      — present in response but not expected
 *   - Type mismatches (amber) — field exists but type changed
 *
 * Design: Inspired by GitHub's diff viewer — clean, scannable, color-coded.
 */
export function SchemaDrift({ drift, isLoading }: SchemaDriftProps) {
  if (isLoading) {
    return (
      <div className="card p-5">
        <Skeleton className="mb-3 h-4 w-36" />
        <Skeleton className="h-44 w-full rounded-lg" />
      </div>
    );
  }

  if (!drift) {
    return (
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <GitCompareArrows className="h-4 w-4 text-text-tertiary" />
          <h3 className="text-sm font-medium text-text-primary">Schema Drift</h3>
        </div>
        <div className="flex h-40 items-center justify-center">
          <div className="text-center">
            <Info className="mx-auto h-8 w-8 text-text-tertiary/50 mb-2" />
            <p className="text-xs text-text-tertiary">
              No schema data yet. Run the monitor to compare schemas.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (drift.skipped_reason) {
    return (
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <GitCompareArrows className="h-4 w-4 text-text-tertiary" />
          <h3 className="text-sm font-medium text-text-primary">Schema Drift</h3>
        </div>
        <div className="rounded-lg bg-surface-tertiary/50 px-4 py-3">
          <p className="text-xs text-text-secondary">
            Skipped: {drift.skipped_reason}
          </p>
        </div>
      </div>
    );
  }

  const hasDrift = drift.has_drift;
  const totalDiffs = drift.total_differences;

  return (
    <div className="card p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <GitCompareArrows
            className={clsx(
              "h-4 w-4",
              hasDrift ? "text-drift-type" : "text-risk-low",
            )}
          />
          <h3 className="text-sm font-medium text-text-primary">Schema Drift</h3>
        </div>
        {hasDrift ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-drift-type-bg px-2.5 py-0.5 text-xs font-medium text-drift-type">
            <ShieldAlert className="h-3 w-3" />
            {totalDiffs} {totalDiffs === 1 ? "difference" : "differences"}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-risk-low-bg px-2.5 py-0.5 text-xs font-medium text-risk-low">
            <CheckCircle2 className="h-3 w-3" />
            No drift
          </span>
        )}
      </div>

      {!hasDrift ? (
        <div className="rounded-lg bg-success-bg/50 px-4 py-6 text-center">
          <CheckCircle2 className="mx-auto h-7 w-7 text-success mb-2" />
          <p className="text-xs font-medium text-risk-low">
            Schema matches expected structure
          </p>
          <p className="mt-1 text-[11px] text-text-tertiary">
            All fields present with correct types
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Missing fields */}
          {drift.missing_fields.length > 0 && (
            <DriftSection
              icon={<Minus className="h-3.5 w-3.5" />}
              label="Missing Fields"
              count={drift.missing_fields.length}
              colorScheme="missing"
              fields={drift.missing_fields}
              renderDetail={(f) => (
                <span className="text-text-tertiary">
                  expected <TypeTag type={f.expected_type} />
                </span>
              )}
            />
          )}

          {/* New fields */}
          {drift.new_fields.length > 0 && (
            <DriftSection
              icon={<Plus className="h-3.5 w-3.5" />}
              label="Unexpected Fields"
              count={drift.new_fields.length}
              colorScheme="new"
              fields={drift.new_fields}
              renderDetail={(f) => (
                <span className="text-text-tertiary">
                  received <TypeTag type={f.actual_type} />
                </span>
              )}
            />
          )}

          {/* Type mismatches */}
          {drift.type_mismatches.length > 0 && (
            <DriftSection
              icon={<ArrowLeftRight className="h-3.5 w-3.5" />}
              label="Type Mismatches"
              count={drift.type_mismatches.length}
              colorScheme="type"
              fields={drift.type_mismatches}
              renderDetail={(f) => (
                <span className="flex items-center gap-1 text-text-tertiary">
                  <TypeTag type={f.expected_type} />
                  <ArrowLeftRight className="h-2.5 w-2.5 text-text-tertiary/60" />
                  <TypeTag type={f.actual_type} mismatch />
                </span>
              )}
            />
          )}
        </div>
      )}
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────────────────────── */

const COLOR_MAP = {
  missing: {
    bg: "bg-drift-missing-bg",
    text: "text-drift-missing",
    border: "border-drift-missing/20",
    accent: "bg-drift-missing",
  },
  new: {
    bg: "bg-drift-new-bg",
    text: "text-drift-new",
    border: "border-drift-new/20",
    accent: "bg-drift-new",
  },
  type: {
    bg: "bg-drift-type-bg",
    text: "text-drift-type",
    border: "border-drift-type/20",
    accent: "bg-drift-type",
  },
} as const;

function DriftSection({
  icon,
  label,
  count,
  colorScheme,
  fields,
  renderDetail,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  colorScheme: keyof typeof COLOR_MAP;
  fields: FieldDifference[];
  renderDetail: (f: FieldDifference) => React.ReactNode;
}) {
  const colors = COLOR_MAP[colorScheme];

  return (
    <div className={clsx("rounded-lg border", colors.border, colors.bg, "overflow-hidden")}>
      {/* Section header */}
      <div className="flex items-center gap-2 px-3 py-2">
        <span className={colors.text}>{icon}</span>
        <span className={clsx("text-xs font-medium", colors.text)}>
          {label}
        </span>
        <span
          className={clsx(
            "ml-auto inline-flex h-4.5 min-w-[18px] items-center justify-center rounded-full px-1.5 text-[10px] font-semibold text-white",
            colors.accent,
          )}
        >
          {count}
        </span>
      </div>

      {/* Field list */}
      <div className="bg-surface/60 divide-y divide-border-subtle">
        {fields.map((field, i) => (
          <div
            key={`${field.path}-${i}`}
            className="flex items-center justify-between gap-2 px-3 py-1.5 animate-fade-in"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <code className="text-xs font-mono text-text-primary truncate">
              {field.path}
            </code>
            <div className="shrink-0 text-[11px]">{renderDetail(field)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TypeTag({
  type,
  mismatch = false,
}: {
  type: string | null;
  mismatch?: boolean;
}) {
  return (
    <code
      className={clsx(
        "rounded px-1 py-0.5 text-[10px] font-mono font-medium",
        mismatch
          ? "bg-drift-type-bg text-drift-type"
          : "bg-surface-tertiary text-text-secondary",
      )}
    >
      {type ?? "unknown"}
    </code>
  );
}
