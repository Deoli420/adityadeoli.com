import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Play,
  Loader2,
  ExternalLink,
  Clock,
  Zap,
  BarChart3,
  Hash,
  Pencil,
  Trash2,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
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
import { useEndpointIncidents } from "@/hooks/useIncidents.ts";
import { RiskBadge } from "@/components/common/RiskBadge.tsx";
import { Skeleton } from "@/components/common/Skeleton.tsx";
import { ErrorState } from "@/components/common/ErrorState.tsx";
import { PerformanceChart } from "@/components/detail/PerformanceChart.tsx";
import { RiskBreakdown } from "@/components/detail/RiskBreakdown.tsx";
import { RunTimeline } from "@/components/detail/RunTimeline.tsx";
import { SchemaDrift } from "@/components/detail/SchemaDrift.tsx";
import { AnomalyAnalysis } from "@/components/detail/AnomalyAnalysis.tsx";
import { SLAConfigPanel } from "@/components/detail/SLAConfigPanel.tsx";
import { AlertRulesPanel } from "@/components/detail/AlertRulesPanel.tsx";
import { SchemaTimeline } from "@/components/detail/SchemaTimeline.tsx";
import { DebugAssistant } from "@/components/detail/DebugAssistant.tsx";
import { SecurityFindings } from "@/components/detail/SecurityFindings.tsx";
import { ContractViolations } from "@/components/detail/ContractViolations.tsx";
import { formatMethod, formatMs, timeAgo } from "@/utils/formatters.ts";
import { scoreToLevel } from "@/utils/riskUtils.ts";
import toast from "react-hot-toast";
import clsx from "clsx";

