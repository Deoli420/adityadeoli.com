import { CheckCircle2, AlertTriangle } from "lucide-react";
import clsx from "clsx";
import { formatDuration } from "@/utils/formatters.ts";
import type { IncidentListItem, IncidentSeverity } from "@/types/index.ts";

const SEVERITY_ORDER: Record<IncidentSeverity, number> = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

const SEVERITY_BORDER: Record<IncidentSeverity, string> = {
  CRITICAL: "border-risk-critical bg-red-500/5",
  HIGH: "border-risk-high bg-orange-500/5",
  MEDIUM: "border-risk-medium bg-yellow-500/5",
  LOW: "border-risk-low bg-emerald-500/5",
};

export function IncidentSummaryBanner({ incidents }: { incidents: IncidentListItem[] }) {
  const openIncidents = incidents.filter(
    (i) => i.status === "OPEN" || i.status === "INVESTIGATING",
  );
  const openCount = openIncidents.length;

  const criticalCount = openIncidents.filter((i) => i.severity === "CRITICAL").length;
  const highCount = openIncidents.filter((i) => i.severity === "HIGH").length;
  const mediumCount = openIncidents.filter((i) => i.severity === "MEDIUM").length;
  const lowCount = openIncidents.filter((i) => i.severity === "LOW").length;

  // Average resolution time from resolved incidents
  const resolvedWithTime = incidents.filter(
    (i) => i.status === "RESOLVED" && i.resolved_at,
  );
  const avgResolutionMs =
    resolvedWithTime.length > 0
      ? resolvedWithTime.reduce(
          (sum, i) =>
            sum + (new Date(i.resolved_at!).getTime() - new Date(i.started_at).getTime()),
          0,
        ) / resolvedWithTime.length
      : 0;

  // Worst severity among open incidents
  const worstSeverity: IncidentSeverity =
    openIncidents.length > 0
      ? openIncidents.reduce<IncidentSeverity>(
          (worst, i) =>
            SEVERITY_ORDER[i.severity] > SEVERITY_ORDER[worst] ? i.severity : worst,
          "LOW",
        )
      : "LOW";

  if (openCount === 0) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-risk-low-border bg-risk-low-bg p-4">
        <CheckCircle2 className="h-5 w-5 text-emerald-400" />
        <span className="text-sm font-medium text-text-primary">
          All clear &mdash; no open incidents
        </span>
      </div>
    );
  }

  return (
    <div
      className={clsx(
        "flex items-center gap-3 rounded-xl border-l-4 p-4",
        SEVERITY_BORDER[worstSeverity],
      )}
    >
      <AlertTriangle className="h-5 w-5 shrink-0 text-text-primary" />
      <span className="text-sm font-medium text-text-primary">
        {openCount} open
        {criticalCount > 0 && <> &middot; {criticalCount} critical</>}
        {highCount > 0 && <> &middot; {highCount} high</>}
        {mediumCount > 0 && <> &middot; {mediumCount} medium</>}
        {lowCount > 0 && <> &middot; {lowCount} low</>}
        {avgResolutionMs > 0 && (
          <> &middot; Avg resolution: {formatDuration(avgResolutionMs)}</>
        )}
      </span>
    </div>
  );
}
