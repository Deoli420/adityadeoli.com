import { BookOpen, Loader2 } from "lucide-react";
import { useGenerateNarrative } from "@/hooks/useIncidents.ts";

interface NarrativeCardProps {
  incidentId: string;
  narrative: string | null | undefined;
}

export function NarrativeCard({ incidentId, narrative }: NarrativeCardProps) {
  const mutation = useGenerateNarrative(incidentId);

  if (narrative) {
    return (
      <div className="bg-surface-secondary border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="h-4 w-4 text-accent" />
          <span className="text-sm font-medium text-text-primary">Incident Narrative</span>
        </div>
        <p className="text-sm text-text-secondary leading-relaxed">{narrative}</p>
      </div>
    );
  }

  return (
    <div className="bg-surface-secondary border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <BookOpen className="h-4 w-4 text-accent" />
        <span className="text-sm font-medium text-text-primary">Incident Narrative</span>
      </div>
      <p className="text-xs text-text-tertiary">No narrative available yet</p>
      <button
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
        className="mt-2 text-xs text-accent hover:underline font-medium flex items-center gap-1.5"
      >
        {mutation.isPending ? (
          <>
            <Loader2 className="h-3 w-3 animate-spin" />
            Generating...
          </>
        ) : (
          "Generate Story"
        )}
      </button>
    </div>
  );
}
