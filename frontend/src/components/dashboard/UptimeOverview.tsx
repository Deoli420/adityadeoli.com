import { Link } from "react-router-dom";
import { ArrowUpRight, CheckCircle2, AlertTriangle } from "lucide-react";
import { useUptimeOverview } from "@/hooks/useDashboard.ts";
import { Skeleton } from "@/components/common/Skeleton.tsx";
import clsx from "clsx";

/**
 * Uptime overview widget — shows progress bars per endpoint
 * with SLA target line and breach indicator.
 */
export function UptimeOverview() {
  const { data, isLoading } = useUptimeOverview();

  if (isLoading) {
    return (
      <div className="card p-5">
        <h3 className="text-sm font-medium text-text-primary mb-4">
          Uptime &amp; SLA
        </h3>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const entries = data?.entries ?? [];

  if (entries.length === 0) {
    return (
      <div className="card p-5">
        <h3 className="text-sm font-medium text-text-primary mb-4">
          Uptime &amp; SLA
        </h3>
        <div className="flex h-36 flex-col items-center justify-center text-center">
          <CheckCircle2 className="h-8 w-8 text-text-tertiary/50 mb-2" />
          <p className="text-xs text-text-tertiary">
            No SLA targets configured.
          </p>
          <p className="text-[11px] text-text-tertiary mt-0.5">
            Configure SLA targets on endpoint detail pages.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-text-primary">
          Uptime &amp; SLA
        </h3>
        <span className="text-[11px] text-text-tertiary">
          {entries.filter((e) => !e.is_breached).length}/{entries.length} meeting SLA
        </span>
      </div>
      <div className="space-y-4">
        {entries.map((entry) => (
          <Link
            key={entry.endpoint_id}
            to={`/endpoints/${entry.endpoint_id}`}
            className="group block"
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2 min-w-0">
                {entry.is_breached ? (
                  <AlertTriangle className="h-3 w-3 text-risk-critical shrink-0" />
                ) : (
                  <CheckCircle2 className="h-3 w-3 text-risk-low shrink-0" />
                )}
                <span className="text-xs font-medium text-text-primary truncate group-hover:text-accent transition-colors">
                  {entry.endpoint_name}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={clsx(
                    "text-xs font-mono font-semibold tabular-nums",
                    entry.is_breached ? "text-risk-critical" : "text-risk-low",
                  )}
                >
                  {entry.uptime_percent.toFixed(2)}%
                </span>
                <ArrowUpRight className="h-3 w-3 text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            {/* Progress bar with SLA target line */}
            <div className="relative h-2 w-full rounded-full bg-surface-tertiary overflow-hidden">
              <div
                className={clsx(
                  "h-full rounded-full transition-all",
                  entry.is_breached ? "bg-risk-critical" : "bg-risk-low",
                )}
                style={{ width: `${Math.min(entry.uptime_percent, 100)}%` }}
              />
              {/* SLA target marker */}
              <div
                className="absolute top-0 h-full w-px bg-text-secondary/50"
                style={{ left: `${entry.sla_target}%` }}
                title={`SLA target: ${entry.sla_target}%`}
              />
            </div>
            <div className="flex items-center justify-between mt-0.5">
              <span className="text-[10px] text-text-tertiary">
                Target: {entry.sla_target}%
              </span>
              {entry.is_breached && (
                <span className="text-[10px] text-risk-critical font-medium">
                  SLA Breach
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