/**
 * Endpoint detail page — deep dive into a single monitored API.
 *
 * Layout:
 *   1. Back link + endpoint header (health strip, name, URL, method, badges, actions)
 *   2. Quick stats grid (status, latency, runs, last run)
 *   3. Performance Chart + Risk Breakdown (2-col grid)
 *   4. SLA & Uptime
 *   5. Schema Drift + AI Anomaly Analysis (2-col grid)
 *   6. Run Timeline (full-width)
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
  const { data: incidents } = useEndpointIncidents(id!);
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
  const lastStatus = lastRun?.status_code ?? 0;
  const isHealthy = lastStatus >= 200 && lastStatus < 400;

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
      <div className="card overflow-hidden">
        {/* Health strip across top — last 20 runs as colored bars */}
        {runs && runs.length > 0 && (
          <div className="flex h-1.5 w-full">
            {[...runs]
              .slice(0, 20)
              .reverse()
              .map((run) => {
                const code = run.status_code ?? 0;
                const ok = code >= 200 && code < 400;
                return (
                  <div
                    key={run.id}
                    className={clsx(
                      "flex-1 transition-colors",
                      ok ? "bg-risk-low" : "bg-risk-critical",
                    )}
                    title={`${code} · ${formatMs(run.response_time_ms)}`}
                  />
                );
              })}
          </div>
        )}

        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-lg font-semibold tracking-tight text-text-primary">
                  {endpoint.name}
                </h2>
                {riskLevel && (
                  <RiskBadge level={riskLevel} score={risk?.calculated_score} size="md" />
                )}
                {/* Health status badge */}
                {lastRun && (
                  <span
                    className={clsx(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium border",
                      isHealthy
                        ? "bg-risk-low-bg text-risk-low border-risk-low-border"
                        : "bg-risk-critical-bg text-risk-critical border-risk-critical-border",
                    )}
                  >
                    {isHealthy ? (
                      <CheckCircle2 className="h-2.5 w-2.5" />
                    ) : (
                      <AlertTriangle className="h-2.5 w-2.5" />
                    )}
                    {isHealthy ? "Healthy" : "Error"}
                  </span>
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
        </div>
      </div>

      {/* Quick stats grid */}
      {totalRuns > 0 && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <QuickStatCard
            icon={<Zap className="h-4 w-4" />}
            label="Last Status"
            value={
              <span
                className={clsx(
                  "font-mono",
                  lastStatus && lastStatus < 400
                    ? "text-risk-low"
                    : "text-risk-critical",
                )}
              >
                {lastRun?.status_code ?? "\u2014"}
              </span>
            }
          />
          <QuickStatCard
            icon={<BarChart3 className="h-4 w-4" />}
            label="Avg Latency"
            value={<span className="font-mono">{formatMs(avgLatency)}</span>}
          />
          <QuickStatCard
            icon={<Hash className="h-4 w-4" />}
            label="Total Runs"
            value={totalRuns}
          />
          <QuickStatCard
            icon={<Clock className="h-4 w-4" />}
            label="Last Run"
            value={timeAgo(lastRun?.created_at)}
          />
        </div>
      )}

      {/* Performance + Risk row */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <PerformanceChart
          runs={runs}
          performance={performance}
          isLoading={runsLoading}
        />
        <RiskBreakdown risk={risk} isLoading={riskLoading} />
      </div>

      {/* SLA & Uptime */}
      <SLAConfigPanel endpointId={id!} />

      {/* Alert Rules */}
      <AlertRulesPanel endpointId={id!} />

      {/* Active Incidents */}
      {incidents && incidents.filter((i) => i.status !== "RESOLVED").length > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-risk-critical" />
              Active Incidents
            </h3>
            <Link
              to="/incidents"
              className="text-xs text-accent hover:underline"
            >
              View All
            </Link>
          </div>
          <div className="space-y-2">
            {incidents
              .filter((i) => i.status !== "RESOLVED")
              .slice(0, 3)
              .map((inc) => (
                <Link
                  key={inc.id}
                  to={`/incidents/${inc.id}`}
                  className="flex items-center gap-3 rounded-lg bg-surface border border-border px-4 py-3 hover:bg-surface-tertiary transition-colors"
                >
                  <div
                    className={clsx(
                      "h-2 w-2 rounded-full shrink-0",
                      inc.severity === "CRITICAL" && "bg-red-500",
                      inc.severity === "HIGH" && "bg-orange-500",
                      inc.severity === "MEDIUM" && "bg-yellow-500",
                      inc.severity === "LOW" && "bg-emerald-500",
                    )}
                  />
                  <span className="flex-1 text-sm text-text-primary truncate">
                    {inc.title}
                  </span>
                  <span
                    className={clsx(
                      "text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase",
                      inc.status === "OPEN"
                        ? "bg-red-500/15 text-red-400"
                        : "bg-amber-500/15 text-amber-400",
                    )}
                  >
                    {inc.status}
                  </span>
                </Link>
              ))}
          </div>
        </div>
      )}

      {/* Schema Drift + AI Anomaly */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <SchemaDrift
          drift={lastRunResult?.schema_drift}
          isLoading={triggerRun.isPending}
        />
        <AnomalyAnalysis
          anomalies={anomalies ?? []}
          lastReadout={lastRunResult?.anomaly ?? null}
          totalRuns={totalRuns}
          isLoading={anomaliesLoading}
          isRunning={triggerRun.isPending}
          onRunAnalysis={() => triggerRun.mutate()}
        />
      </div>

      {/* AI Debug Assistant */}
      <DebugAssistant endpointId={id!} />

      {/* Security Findings (credential leaks) */}
      <SecurityFindings endpointId={id!} />

      {/* API Contract Testing */}
      <ContractViolations endpointId={id!} />

      {/* Schema History & Diff Viewer */}
      <SchemaTimeline endpointId={id!} />

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

function QuickStatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-text-tertiary">{icon}</span>
        <span className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className="text-sm font-semibold text-text-primary tabular-nums">
        {value}
      </p>
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
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card p-4">
            <Skeleton className="h-3 w-20 mb-2" />
            <Skeleton className="h-5 w-16" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Skeleton className="h-72 w-full rounded-xl" />
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
      <Skeleton className="h-32 w-full rounded-xl" />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Skeleton className="h-52 w-full rounded-xl" />
        <Skeleton className="h-52 w-full rounded-xl" />
      </div>
      <Skeleton className="h-52 w-full rounded-xl" />
    </div>
  );
}
