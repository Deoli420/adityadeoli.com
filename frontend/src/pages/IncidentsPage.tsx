import { useState } from "react";
import { Link } from "react-router-dom";
import { useCanWrite } from "@/hooks/useAuth.ts";
import { useIncidents, useUpdateIncidentStatus } from "@/hooks/useIncidents.ts";
import { useClusters } from "@/hooks/useClusters.ts";
import { ClusterCard } from "@/components/incidents/ClusterCard.tsx";
import { formatDuration } from "@/utils/formatters.ts";
import { IncidentSummaryBanner } from "@/components/incidents/IncidentSummaryBanner.tsx";
import {
  AlertTriangle,
  Search,
  Clock,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
  Brain,
  Bell,
  UserCircle,
  Loader2,
  Zap,
} from "lucide-react";
import clsx from "clsx";
import type { IncidentListItem, IncidentStatus, IncidentSeverity } from "@/types/index.ts";

const TABS: { label: string; value: string | undefined; icon: React.ElementType }[] = [
  { label: "All", value: undefined, icon: AlertTriangle },
  { label: "Open", value: "OPEN", icon: ShieldAlert },
  { label: "Investigating", value: "INVESTIGATING", icon: Search },
  { label: "Resolved", value: "RESOLVED", icon: CheckCircle2 },
  { label: "Clusters", value: "CLUSTERS", icon: Zap },
];

const SEVERITY_COLORS: Record<IncidentSeverity, string> = {
  CRITICAL: "bg-red-500/15 text-red-400 border-red-500/20",
  HIGH: "bg-orange-500/15 text-orange-400 border-orange-500/20",
  MEDIUM: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  LOW: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
};

const STATUS_COLORS: Record<IncidentStatus, string> = {
  OPEN: "bg-red-500/15 text-red-400",
  INVESTIGATING: "bg-amber-500/15 text-amber-400",
  RESOLVED: "bg-emerald-500/15 text-emerald-400",
};

const TRIGGER_CONFIG: Record<string, { icon: React.ElementType; label: string }> = {
  anomaly: { icon: Brain, label: "AI anomaly detection" },
  alert_rule: { icon: Bell, label: "Alert rule" },
  manual: { icon: UserCircle, label: "Manual" },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function IncidentRow({ incident }: { incident: IncidentListItem }) {
  const canWrite = useCanWrite();
  const updateStatus = useUpdateIncidentStatus(incident.id);

  const trigger = TRIGGER_CONFIG[incident.trigger_type] ?? {
    icon: AlertTriangle,
    label: incident.trigger_type,
  };
  const TriggerIcon = trigger.icon;

  // Duration display
  let durationLabel: string | null = null;
  if (incident.status === "OPEN" || incident.status === "INVESTIGATING") {
    durationLabel =
      "Open for " + formatDuration(Date.now() - new Date(incident.started_at).getTime());
  } else if (incident.status === "RESOLVED" && incident.resolved_at) {
    durationLabel =
      "Resolved in " +
      formatDuration(
        new Date(incident.resolved_at).getTime() - new Date(incident.started_at).getTime(),
      );
  }

  return (
    <Link
      to={`/incidents/${incident.id}`}
      className="group flex items-center gap-4 rounded-xl border border-border bg-surface px-5 py-4 transition-all hover:bg-surface-tertiary hover:border-text-tertiary"
    >
      {/* Severity dot */}
      <div
        className={clsx(
          "h-2.5 w-2.5 shrink-0 rounded-full",
          incident.severity === "CRITICAL" && "bg-red-500",
          incident.severity === "HIGH" && "bg-orange-500",
          incident.severity === "MEDIUM" && "bg-yellow-500",
          incident.severity === "LOW" && "bg-emerald-500",
        )}
      />

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-text-primary group-hover:text-accent transition-colors">
          {incident.title}
        </p>
        {incident.narrative && (
          <p className="mt-0.5 text-[11px] text-text-tertiary line-clamp-1">
            {incident.narrative}
          </p>
        )}
        <div className="mt-1 flex items-center gap-3 text-xs text-text-secondary">
          <Link
            to={`/endpoints/${incident.endpoint_id}`}
            className="text-accent hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {incident.endpoint_name || "Unknown"}
          </Link>
          <span className="text-text-tertiary">|</span>
          <span className="flex items-center gap-1 capitalize">
            <TriggerIcon className="h-3 w-3" />
            {trigger.label}
          </span>
          <span className="text-text-tertiary">|</span>
          <Clock className="h-3 w-3" />
          <span>{timeAgo(incident.started_at)}</span>
          {durationLabel && (
            <>
              <span className="text-text-tertiary">|</span>
              <span>{durationLabel}</span>
            </>
          )}
        </div>
      </div>

      {/* Badges */}
      <span
        className={clsx(
          "shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
          SEVERITY_COLORS[incident.severity],
        )}
      >
        {incident.severity}
      </span>
      <span
        className={clsx(
          "shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
          STATUS_COLORS[incident.status],
        )}
      >
        {incident.status}
      </span>

      {/* Quick action buttons */}
      {canWrite && incident.status === "OPEN" && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            updateStatus.mutate({ status: "INVESTIGATING" });
          }}
          disabled={updateStatus.isPending}
          className="shrink-0 text-[11px] px-2 py-1 rounded-md border border-border hover:bg-surface-tertiary text-text-secondary font-medium transition-colors"
        >
          {updateStatus.isPending ? (
            <Loader2 className="animate-spin h-3 w-3" />
          ) : (
            "Acknowledge"
          )}
        </button>
      )}
      {canWrite && incident.status === "INVESTIGATING" && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            updateStatus.mutate({ status: "RESOLVED" });
          }}
          disabled={updateStatus.isPending}
          className="shrink-0 text-[11px] px-2 py-1 rounded-md border border-border hover:bg-surface-tertiary text-text-secondary font-medium transition-colors"
        >
          {updateStatus.isPending ? (
            <Loader2 className="animate-spin h-3 w-3" />
          ) : (
            "Resolve"
          )}
        </button>
      )}

      <ArrowRight className="h-4 w-4 shrink-0 text-text-tertiary transition-transform group-hover:translate-x-0.5 group-hover:text-text-secondary" />
    </Link>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-surface px-5 py-4">
      <div className="h-2.5 w-2.5 rounded-full bg-surface-tertiary animate-pulse" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-2/3 rounded bg-surface-tertiary animate-pulse" />
        <div className="h-3 w-1/3 rounded bg-border animate-pulse" />
      </div>
      <div className="h-5 w-16 rounded-full bg-surface-tertiary animate-pulse" />
      <div className="h-5 w-20 rounded-full bg-surface-tertiary animate-pulse" />
    </div>
  );
}

