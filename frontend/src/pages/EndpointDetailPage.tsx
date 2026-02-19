import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Play, Loader2, ExternalLink, Clock, Zap, Pencil, Trash2, AlertTriangle } from "lucide-react";
import {
  useEndpoint,
  useLatestRisk,
  useEndpointRuns,
  useEndpointAnomalies,
  usePerformance,
  useTriggerMonitorRun,
  useLastRunResult,
} from "@/hooks/useEndpointDetails.ts";
import { useDeleteEndpoint } from "@/hooks/useEndpoints.ts";
import { RiskBadge } from "@/components/common/RiskBadge.tsx";
import { Skeleton } from "@/components/common/Skeleton.tsx";
import { ErrorState } from "@/components/common/ErrorState.tsx";
import { PerformanceChart } from "@/components/detail/PerformanceChart.tsx";
import { RiskBreakdown } from "@/components/detail/RiskBreakdown.tsx";
import { RunTimeline } from "@/components/detail/RunTimeline.tsx";
import { SchemaDrift } from "@/components/detail/SchemaDrift.tsx";
import { AnomalyAnalysis } from "@/components/detail/AnomalyAnalysis.tsx";
import { formatMethod, formatMs, timeAgo } from "@/utils/formatters.ts";
import { scoreToLevel } from "@/utils/riskUtils.ts";
import toast from "react-hot-toast";
import clsx from "clsx";

/**
 * Endpoint detail page — deep dive into a single monitored API.
 *
 * Layout:
 *   1. Back link + endpoint header (name, URL, method, risk badge, Run Now)
 *   2. Quick stats row (last status, avg latency, total runs)
 *   3. Performance Chart + Risk Breakdown (2-col grid)
 *   4. Schema Drift + AI Anomaly Analysis (2-col grid)
 *   5. Run Timeline (full-width)
 */
