import { Lightbulb } from "lucide-react";
import { Link } from "react-router-dom";

import { useSuggestedFixes } from "@/hooks/useAiMemory.ts";
import type { SuggestedFix } from "@/services/endpointsService.ts";

function ConfidenceBadge({ confidence }: { confidence: number }) {
  if (confidence >= 0.8) {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
        High confidence
      </span>
    );
  }
  if (confidence >= 0.6) {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-400">
        Medium confidence
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-gray-500/15 px-2 py-0.5 text-[11px] font-medium text-gray-400">
      Low confidence
    </span>
  );
}

function SuggestionRow({ suggestion }: { suggestion: SuggestedFix }) {
  return (
    <div className="rounded-lg bg-surface-secondary p-3 space-y-2">
      <p className="text-sm text-text-primary">{suggestion.learning}</p>

      {suggestion.resolution_action && (
        <div className="bg-accent/5 border-l-2 border-accent p-2">
          <p className="text-xs text-text-secondary">{suggestion.resolution_action}</p>
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <ConfidenceBadge confidence={suggestion.confidence} />

        {suggestion.source === "cross_endpoint" && suggestion.endpoint_name && (
          <span className="text-[11px] text-text-tertiary">
            (from {suggestion.endpoint_name})
          </span>
        )}

        <Link
          to={`/incidents/${suggestion.incident_id}`}
          className="text-accent hover:underline text-[11px] ml-auto"
        >
          From incident &rarr;
        </Link>
      </div>
    </div>
  );
}

export function SuggestedFixesCard({ incidentId }: { incidentId: string }) {
  const { data, isLoading, isError } = useSuggestedFixes(incidentId);

  if (isLoading || isError || !data) return null;

  const { suggestions, memory_count } = data;

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-accent" />
          AI Suggested Fixes
        </h2>
        <span className="text-[11px] text-text-tertiary">
          {memory_count} learnings in memory
        </span>
      </div>

      {suggestions.length === 0 ? (
        <p className="text-xs text-text-tertiary py-4 text-center">
          No AI learnings available yet. Learnings are extracted when incidents are resolved.
        </p>
      ) : (
        <div className="space-y-3">
          {suggestions.map((s) => (
            <SuggestionRow key={s.id} suggestion={s} />
          ))}
        </div>
      )}
    </div>
  );
}
