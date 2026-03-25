import { Link } from "react-router-dom";
import { Zap } from "lucide-react";
import clsx from "clsx";
import { timeAgo } from "@/utils/formatters.ts";
import type { IncidentClusterListItem } from "@/types/index.ts";

const SIGNAL_LABELS: Record<string, string> = {
  status_mismatch: "Status",
  latency_spike: "Latency",
  schema_drift: "Schema",
  security_finding: "Security",
  contract_violation: "Contract",
  ai_anomaly: "AI",
};

const STATUS_PILL: Record<string, string> = {
  ACTIVE: "bg-red-500/15 text-red-400",
  RESOLVED: "bg-emerald-500/15 text-emerald-400",
  MERGED: "bg-blue-500/15 text-blue-400",
};

export function ClusterCard({ cluster }: { cluster: IncidentClusterListItem }) {
  return (
    <Link to={`/incidents/clusters/${cluster.id}`} className="card card-hover p-4 block">
      {/* Top row */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <Zap className="h-4 w-4 shrink-0 text-amber-500" />
          <p className="text-sm font-medium text-text-primary truncate">{cluster.title}</p>
        </div>
        <span
          className={clsx(
            "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
            STATUS_PILL[cluster.status] ?? "bg-surface-tertiary text-text-secondary",
          )}
        >
          {cluster.status}
        </span>
      </div>

      {/* Shared signals */}
      {cluster.shared_signals.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {cluster.shared_signals.map((sig) => (
            <span
              key={sig}
              className="bg-surface-tertiary text-text-secondary text-[10px] px-1.5 py-0.5 rounded"
            >
              {SIGNAL_LABELS[sig] ?? sig}
            </span>
          ))}
        </div>
      )}

      {/* Bottom row */}
      <div className="flex items-center justify-between text-xs text-text-tertiary">
        <span>{cluster.member_count} endpoint{cluster.member_count !== 1 ? "s" : ""} affected</span>
        <span>{timeAgo(cluster.detected_at)}</span>
      </div>
    </Link>
  );
}
