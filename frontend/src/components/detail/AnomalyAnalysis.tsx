import {
  Brain,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Info,
  ArrowUpRight,
} from "lucide-react";
import type { Anomaly } from "@/types/index.ts";
import { Skeleton } from "@/components/common/Skeleton.tsx";
import clsx from "clsx";

interface AnomalyAnalysisProps {
  anomalies: Anomaly[] | undefined;
  isLoading: boolean;
}

/**
 * AI Anomaly Analysis — GPT-powered reasoning about detected anomalies.
 *
 * Shows the most recent anomaly analysis with:
 *   - Severity score gauge
 *   - AI reasoning (natural language explanation)
 *   - Probable cause identification
 *
 * Design: Purple accent for AI-powered features (differentiates from
 * risk scoring which uses the risk colour palette).
 */
export function AnomalyAnalysis({ anomalies, isLoading }: AnomalyAnalysisProps) {
  if (isLoading) {
    return (
      <div className="card p-5">
        <Skeleton className="mb-3 h-4 w-40" />
        <Skeleton className="h-44 w-full rounded-lg" />
      </div>
    );
  }

  if (!anomalies || anomalies.length === 0) {
    return (
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="h-4 w-4 text-ai-purple" />
          <h3 className="text-sm font-medium text-text-primary">AI Anomaly Analysis</h3>
        </div>
        <div className="flex h-40 items-center justify-center">
          <div className="text-center">
            <Sparkles className="mx-auto h-8 w-8 text-text-tertiary/50 mb-2" />
            <p className="text-xs text-text-tertiary">
              No analysis yet. Run the monitor to trigger AI analysis.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const latest = anomalies[0];
  const hasAnomaly = latest.anomaly_detected;
  const severity = latest.severity_score;

  return (
    <div className="card p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Brain className={clsx(
            "h-4 w-4",
            hasAnomaly ? "text-drift-type" : "text-ai-purple",
          )} />
          <h3 className="text-sm font-medium text-text-primary">AI Anomaly Analysis</h3>
        </div>
        {hasAnomaly ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-risk-critical-bg px-2.5 py-0.5 text-xs font-medium text-risk-critical">
            <AlertTriangle className="h-3 w-3" />
            Anomaly Detected
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-risk-low-bg px-2.5 py-0.5 text-xs font-medium text-risk-low">
            <CheckCircle2 className="h-3 w-3" />
            Normal
          </span>
        )}
      </div>

      {!hasAnomaly ? (
        <div className="rounded-lg bg-success-bg/50 px-4 py-6 text-center">
          <CheckCircle2 className="mx-auto h-7 w-7 text-success mb-2" />
          <p className="text-xs font-medium text-risk-low">
            No anomalies detected
          </p>
          <p className="mt-1 text-[11px] text-text-tertiary">
            AI analysis found no unusual patterns in the response
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Severity score */}
          <div className="rounded-lg border border-border bg-surface-tertiary/30 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-medium text-text-secondary uppercase tracking-wider">
                Severity
              </span>
              <span className={clsx(
                "text-lg font-bold tabular-nums",
                severity >= 7 ? "text-risk-critical"
                  : severity >= 4 ? "text-risk-high"
                  : "text-risk-medium",
              )}>
                {severity}
                <span className="text-xs font-normal text-text-tertiary">/10</span>
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-surface-tertiary overflow-hidden">
              <div
                className={clsx(
                  "h-full rounded-full transition-all duration-700 ease-out",
                  severity >= 7 ? "bg-risk-critical"
                    : severity >= 4 ? "bg-risk-high"
                    : "bg-risk-medium",
                )}
                style={{ width: `${Math.min(severity * 10, 100)}%` }}
              />
            </div>
          </div>

          {/* AI Reasoning */}
          {latest.reasoning && (
            <div className="rounded-lg border border-ai-purple-border bg-ai-purple-bg/40 p-3">
              <div className="flex items-start gap-2">
                <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ai-purple" />
                <div>
                  <p className="text-[11px] font-medium text-ai-purple mb-1">
                    AI Reasoning
                  </p>
                  <p className="text-xs leading-relaxed text-text-secondary">
                    {latest.reasoning}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Probable Cause */}
          {latest.probable_cause && (
            <div className="rounded-lg border border-border bg-surface-tertiary/30 p-3">
              <div className="flex items-start gap-2">
                <ArrowUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-text-tertiary" />
                <div>
                  <p className="text-[11px] font-medium text-text-secondary mb-1">
                    Probable Cause
                  </p>
                  <p className="text-xs leading-relaxed text-text-secondary">
                    {latest.probable_cause}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Recent anomaly history (if multiple) */}
          {anomalies.length > 1 && (
            <div className="pt-2 border-t border-border-subtle">
              <p className="text-[11px] font-medium text-text-tertiary mb-2 flex items-center gap-1">
                <Info className="h-3 w-3" />
                Recent History
              </p>
              <div className="flex gap-1">
                {anomalies.slice(0, 10).map((a, i) => (
                  <div
                    key={a.id}
                    className={clsx(
                      "h-5 flex-1 rounded-sm transition-all",
                      a.anomaly_detected
                        ? a.severity_score >= 7
                          ? "bg-risk-critical/80"
                          : a.severity_score >= 4
                          ? "bg-risk-high/60"
                          : "bg-risk-medium/50"
                        : "bg-risk-low/30",
                    )}
                    title={`Run ${anomalies.length - i}: ${a.anomaly_detected ? `Anomaly (${a.severity_score}/10)` : "Normal"}`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
