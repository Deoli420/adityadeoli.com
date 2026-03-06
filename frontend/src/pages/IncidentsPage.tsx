import { useState } from "react";
import { Link } from "react-router-dom";
import { useIncidents } from "@/hooks/useIncidents.ts";
import {
  AlertTriangle,
  Search,
  Clock,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";
import clsx from "clsx";
import type { IncidentListItem, IncidentStatus, IncidentSeverity } from "@/types/index.ts";

const TABS: { label: string; value: string | undefined; icon: React.ElementType }[] = [
  { label: "All", value: undefined, icon: AlertTriangle },
  { label: "Open", value: "OPEN", icon: ShieldAlert },
  { label: "Investigating", value: "INVESTIGATING", icon: Search },
  { label: "Resolved", value: "RESOLVED", icon: CheckCircle2 },
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
  return (
    <Link
      to={`/incidents/${incident.id}`}
      className="group flex items-center gap-4 rounded-xl border border-white/[0.04] bg-white/[0.02] px-5 py-4 transition-all hover:bg-white/[0.04] hover:border-white/[0.08]"
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
        <p className="truncate text-sm font-medium text-slate-200 group-hover:text-white transition-colors">
          {incident.title}
        </p>
        <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
          <span>{incident.endpoint_name || "Unknown endpoint"}</span>
          <span className="text-slate-700">|</span>
          <span className="capitalize">{incident.trigger_type}</span>
          <span className="text-slate-700">|</span>
          <Clock className="h-3 w-3" />
          <span>{timeAgo(incident.started_at)}</span>
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

      <ArrowRight className="h-4 w-4 shrink-0 text-slate-600 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-400" />
    </Link>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-white/[0.04] bg-white/[0.02] px-5 py-4">
      <div className="h-2.5 w-2.5 rounded-full bg-slate-800 animate-pulse" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-2/3 rounded bg-slate-800 animate-pulse" />
        <div className="h-3 w-1/3 rounded bg-slate-800/60 animate-pulse" />
      </div>
      <div className="h-5 w-16 rounded-full bg-slate-800 animate-pulse" />
      <div className="h-5 w-20 rounded-full bg-slate-800 animate-pulse" />
    </div>
  );
}

export function IncidentsPage() {
  const [activeTab, setActiveTab] = useState<string | undefined>(undefined);
  const { data: incidents, isLoading } = useIncidents(activeTab);

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
            <h1 className="text-xl font-semibold text-white">Incidents</h1>
            <p className="text-sm text-slate-500">
              {openCount > 0
                ? `${openCount} open incident${openCount > 1 ? "s" : ""}`
                : "No open incidents"}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-white/[0.03] p-1">
        {TABS.map(({ label, value, icon: Icon }) => (
          <button
            key={label}
            onClick={() => setActiveTab(value)}
            className={clsx(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
              activeTab === value
                ? "bg-white/[0.08] text-white shadow-sm"
                : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.03]",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-2">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
        ) : incidents && incidents.length > 0 ? (
          incidents.map((inc) => <IncidentRow key={inc.id} incident={inc} />)
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-white/[0.04] bg-white/[0.02] py-16">
            <CheckCircle2 className="h-10 w-10 text-emerald-500/40 mb-3" />
            <p className="text-sm font-medium text-slate-400">
              {activeTab ? `No ${activeTab.toLowerCase()} incidents` : "No incidents yet"}
            </p>
            <p className="mt-1 text-xs text-slate-600">
              Incidents are created automatically when anomalies are detected
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
