import { useState } from "react";
import { Link } from "react-router-dom";
import { History, GitCompareArrows, Globe, ChevronDown, ChevronUp } from "lucide-react";

import { useIncidentSimilar } from "@/hooks/useIncidentSimilar.ts";
import { formatDuration } from "@/utils/formatters.ts";

const SIGNAL_LABELS: Record<string, string> = {
  status_mismatch: "Status",
  latency_spike: "Latency",
  schema_drift: "Schema",
  security_finding: "Security",
  contract_violation: "Contract",
  ai_anomaly: "AI",
};

function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max - 1) + "\u2026";
}

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function PatternMatchCard({ incidentId }: { incidentId: string }) {
  const { data, isLoading, isError } = useIncidentSimilar(incidentId);
  const [notesExpanded, setNotesExpanded] = useState(false);

  if (isLoading || isError || !data) return null;

  const hasExactMatch = data.exact_match && data.exact_match.occurrence_count > 1;
  const hasFuzzy = data.fuzzy_matches.length > 0;
  const hasCross = data.cross_endpoint_matches.length > 0;
  const hasFlags = data.signal_flags.length > 0;

  if (!data.fingerprint && !hasFuzzy && !hasCross && !hasFlags) return null;

  return (
    <div className="card p-5 space-y-4">
      {/* Section 1: Known Pattern */}
      {hasExactMatch && data.exact_match && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-text-tertiary" />
            <span className="text-sm font-medium text-text-primary">Known Pattern</span>
            <span className="bg-accent/10 text-accent text-[11px] px-2 py-0.5 rounded-full">
              Seen {data.exact_match.occurrence_count} times
            </span>
          </div>
          {data.exact_match.avg_resolution_ms != null && (
            <p className="text-xs text-text-secondary pl-6">
              Avg resolution: {formatDuration(data.exact_match.avg_resolution_ms)}
            </p>
          )}
          {data.exact_match.last_resolution_notes && (
            <div className="pl-6">
              <button
                onClick={() => setNotesExpanded(!notesExpanded)}
                className="flex items-center gap-1 text-xs text-text-tertiary hover:text-text-secondary transition-colors"
              >
                Last resolution
                {notesExpanded ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </button>
              {notesExpanded && (
                <p className="mt-1 text-xs text-text-tertiary leading-relaxed">
                  {truncate(data.exact_match.last_resolution_notes, 200)}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Section 2: Similar Incidents */}
      {hasFuzzy && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <GitCompareArrows className="h-4 w-4 text-text-tertiary" />
            <span className="text-sm font-medium text-text-primary">Similar Incidents</span>
          </div>
          <div className="space-y-1 pl-6">
            {data.fuzzy_matches.slice(0, 5).map((match) => (
              <Link
                key={match.incident_id}
                to={`/incidents/${match.incident_id}`}
                className="flex items-center gap-2 group py-0.5"
              >
                <span className="text-xs text-text-secondary group-hover:text-accent transition-colors truncate flex-1 min-w-0">
                  {truncate(match.title, 60)}
                </span>
                <span className="text-[10px] text-accent/80 shrink-0">
                  {Math.round(match.similarity * 100)}% match
                </span>
                {match.resolved_at && (
                  <span className="text-[10px] text-text-tertiary shrink-0">
                    {formatShortDate(match.resolved_at)}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Section 3: Cross-Endpoint */}
      {hasCross && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-text-tertiary" />
            <span className="text-sm font-medium text-text-primary">Also seen on other endpoints</span>
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 pl-6">
            {data.cross_endpoint_matches.map((ep) => (
              <span key={ep.endpoint_name} className="text-xs text-text-secondary">
                {ep.endpoint_name} ({ep.occurrence_count}x)
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Signal Flags */}
      {hasFlags && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {data.signal_flags.map((flag) => (
            <span
              key={flag}
              className="bg-surface-tertiary text-text-secondary text-[10px] px-1.5 py-0.5 rounded"
            >
              {SIGNAL_LABELS[flag] ?? flag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
