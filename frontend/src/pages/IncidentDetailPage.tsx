import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  useIncident,
  useIncidentTimeline,
  useUpdateIncidentStatus,
  useAddIncidentNote,
} from "@/hooks/useIncidents.ts";
import {
  ArrowLeft,
  AlertTriangle,
  Search,
  CheckCircle2,
  Clock,
  MessageSquare,
  Send,
  ExternalLink,
  ShieldAlert,
  Zap,
  User,
} from "lucide-react";
import clsx from "clsx";
import type { IncidentStatus, IncidentSeverity, IncidentEvent } from "@/types/index.ts";

const SEVERITY_COLORS: Record<IncidentSeverity, string> = {
  CRITICAL: "bg-red-500/15 text-red-400 border-red-500/20",
  HIGH: "bg-orange-500/15 text-orange-400 border-orange-500/20",
  MEDIUM: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  LOW: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
};

const STATUS_META: Record<IncidentStatus, { color: string; icon: React.ElementType; label: string }> = {
  OPEN: { color: "bg-red-500/15 text-red-400", icon: ShieldAlert, label: "Open" },
  INVESTIGATING: { color: "bg-amber-500/15 text-amber-400", icon: Search, label: "Investigating" },
  RESOLVED: { color: "bg-emerald-500/15 text-emerald-400", icon: CheckCircle2, label: "Resolved" },
};

