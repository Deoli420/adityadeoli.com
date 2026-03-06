import { Link } from "react-router-dom";
import { AlertTriangle, ChevronRight } from "lucide-react";
import { useTopFailures } from "@/hooks/useDashboard.ts";
import { RiskBadge } from "@/components/common/RiskBadge.tsx";
import { Skeleton } from "@/components/common/Skeleton.tsx";
import type { RiskLevel } from "@/types/index.ts";
import clsx from "clsx";

/**
 * Ranked list of endpoints with highest failure rates.
 *
 * Each row shows: name, failure rate bar, risk badge, link to detail.
 */
export function TopFailuresWidget() {
  const { data, isLoading } = useTopFailures(5);

  if (isLoading) {
    return (
      <div className="card p-5">
        <h3 className="text-sm font-medium text-text-primary mb-4">
          Top Failures
        </h3>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const endpoints = data?.endpoints ?? [];

  if (endpoints.length === 0) {
    return (
      <div className="card p-5">
        <h3 className="text-sm font-medium text-text-primary mb-4">
          Top Failures
        </h3>
        <div className="flex h-48 flex-col items-center justify-center text-center">
          <AlertTriangle className="h-8 w-8 text-text-tertiary/50 mb-2" />
          <p className="text-xs text-text-tertiary">
            No failure data available yet.
          </p>
        </div>
      </div>
    );
  }

  const maxRate = Math.max(...endpoints.map((e) => e.failure_rate_percent), 1);

  return (
    <div className="card p-5">
      <h3 className="text-sm font-medium text-text-primary mb-4">
        Top Failures
      </h3>
      <div className="space-y-3">
        {endpoints.map((ep, idx) => (
          <Link
            key={ep.endpoint_id}
            to={`/endpoints/${ep.endpoint_id}`}
            className="group flex items-center gap-3 rounded-lg p-2 -mx-2 transition-colors hover:bg-surface-secondary/50"
          >
            <span className="text-[11px] font-mono text-text-tertiary w-4 text-right shrink-0">
              {idx + 1}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-text-primary truncate">
                  {ep.endpoint_name}
                </span>
                <span
                  className={clsx(
                    "text-[11px] font-mono font-semibold tabular-nums shrink-0",
                    ep.failure_rate_percent > 50
                      ? "text-risk-critical"
                      : ep.failure_rate_percent > 20
                        ? "text-risk-high"
                        : "text-text-secondary",
                  )}
                >
                  {ep.failure_rate_percent.toFixed(1)}%
                </span>
              </div>
              {/* Failure rate bar */}
              <div className="mt-1 h-1 w-full rounded-full bg-surface-tertiary overflow-hidden">
                <div
                  className={clsx(
                    "h-full rounded-full transition-all",
                    ep.failure_rate_percent > 50
                      ? "bg-risk-critical"
                      : ep.failure_rate_percent > 20
                        ? "bg-risk-high"
                        : ep.failure_rate_percent > 5
                          ? "bg-risk-medium"
                          : "bg-risk-low",
                  )}
                  style={{
                    width: `${(ep.failure_rate_percent / maxRate) * 100}%`,
                  }}
                />
              </div>
            </div>
            <RiskBadge
              level={ep.risk_level as RiskLevel}
              score={ep.risk_score}
            />
            <ChevronRight className="h-3.5 w-3.5 text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}
