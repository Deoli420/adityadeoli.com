import { useState } from "react";
import {
  GitCompareArrows,
  Minus,
  Plus,
  ArrowLeftRight,
  Loader2,
  Info,
} from "lucide-react";
import { useSchemaDiff } from "@/hooks/useSchemaHistory.ts";
import type { SchemaSnapshot, DiffSummary } from "@/types/index.ts";
import { Skeleton } from "@/components/common/Skeleton.tsx";
import clsx from "clsx";

interface SchemaDiffViewerProps {
  endpointId: string;
  snapshots: SchemaSnapshot[];
}

/**
 * Side-by-side schema diff viewer.
 *
 * Lets the user pick two snapshots and displays the structural differences
 * between them with color-coded additions, removals, and type changes.
 */
export function SchemaDiffViewer({
  endpointId,
  snapshots,
}: SchemaDiffViewerProps) {
  const [snapA, setSnapA] = useState<string | null>(
    snapshots.length >= 2 ? snapshots[1].id : null,
  );
  const [snapB, setSnapB] = useState<string | null>(
    snapshots.length >= 1 ? snapshots[0].id : null,
  );

  const { data: diffData, isLoading } = useSchemaDiff(
    endpointId,
    snapA,
    snapB,
  );

  if (snapshots.length < 2) {
    return (
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <GitCompareArrows className="h-4 w-4 text-text-tertiary" />
          <h3 className="text-sm font-medium text-text-primary">
            Schema Diff Viewer
          </h3>
        </div>
        <div className="flex h-32 items-center justify-center">
          <div className="text-center">
            <Info className="mx-auto h-8 w-8 text-text-tertiary/50 mb-2" />
            <p className="text-xs text-text-tertiary">
              At least 2 snapshots are needed to compare schemas.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="card p-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <GitCompareArrows className="h-4 w-4 text-text-tertiary" />
        <h3 className="text-sm font-medium text-text-primary">
          Schema Diff Viewer
        </h3>
      </div>

      {/* Snapshot selectors */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider mb-1 block">
            Baseline (A)
          </label>
          <select
            className="w-full rounded-lg border border-border-default bg-surface-secondary px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
            value={snapA ?? ""}
            onChange={(e) => setSnapA(e.target.value || null)}
          >
            <option value="">Select snapshot...</option>
            {snapshots.map((s) => (
              <option key={s.id} value={s.id}>
                {formatDate(s.created_at)} ({s.schema_hash.slice(0, 8)}...)
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider mb-1 block">
            Compare (B)
          </label>
          <select
            className="w-full rounded-lg border border-border-default bg-surface-secondary px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
            value={snapB ?? ""}
            onChange={(e) => setSnapB(e.target.value || null)}
          >
            <option value="">Select snapshot...</option>
            {snapshots.map((s) => (
              <option key={s.id} value={s.id}>
                {formatDate(s.created_at)} ({s.schema_hash.slice(0, 8)}...)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Diff result */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-text-tertiary" />
        </div>
      ) : diffData ? (
        <DiffDisplay diff={diffData.diff} />
      ) : snapA && snapB ? (
        <Skeleton className="h-32 w-full rounded-lg" />
      ) : (
        <div className="rounded-lg bg-surface-tertiary/50 px-4 py-6 text-center">
          <p className="text-xs text-text-tertiary">
            Select two snapshots to compare
          </p>
        </div>
      )}
    </div>
  );
}

/* ── Diff display sub-component ─────────────────────────────────────────── */

function DiffDisplay({ diff }: { diff: DiffSummary }) {
  if (!diff.has_drift) {
    return (
      <div className="rounded-lg bg-risk-low-bg/50 px-4 py-6 text-center">
        <p className="text-xs font-medium text-risk-low">
          Schemas are identical
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Missing fields */}
      {diff.missing_fields.length > 0 && (
        <DiffSection
          icon={<Minus className="h-3.5 w-3.5" />}
          label="Removed Fields"
          count={diff.missing_fields.length}
          colorScheme="missing"
        >
          {diff.missing_fields.map((f, i) => (
            <DiffRow
              key={`${f.path}-${i}`}
              path={f.path}
              detail={
                <span className="text-text-tertiary">
                  was{" "}
                  <code className="rounded bg-surface-tertiary px-1 py-0.5 text-[10px] font-mono">
                    {f.expected_type ?? "unknown"}
                  </code>
                </span>
              }
              delay={i * 30}
            />
          ))}
        </DiffSection>
      )}

      {/* New fields */}
      {diff.new_fields.length > 0 && (
        <DiffSection
          icon={<Plus className="h-3.5 w-3.5" />}
          label="Added Fields"
          count={diff.new_fields.length}
          colorScheme="new"
        >
          {diff.new_fields.map((f, i) => (
            <DiffRow
              key={`${f.path}-${i}`}
              path={f.path}
              detail={
                <span className="text-text-tertiary">
                  type{" "}
                  <code className="rounded bg-surface-tertiary px-1 py-0.5 text-[10px] font-mono">
                    {f.actual_type ?? "unknown"}
                  </code>
                </span>
              }
              delay={i * 30}
            />
          ))}
        </DiffSection>
      )}

      {/* Type mismatches */}
      {diff.type_mismatches.length > 0 && (
        <DiffSection
          icon={<ArrowLeftRight className="h-3.5 w-3.5" />}
          label="Type Changes"
          count={diff.type_mismatches.length}
          colorScheme="type"
        >
          {diff.type_mismatches.map((f, i) => (
            <DiffRow
              key={`${f.path}-${i}`}
              path={f.path}
              detail={
                <span className="flex items-center gap-1 text-text-tertiary">
                  <code className="rounded bg-surface-tertiary px-1 py-0.5 text-[10px] font-mono">
                    {f.expected_type ?? "?"}
                  </code>
                  <ArrowLeftRight className="h-2.5 w-2.5 text-text-tertiary/60" />
                  <code className="rounded bg-drift-type-bg px-1 py-0.5 text-[10px] font-mono text-drift-type">
                    {f.actual_type ?? "?"}
                  </code>
                </span>
              }
              delay={i * 30}
            />
          ))}
        </DiffSection>
      )}
    </div>
  );
}

/* ── Shared sub-components ──────────────────────────────────────────────── */

const DIFF_COLORS = {
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

function DiffSection({
  icon,
  label,
  count,
  colorScheme,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  colorScheme: keyof typeof DIFF_COLORS;
  children: React.ReactNode;
}) {
  const colors = DIFF_COLORS[colorScheme];
  return (
    <div
      className={clsx(
        "rounded-lg border overflow-hidden",
        colors.border,
        colors.bg,
      )}
    >
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
      <div className="bg-surface/60 divide-y divide-border-subtle">
        {children}
      </div>
    </div>
  );
}

function DiffRow({
  path,
  detail,
  delay = 0,
}: {
  path: string;
  detail: React.ReactNode;
  delay?: number;
}) {
  return (
    <div
      className="flex items-center justify-between gap-2 px-3 py-1.5 animate-fade-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <code className="text-xs font-mono text-text-primary truncate">
        {path}
      </code>
      <div className="shrink-0 text-[11px]">{detail}</div>
    </div>
  );
}