export function IncidentsPage() {
  const [activeTab, setActiveTab] = useState<string | undefined>(undefined);
  const isClustersTab = activeTab === "CLUSTERS";
  const { data: incidents, isLoading } = useIncidents(isClustersTab ? undefined : activeTab);
  const { data: allIncidents } = useIncidents(undefined);
  const { data: clusters, isLoading: clustersLoading } = useClusters();

  const openCount = incidents?.filter((i) => i.status === "OPEN").length ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
            <AlertTriangle className="h-5 w-5 text-red-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-text-primary">Incidents</h1>
            <p className="text-sm text-text-secondary">
              {openCount > 0
                ? `${openCount} open incident${openCount > 1 ? "s" : ""}`
                : "No open incidents"}
            </p>
          </div>
        </div>
      </div>

      {/* Summary Banner */}
      <IncidentSummaryBanner incidents={allIncidents ?? []} />

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-surface-tertiary p-1">
        {TABS.map(({ label, value, icon: Icon }) => (
          <button
            key={label}
            onClick={() => setActiveTab(value)}
            className={clsx(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
              activeTab === value
                ? "bg-surface text-text-primary shadow-sm"
                : "text-text-secondary hover:text-text-primary hover:bg-surface-secondary",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-2">
        {isClustersTab ? (
          clustersLoading ? (
            Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)
          ) : clusters && clusters.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {clusters.map((c) => (
                <ClusterCard key={c.id} cluster={c} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface py-16">
              <Zap className="h-10 w-10 text-amber-500/40 mb-3" />
              <p className="text-sm font-medium text-text-secondary">No clusters detected</p>
              <p className="mt-1 text-xs text-text-tertiary">
                Clusters form when multiple endpoints exhibit correlated failures
              </p>
            </div>
          )
        ) : isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
        ) : incidents && incidents.length > 0 ? (
          incidents.map((inc) => <IncidentRow key={inc.id} incident={inc} />)
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface py-16">
            <CheckCircle2 className="h-10 w-10 text-success/40 mb-3" />
            <p className="text-sm font-medium text-text-secondary">
              {activeTab ? `No ${activeTab.toLowerCase()} incidents` : "No incidents yet"}
            </p>
            <p className="mt-1 text-xs text-text-tertiary">
              Incidents are created automatically when anomalies are detected
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
