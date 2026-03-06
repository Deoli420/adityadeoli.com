import {
  History,
  CheckCircle2,
  Loader2,
  Info,
  Hash,
  Layers,
  Minus,
  Plus,
  ArrowLeftRight,
} from "lucide-react";
import {
  useSchemaHistory,
  useAcceptSchema,
} from "@/hooks/useSchemaHistory.ts";
import { SchemaDiffViewer } from "@/components/detail/SchemaDiffViewer.tsx";
import { Skeleton } from "@/components/common/Skeleton.tsx";
import { timeAgo } from "@/utils/formatters.ts";
import type { SchemaSnapshot } from "@/types/index.ts";
import clsx from "clsx";

interface SchemaTimelineProps {
  endpointId: string;
}

/**
 * Schema History Timeline — chronological list of schema changes
 * with timestamps, field counts, and drift summaries.
 *
 * Includes the SchemaDiffViewer for side-by-side comparison.
 */
export function SchemaTimeline({ endpointId }: SchemaTimelineProps) {
  const { data, isLoading } = useSchemaHistory(endpointId);
  const acceptMutation = useAcceptSchema(endpointId);

  if (isLoading) {
    return (
      <div className="card p-5">
        <Skeleton className="mb-3 h-4 w-44" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const snapshots = data?.snapshots ?? [];

  if (snapshots.length === 0) {
    return (
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <History className="h-4 w-4 text-text-tertiary" />
          <h3 className="text-sm font-medium text-text-primary">
            Schema History
          </h3>
        </div>
        <div className="flex h-32 items-center justify-center">
          <div className="text-center">
            <Info className="mx-auto h-8 w-8 text-text-tertiary/50 mb-2" />
            <p className="text-xs text-text-tertiary">
              No schema snapshots yet. Run the monitor to start tracking schema
              changes.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header + Accept button */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-text-tertiary" />
            <h3 className="text-sm font-medium text-text-primary">
              Schema History
            </h3>
            <span className="text-[11px] text-text-tertiary">
              {snapshots.length} snapshot{snapshots.length !== 1 ? "s" : ""}
            </span>
          </div>
          <button
            className="btn-secondary"
            disabled={acceptMutation.isPending}
            onClick={() => acceptMutation.mutate()}
          >
            {acceptMutation.isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Accepting...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-3.5 w-3.5" />
                Accept Current
              </>
            )}
          </button>
        </div>

        {/* Timeline list */}
        <div className="space-y-2">
          {snapshots.map((snapshot, index) => (
            <TimelineEntry
              key={snapshot.id}
              snapshot={snapshot}
              isLatest={index === 0}
              isInitial={index === snapshots.length - 1 && !snapshot.diff_summary}
            />
          ))}
        </div>
      </div>

      {/* Diff viewer */}
      <SchemaDiffViewer endpointId={endpointId} snapshots={snapshots} />
    </div>
  );
}

/* ── Timeline entry ─────────────────────────────────────────────────────── */

function TimelineEntry({
  snapshot,
  isLatest,
  isInitial,
}: {
  snapshot: SchemaSnapshot;
  isLatest: boolean;
  isInitial: boolean;
}) {
  const diff = snapshot.diff_summary;
  const hasDrift = diff?.has_drift ?? false;
  const totalDiffs = diff?.total_differences ?? 0;

  return (
    <div
      className={clsx(
        "flex items-start gap-3 rounded-lg border px-4 py-3 transition-colors",
        isLatest
          ? "bg-accent/5 border-accent/20"
          : "bg-white/[0.02] border-white/[0.04]",
      )}
    >
      {/* Timeline dot */}
      <div className="mt-1 shrink-0">
        <div
          className={clsx(
            "h-2.5 w-2.5 rounded-full ring-2",
            isLatest
              ? "bg-accent ring-accent/30"
              : hasDrift
                ? "bg-drift-type ring-drift-type/30"
                : "bg-text-tertiary/50 ring-text-tertiary/20",
          )}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-text-primary">
            {isInitial ? "Initial Schema" : hasDrift ? "Schema Changed" : "No Change"}
          </span>
          {isLatest && (
            <span className="text-[10px] font-semibold text-accent bg-accent/10 px-1.5 py-0.5 rounded-full uppercase">
              Latest
            </span>
          )}
          {hasDrift && totalDiffs > 0 && (
            <span className="text-[10px] font-medium text-drift-type bg-drift-type-bg px-1.5 py-0.5 rounded-full">
              {totalDiffs} diff{totalDiffs !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        <div className="mt-1 flex items-center gap-3 text-[11px] text-text-tertiary">
          <span className="flex items-center gap-1" title="Timestamp">
            {timeAgo(snapshot.created_at)}
          </span>
          <span className="flex items-center gap-1" title="Field count">
            <Layers className="h-3 w-3" />
            {snapshot.field_count} fields
          </span>
          <span
            className="flex items-center gap-1 font-mono"
            title={`Hash: ${snapshot.schema_hash}`}
          >
            <Hash className="h-3 w-3" />
            {snapshot.schema_hash.slice(0, 8)}
          </span>
        </div>

        {/* Drift summary badges */}
        {hasDrift && diff && (
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            {diff.missing_fields.length > 0 && (
              <DriftBadge
                icon={<Minus className="h-2.5 w-2.5" />}
                count={diff.missing_fields.length}
                label="removed"
                colorClass="text-drift-missing bg-drift-missing-bg"
              />
            )}
            {diff.new_fields.length > 0 && (
              <DriftBadge
                icon={<Plus className="h-2.5 w-2.5" />}
                count={diff.new_fields.length}
                label="added"
                colorClass="text-drift-new bg-drift-new-bg"
              />
            )}
            {diff.type_mismatches.length > 0 && (
              <DriftBadge
                icon={<ArrowLeftRight className="h-2.5 w-2.5" />}
                count={diff.type_mismatches.length}
                label="type"
                colorClass="text-drift-type bg-drift-type-bg"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function DriftBadge({
  icon,
  count,
  label,
  colorClass,
}: {
  icon: React.ReactNode;
  count: number;
  label: string;
  colorClass: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
        colorClass,
      )}
    >
      {icon}
      {count} {label}
    </span>
  );
}