const EVENT_ICONS: Record<string, React.ElementType> = {
  created: Zap,
  status_change: ShieldAlert,
  note_added: MessageSquare,
  auto_resolved: CheckCircle2,
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function duration(start: string, end: string | null): string {
  const s = new Date(start).getTime();
  const e = end ? new Date(end).getTime() : Date.now();
  const diff = e - s;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ${mins % 60}m`;
  const days = Math.floor(hrs / 24);
  return `${days}d ${hrs % 24}h`;
}

function TimelineEvent({ event }: { event: IncidentEvent }) {
  const Icon = EVENT_ICONS[event.event_type] || Clock;
  const detail = event.detail;

  let description = event.event_type.replace(/_/g, " ");
  if (event.event_type === "status_change" && detail) {
    description = `${detail.from} → ${detail.to}`;
  } else if (event.event_type === "auto_resolved" && detail) {
    description = `Auto-resolved after ${detail.consecutive_successes} consecutive successes`;
  } else if (event.event_type === "note_added" && detail) {
    description = (detail.note_preview as string)?.slice(0, 120) || "Note added";
  } else if (event.event_type === "created" && detail) {
    description = detail.auto
      ? `Auto-created from ${detail.trigger} (score: ${detail.severity_score})`
      : `Created — ${detail.severity} severity`;
  }

  return (
    <div className="relative flex gap-4 pb-6 last:pb-0">
      {/* Vertical line */}
      <div className="absolute left-[15px] top-8 bottom-0 w-px bg-white/[0.06] last:hidden" />

      {/* Icon dot */}
      <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.05] ring-1 ring-white/[0.08]">
        <Icon className="h-3.5 w-3.5 text-slate-400" />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1 pt-1">
        <p className="text-sm text-slate-300">{description}</p>
        <p className="mt-0.5 text-xs text-slate-600">{formatDate(event.created_at)}</p>
      </div>
    </div>
  );
}

export function IncidentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: incident, isLoading } = useIncident(id!);
  const { data: timeline } = useIncidentTimeline(id!);
  const statusMutation = useUpdateIncidentStatus(id!);
  const noteMutation = useAddIncidentNote(id!);
  const [note, setNote] = useState("");

  if (isLoading || !incident) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 rounded bg-slate-800 animate-pulse" />
        <div className="card space-y-4 p-6">
          <div className="h-6 w-2/3 rounded bg-slate-800 animate-pulse" />
          <div className="h-4 w-1/2 rounded bg-slate-800/60 animate-pulse" />
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 rounded-lg bg-slate-800/40 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const statusInfo = STATUS_META[incident.status as IncidentStatus];
  const StatusIcon = statusInfo.icon;

  function handleStatusChange(newStatus: IncidentStatus) {
    statusMutation.mutate({ status: newStatus });
  }

  function handleAddNote() {
    if (!note.trim()) return;
    noteMutation.mutate({ note: note.trim() }, { onSuccess: () => setNote("") });
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        to="/incidents"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        All Incidents
      </Link>

      {/* Header card */}
      <div className="card p-6 space-y-4">
        {/* Status strip */}
        <div
          className={clsx(
            "h-1 -mt-6 -mx-6 rounded-t-xl",
            incident.status === "OPEN" && "bg-red-500",
            incident.status === "INVESTIGATING" && "bg-amber-500",
            incident.status === "RESOLVED" && "bg-emerald-500",
          )}
        />

        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span
                className={clsx(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
                  statusInfo.color,
                )}
              >
                <StatusIcon className="h-3 w-3" />
                {statusInfo.label}
              </span>
              <span
                className={clsx(
                  "rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
                  SEVERITY_COLORS[incident.severity as IncidentSeverity],
                )}
              >
                {incident.severity}
              </span>
              <span className="text-xs text-slate-600 capitalize">
                {incident.trigger_type} trigger
              </span>
            </div>
            <h1 className="text-lg font-semibold text-white leading-snug">
              {incident.title}
            </h1>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 shrink-0">
            {incident.status === "OPEN" && (
              <button
                onClick={() => handleStatusChange("INVESTIGATING")}
                disabled={statusMutation.isPending}
                className="btn-secondary flex items-center gap-1.5 text-sm"
              >
                <Search className="h-3.5 w-3.5" />
                Investigate
              </button>
            )}
            {incident.status !== "RESOLVED" && (
              <button
                onClick={() => handleStatusChange("RESOLVED")}
                disabled={statusMutation.isPending}
                className="btn-primary flex items-center gap-1.5 text-sm"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Resolve
              </button>
            )}
            {incident.status === "RESOLVED" && (
              <button
                onClick={() => handleStatusChange("OPEN")}
                disabled={statusMutation.isPending}
                className="btn-secondary flex items-center gap-1.5 text-sm"
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                Reopen
              </button>
            )}
          </div>
        </div>

        {/* Meta grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-lg bg-white/[0.03] px-4 py-3">
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Started</p>
            <p className="mt-1 text-sm font-medium text-slate-200">
              {formatDate(incident.started_at)}
            </p>
          </div>
          <div className="rounded-lg bg-white/[0.03] px-4 py-3">
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Duration</p>
            <p className="mt-1 text-sm font-medium text-slate-200">
              {duration(incident.started_at, incident.resolved_at)}
            </p>
          </div>
          <div className="rounded-lg bg-white/[0.03] px-4 py-3">
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Acknowledged</p>
            <p className="mt-1 text-sm font-medium text-slate-200">
              {incident.acknowledged_at ? formatDate(incident.acknowledged_at) : "—"}
            </p>
          </div>
          <div className="rounded-lg bg-white/[0.03] px-4 py-3">
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Endpoint</p>
            <Link
              to={`/endpoints/${incident.endpoint_id}`}
              className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
            >
              View <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Two-column: Notes + Timeline */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Notes */}
        <div className="lg:col-span-3 space-y-4">
          <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Notes
          </h2>

          {/* Existing notes */}
          {incident.notes && (
            <div className="card p-4">
              <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap text-sm text-slate-300 leading-relaxed">
                {incident.notes}
              </div>
            </div>
          )}

          {/* Add note */}
          {incident.status !== "RESOLVED" && (
            <div className="card p-4 space-y-3">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note..."
                rows={3}
                className="input w-full resize-none text-sm"
              />
              <div className="flex justify-end">
                <button
                  onClick={handleAddNote}
                  disabled={!note.trim() || noteMutation.isPending}
                  className="btn-primary flex items-center gap-1.5 text-sm disabled:opacity-40"
                >
                  <Send className="h-3.5 w-3.5" />
                  Add Note
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Timeline
          </h2>
          <div className="card p-5">
            {timeline && timeline.length > 0 ? (
              timeline.map((evt) => <TimelineEvent key={evt.id} event={evt} />)
            ) : (
              <div className="flex flex-col items-center py-8 text-slate-600">
                <User className="h-6 w-6 mb-2" />
                <p className="text-xs">No events yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
