import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Activity,
  AlertTriangle,
  Server,
  TrendingUp,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Search,
} from "lucide-react";
import { useEndpoints, useDashboardStats } from "@/hooks/useEndpoints.ts";
import {
  useLatestRisk,
  useEndpointRuns,
} from "@/hooks/useEndpointDetails.ts";
import type { DashboardStats } from "@/services/endpointsService.ts";
import { StatCard } from "@/components/common/StatCard.tsx";
import { SkeletonCard, Skeleton } from "@/components/common/Skeleton.tsx";
import { EmptyState } from "@/components/common/EmptyState.tsx";
import { ErrorState } from "@/components/common/ErrorState.tsx";
import { RiskBadge } from "@/components/common/RiskBadge.tsx";
import { formatMethod, timeAgo, formatMs } from "@/utils/formatters.ts";
import { scoreToLevel } from "@/utils/riskUtils.ts";
import type { ApiEndpoint } from "@/types/index.ts";
import clsx from "clsx";

/**
 * Dashboard — the primary landing page.
 *
 * Structure:
 *   1. KPI stat cards row (endpoints, active monitors, anomalies 24h, avg risk)
 *   2. Endpoint table with inline risk badges and latency indicators
 *
 * Each table row fetches its own latest risk score + runs via React Query.
 */
const METHOD_OPTIONS = ["ALL", "GET", "POST", "PUT", "PATCH", "DELETE"] as const;

