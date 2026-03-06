import {
  Brain,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Bug,
  Target,
  ListOrdered,
  TrendingUp,
} from "lucide-react";
import clsx from "clsx";
import {
  useLatestDebugSuggestion,
  useTriggerDebug,
} from "@/hooks/useDebugAssistant.ts";

/**
 * AI Debug Assistant panel — "Ask AI to Debug" button with
 * structured response display (diagnosis, steps, root cause).
 *
 * Appears on EndpointDetailPage below AnomalyAnalysis.
 */
export function DebugAssistant({ endpointId }: { endpointId: string }) {
  const { data: suggestion, isLoading } = useLatestDebugSuggestion(endpointId);
  const { mutate: triggerDebug, isPending } = useTriggerDebug(endpointId);

  return (
    <div className="card space-y-4 p-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/10">
            <Bug className="h-4 w-4 text-purple-400" />
          </div>
          <h3 className="text-sm font-medium text-text-primary">
            AI Debug Assistant
          </h3>
        </div>

        <button
          onClick={() => triggerDebug()}
          disabled={isPending}
          className={clsx(
            "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
            isPending
              ? "cursor-not-allowed bg-purple-500/20 text-purple-300"
              : "bg-purple-500/10 text-purple-400 hover:bg-purple-500/20",
          )}
        >
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Brain className="h-3.5 w-3.5" />
          )}
          {isPending ? "Analyzing…" : "Ask AI to Debug"}
        </button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-text-tertiary" />
        </div>
      )}

      {/* No data */}
      {!isLoading && !suggestion && (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <Brain className="mb-2 h-8 w-8 text-text-tertiary/40" />
          <p className="text-xs text-text-tertiary">
            Click "Ask AI to Debug" to generate debugging suggestions
            when anomalies are detected.
          </p>
        </div>
      )}

      {/* Results */}
      {!isLoading && suggestion && (
        <div className="space-y-4">
          {/* Diagnosis */}
          <Section
            icon={Target}
            title="Diagnosis"
            color="text-blue-400 bg-blue-500/10"
          >
            <p className="text-sm text-text-secondary">
              {suggestion.diagnosis}
            </p>
          </Section>

          {/* Steps */}
          <Section
            icon={ListOrdered}
            title="Debugging Steps"
            color="text-purple-400 bg-purple-500/10"
          >
            <ol className="space-y-2 pl-1">
              {suggestion.steps.map((step, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-xs text-text-secondary"
                >
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-purple-500/15 text-[10px] font-bold text-purple-400">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </Section>

          {/* Root Cause */}
          <Section
            icon={AlertCircle}
            title="Likely Root Cause"
            color="text-amber-400 bg-amber-500/10"
          >
            <p className="text-sm text-text-secondary">
              {suggestion.likely_root_cause}
            </p>
          </Section>

          {/* Severity */}
          <div className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-text-tertiary" />
            <span className="text-xs text-text-tertiary">Severity:</span>
            <span className="text-xs font-medium text-text-primary">
              {suggestion.severity_assessment}
            </span>
          </div>

          {/* Related Patterns */}
          {suggestion.related_patterns.length > 0 && (
            <Section
              icon={TrendingUp}
              title="Related Patterns"
              color="text-cyan-400 bg-cyan-500/10"
            >
              <ul className="space-y-1">
                {suggestion.related_patterns.map((pattern, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-xs text-text-secondary"
                  >
                    <ChevronRight className="mt-0.5 h-3 w-3 shrink-0 text-text-tertiary" />
                    <span>{pattern}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </div>
      )}
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  color,
  children,
}: {
  icon: React.ElementType;
  title: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5">
        <div
          className={clsx(
            "flex h-5 w-5 items-center justify-center rounded",
            color,
          )}
        >
          <Icon className="h-3 w-3" />
        </div>
        <h4 className="text-xs font-medium uppercase tracking-wider text-text-tertiary">
          {title}
        </h4>
      </div>
      {children}
    </div>
  );
}
