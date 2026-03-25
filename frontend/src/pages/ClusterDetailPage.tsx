import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Zap, ChevronRight, Clock, Pencil } from "lucide-react";
import clsx from "clsx";
import { useCluster, useUpdateCluster } from "@/hooks/useClusters.ts";
import { useIsAdmin } from "@/hooks/useAuth.ts";
import { SkeletonCard, ErrorState } from "@/components/common/index.ts";
import { formatDate } from "@/utils/formatters.ts";

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

export function ClusterDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: cluster, isLoading, isError, refetch } = useCluster(id!);
  const updateMutation = useUpdateCluster(id!);
  const isAdmin = useIsAdmin();
  const [editing, setEditing] = useState(false);
  const [summary, setSummary] = useState("");

  if (isLoading) {
    return (
      <div className="space-y-6">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (isError || !cluster) {
    return <ErrorState message="Failed to load cluster" onRetry={refetch} />;
  }

  function handleSave() {
    updateMutation.mutate(
      { root_cause_summary: summary },
      {
        onSuccess: () => setEditing(false),
      },
    );
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        to="/incidents"
        className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Incidents
      </Link>

      {/* Header */}
      <div className="card p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Zap className="h-5 w-5 shrink-0 text-amber-500" />
            <h1 className="text-lg font-semibold text-text-primary truncate">{cluster.title}</h1>
            <span
              className={clsx(
                "shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
                STATUS_PILL[cluster.status] ?? "bg-surface-tertiary text-text-secondary",
              )}
            >
              {cluster.status}
            </span>
          </div>
        </div>

        {/* Timeline */}
        <div className="flex items-center gap-4 text-xs text-text-secondary">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Detected: {formatDate(cluster.detected_at)}
          </span>
          {cluster.resolved_at && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Resolved: {formatDate(cluster.resolved_at)}
            </span>
          )}
        </div>

        {/* Shared signals */}
        {cluster.shared_signals.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
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
      </div>

      {/* Root cause summary */}
      {(cluster.root_cause_summary || isAdmin) && (
        <div className="card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text-primary">Root Cause Summary</h2>
            {isAdmin && !editing && (
              <button
                onClick={() => {
                  setSummary(cluster.root_cause_summary ?? "");
                  setEditing(true);
                }}
                className="flex items-center gap-1 text-xs text-accent hover:underline"
              >
                <Pencil className="h-3 w-3" />
                Edit
              </button>
            )}
          </div>
          {editing ? (
            <div className="space-y-2">
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={4}
                className="input w-full resize-none text-sm"
                placeholder="Describe the root cause..."
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setEditing(false)}
                  className="btn-secondary text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={updateMutation.isPending}
                  className="btn-primary text-sm"
                >
                  Save
                </button>
              </div>
            </div>
          ) : cluster.root_cause_summary ? (
            <p className="text-sm text-text-secondary whitespace-pre-wrap leading-relaxed">
              {cluster.root_cause_summary}
            </p>
          ) : (
            <p className="text-xs text-text-tertiary italic">No root cause summary yet.</p>
          )}
        </div>
      )}

      {/* Member incidents */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-text-primary">
          Member Incidents ({cluster.incidents.length})
        </h2>
        <div className="space-y-2">
          {cluster.incidents.map((inc) => (
            <Link
              key={inc.id}
              to={`/incidents/${inc.id}`}
              className="card card-hover p-3 flex items-center justify-between"
            >
              <div>
                <p className="text-sm font-medium text-text-primary">{inc.title}</p>
                <p className="text-xs text-text-tertiary">
                  {inc.endpoint_name} · {inc.severity} · {inc.status}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-text-tertiary" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