export function DashboardPage() {
  const { data: endpoints, isLoading, isError, refetch } = useEndpoints();
  const { data: stats } = useDashboardStats();

  // Search & filter state
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState<string>("ALL");

  // Derived stats
  const endpointCount = endpoints?.length ?? 0;

  // Filtered endpoints (client-side — all data is already loaded)
  const filtered = useMemo(() => {
    if (!endpoints) return [];
    let result = endpoints;
    if (methodFilter !== "ALL") {
      result = result.filter((ep) => ep.method === methodFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (ep) =>
          ep.name.toLowerCase().includes(q) ||
          ep.url.toLowerCase().includes(q),
      );
    }
    return result;
  }, [endpoints, search, methodFilter]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-text-primary">
            Overview
          </h2>
          <p className="mt-0.5 text-xs text-text-secondary">
            Real-time health across all monitored endpoints
          </p>
        </div>
        <Link to="/endpoints/new" className="btn-primary">
          <Plus className="h-3.5 w-3.5" />
          Add Endpoint
        </Link>
      </div>

      {/* KPI Row */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <DashboardKPIs stats={stats ?? null} endpointCount={endpointCount} />
      )}

      {/* Endpoint Table */}
      <div className="card overflow-hidden">
        <div className="border-b border-border px-5 py-3 flex items-center justify-between gap-3">
          <h3 className="text-sm font-medium text-text-primary shrink-0">
            Monitored Endpoints
          </h3>

          {/* Search + filter bar */}
          {endpoints && endpoints.length > 0 && (
            <div className="flex items-center gap-2 ml-auto">
              {/* Search input */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search endpoints…"
                  className="input h-8 w-48 pl-8 text-xs"
                />
              </div>

              {/* Method filter pills */}
              <div className="flex items-center gap-0.5 rounded-lg bg-surface-secondary p-0.5">
                {METHOD_OPTIONS.map((m) => (
                  <button
                    key={m}
                    onClick={() => setMethodFilter(m)}
                    className={clsx(
                      "px-2 py-1 text-[11px] font-medium rounded-md transition-colors",
                      methodFilter === m
                        ? "bg-surface text-text-primary shadow-sm"
                        : "text-text-tertiary hover:text-text-secondary",
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>

              {/* Count badge */}
              <span className="text-[11px] text-text-tertiary tabular-nums shrink-0">
                {filtered.length}/{endpoints.length}
              </span>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : !endpoints || endpoints.length === 0 ? (
          <EmptyState
            title="No endpoints monitored"
            description="Add your first API endpoint to start tracking reliability."
            action={
              <Link to="/endpoints/new" className="btn-primary">
                <Plus className="h-3.5 w-3.5" />
                Add Endpoint
              </Link>
            }
          />
        ) : filtered.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <Search className="mx-auto h-5 w-5 text-text-tertiary mb-2" />
            <p className="text-xs text-text-secondary">
              No endpoints match your search
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle text-left text-[11px] font-medium uppercase tracking-wider text-text-tertiary">
                  <th className="px-5 py-2.5">Endpoint</th>
                  <th className="px-5 py-2.5">Method</th>
                  <th className="px-5 py-2.5">Risk</th>
                  <th className="px-5 py-2.5">Last Latency</th>
                  <th className="px-5 py-2.5">Status</th>
                  <th className="px-5 py-2.5">Last Run</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {filtered.map((ep) => (
                  <EndpointRow key={ep.id} endpoint={ep} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── KPI Stats ──────────────────────────────────────────────────────────── */

function DashboardKPIs({
  stats,
  endpointCount,
}: {
  stats: DashboardStats | null;
  endpointCount: number;
}) {
  const anomalyCount = stats?.anomalies_24h ?? 0;
  const avgScore = stats?.avg_risk_score ?? 0;
  const riskLevel = stats?.avg_risk_level ?? "LOW";

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Total Endpoints"
        value={endpointCount}
        icon={<Server className="h-4 w-4" />}
      />
      <StatCard
        label="Active Monitors"
        value={endpointCount}
        subValue="All active"
        icon={<Activity className="h-4 w-4" />}
        accent="success"
      />
      <StatCard
        label="Anomalies (24h)"
        value={anomalyCount}
        subValue={anomalyCount === 0 ? "All clear" : `${anomalyCount} detected`}
        icon={<AlertTriangle className="h-4 w-4" />}
        accent={anomalyCount > 0 ? "warning" : undefined}
      />
      <StatCard
        label="Avg Risk Score"
        value={avgScore}
        subValue={riskLevel === "LOW" ? "Healthy" : riskLevel}
        icon={<TrendingUp className="h-4 w-4" />}
        accent={
          riskLevel === "CRITICAL" || riskLevel === "HIGH"
            ? "danger"
            : riskLevel === "MEDIUM"
            ? "warning"
            : undefined
        }
      />
    </div>
  );
}

/* ── Table Row ──────────────────────────────────────────────────────────── */

function EndpointRow({ endpoint: ep }: { endpoint: ApiEndpoint }) {
  const { data: risk } = useLatestRisk(ep.id);
  const { data: runs } = useEndpointRuns(ep.id, 5);

  const riskLevel = risk ? scoreToLevel(risk.calculated_score) : null;
  const lastRun = runs?.[0];
  const lastLatency = lastRun?.response_time_ms;
  const lastStatus = lastRun?.status_code ?? 0;
  const isHealthy = lastStatus >= 200 && lastStatus < 400;

  return (
    <tr className="group transition-colors hover:bg-surface-secondary/50">
      <td className="px-5 py-3.5">
        <Link
          to={`/endpoints/${ep.id}`}
          className="font-medium text-text-primary hover:text-accent transition-colors"
        >
          {ep.name}
        </Link>
        <p className="mt-0.5 text-[11px] text-text-tertiary truncate max-w-xs">
          {ep.url}
        </p>
      </td>
      <td className="px-5 py-3.5">
        <span
          className={clsx(
            "inline-block rounded-md px-1.5 py-0.5 text-[11px] font-mono font-semibold",
            "bg-surface-tertiary text-text-secondary",
          )}
        >
          {formatMethod(ep.method)}
        </span>
      </td>
      <td className="px-5 py-3.5">
        {riskLevel ? (
          <RiskBadge level={riskLevel} score={risk?.calculated_score} />
        ) : (
          <span className="text-[11px] text-text-tertiary">{"\u2014"}</span>
        )}
      </td>
      <td className="px-5 py-3.5">
        {lastLatency != null ? (
          <span className="inline-flex items-center gap-1 font-mono text-xs text-text-secondary">
            {formatMs(lastLatency)}
            {lastLatency > 1000 ? (
              <ArrowUpRight className="h-3 w-3 text-risk-high" />
            ) : (
              <ArrowDownRight className="h-3 w-3 text-risk-low" />
            )}
          </span>
        ) : (
          <span className="text-[11px] text-text-tertiary">{"\u2014"}</span>
        )}
      </td>
      <td className="px-5 py-3.5">
        {lastRun ? (
          <span
            className={clsx(
              "inline-flex items-center gap-1.5 text-xs font-medium",
              isHealthy ? "text-risk-low" : "text-risk-critical",
            )}
          >
            <span
              className={clsx(
                "h-1.5 w-1.5 rounded-full",
                isHealthy ? "bg-risk-low animate-pulse-ring" : "bg-risk-critical",
              )}
            />
            {isHealthy ? "Healthy" : `Error ${lastStatus}`}
          </span>
        ) : (
          <span className="text-[11px] text-text-tertiary">Pending</span>
        )}
      </td>
      <td className="px-5 py-3.5 text-xs text-text-secondary">
        {timeAgo(lastRun?.created_at ?? ep.created_at)}
      </td>
      <td className="pr-3">
        <Link
          to={`/endpoints/${ep.id}`}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ChevronRight className="h-4 w-4 text-text-tertiary" />
        </Link>
      </td>
    </tr>
  );
}