export function EndpointDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: endpoint, isLoading, isError, refetch } = useEndpoint(id!);
  const { data: risk, isLoading: riskLoading } = useLatestRisk(id!);
  const { data: runs, isLoading: runsLoading } = useEndpointRuns(id!, 30);
  const { data: anomalies, isLoading: anomaliesLoading } = useEndpointAnomalies(id!, 20);
  const { data: performance } = usePerformance(id!);
  const { data: lastRunResult } = useLastRunResult(id!);
  const triggerRun = useTriggerMonitorRun(id!);
  const deleteMutation = useDeleteEndpoint();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (isLoading) {
    return <EndpointDetailSkeleton />;
  }

  if (isError || !endpoint) {
    return <ErrorState message="Failed to load endpoint." onRetry={() => refetch()} />;
  }

  const riskLevel = risk ? scoreToLevel(risk.calculated_score) : undefined;

  // Quick stats derived from runs
  const lastRun = runs?.[0];
  const totalRuns = runs?.length ?? 0;
  const avgLatency =
    runs && runs.length > 0
      ? runs.reduce((sum, r) => sum + (r.response_time_ms ?? 0), 0) / runs.length
      : null;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Back nav */}
      <Link
        to="/"
        className="group inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
        Back to Dashboard
      </Link>

      {/* Header card */}
      <div className="card p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-lg font-semibold tracking-tight text-text-primary">
                {endpoint.name}
              </h2>
              {riskLevel && (
                <RiskBadge level={riskLevel} score={risk?.calculated_score} size="md" />
              )}
            </div>
            <div className="mt-2.5 flex items-center gap-3 text-sm">
              <span
                className={clsx(
                  "inline-block rounded-md px-2 py-0.5 text-xs font-mono font-semibold tracking-wide",
                  "bg-surface-tertiary text-text-secondary",
                )}
              >
                {formatMethod(endpoint.method)}
              </span>
              <a
                href={endpoint.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group/link inline-flex items-center gap-1 text-xs text-text-secondary hover:text-accent transition-colors truncate max-w-md"
              >
                <span className="truncate">{endpoint.url}</span>
                <ExternalLink className="h-3 w-3 shrink-0 opacity-0 group-hover/link:opacity-100 transition-opacity" />
              </a>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <Link
              to={`/endpoints/${id}/edit`}
              className="btn-secondary"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Link>
            <button
              className="btn-secondary !text-risk-critical hover:!bg-risk-critical-bg hover:!border-risk-critical/30"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
            <button
              className="btn-primary"
              disabled={triggerRun.isPending}
              onClick={() => triggerRun.mutate()}
            >
              {triggerRun.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5" />
                  Run Now
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick stats bar */}
        {totalRuns > 0 && (
          <div className="mt-4 pt-4 border-t border-border-subtle flex items-center gap-6 text-xs">
            <QuickStat
              icon={<Zap className="h-3 w-3" />}
              label="Last Status"
              value={
                lastRun ? (
                  <span
                    className={clsx(
                      "font-mono font-semibold",
                      (lastRun.status_code ?? 0) < 400
                        ? "text-risk-low"
                        : "text-risk-critical",
                    )}
                  >
                    {lastRun.status_code ?? "\u2014"}
                  </span>
                ) : (
                  "\u2014"
                )
              }
            />
            <QuickStat
              icon={<Clock className="h-3 w-3" />}
              label="Avg Latency"
              value={
                <span className="font-mono">{formatMs(avgLatency)}</span>
              }
            />
            <QuickStat
              label="Total Runs"
              value={totalRuns}
            />
            <QuickStat
              label="Last Run"
              value={timeAgo(lastRun?.created_at)}
            />
          </div>
        )}
      </div>

      {/* Performance + Risk row */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <PerformanceChart
          runs={runs}
          performance={performance}
          isLoading={runsLoading}
        />
        <RiskBreakdown risk={risk} isLoading={riskLoading} />
      </div>

      {/* Schema Drift + AI Anomaly */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <SchemaDrift
          drift={lastRunResult?.schema_drift}
          isLoading={triggerRun.isPending}
        />
        <AnomalyAnalysis
          anomalies={anomalies}
          isLoading={anomaliesLoading}
        />
      </div>

      {/* Run Timeline */}
      <RunTimeline runs={runs} isLoading={runsLoading} />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowDeleteConfirm(false)}
          />
          {/* Modal */}
          <div className="relative card p-6 w-full max-w-sm mx-4 shadow-xl animate-fade-in">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-risk-critical-bg">
                <AlertTriangle className="h-4.5 w-4.5 text-risk-critical" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-text-primary">
                  Delete Endpoint
                </h3>
                <p className="mt-1 text-xs text-text-secondary leading-relaxed">
                  Are you sure you want to delete{" "}
                  <span className="font-medium text-text-primary">
                    {endpoint.name}
                  </span>
                  ? This will remove all associated runs, anomaly data, and risk
                  scores. This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                className="btn-secondary"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="inline-flex items-center gap-1.5 rounded-lg border border-risk-critical/30 bg-risk-critical px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-risk-critical/90"
                disabled={deleteMutation.isPending}
                onClick={async () => {
                  try {
                    await deleteMutation.mutateAsync(id!);
                    toast.success("Endpoint deleted");
                    navigate("/");
                  } catch {
                    toast.error("Failed to delete endpoint");
                  }
                }}
              >
                {deleteMutation.isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────────────────────── */

function QuickStat({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {icon && <span className="text-text-tertiary">{icon}</span>}
      <span className="text-text-tertiary">{label}:</span>
      <span className="text-text-primary font-medium">{value}</span>
    </div>
  );
}

/** Loading skeleton for the detail page */
function EndpointDetailSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-4 w-32" />
      <div className="card p-6">
        <Skeleton className="h-6 w-48 mb-3" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Skeleton className="h-72 w-full rounded-xl" />
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Skeleton className="h-52 w-full rounded-xl" />
        <Skeleton className="h-52 w-full rounded-xl" />
      </div>
      <Skeleton className="h-52 w-full rounded-xl" />
    </div>
  );
}
