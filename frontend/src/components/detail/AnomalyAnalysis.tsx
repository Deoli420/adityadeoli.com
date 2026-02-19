import { useState } from "react";
import {
  Brain,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Info,
  Clock,
  Shield,
  Zap,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Target,
  Activity,
} from "lucide-react";
import type { Anomaly, AnomalyReadout } from "@/types/index.ts";
import { Skeleton } from "@/components/common/Skeleton.tsx";
import { timeAgo } from "@/utils/formatters.ts";
import clsx from "clsx";

/* ── Types ─────────────────────────────────────────────────────────────── */

interface AnomalyAnalysisProps {
  /** Persisted anomaly history (newest-first) */
  anomalies: Anomaly[] | undefined;
  /** Transient readout from the most recent run trigger */
  lastReadout: AnomalyReadout | null | undefined;
  /** Total runs for this endpoint */
  totalRuns: number;
  /** Is anomaly data loading? */
  isLoading: boolean;
  /** Is a monitor run currently in progress? */
  isRunning: boolean;
  /** Callback to trigger a new monitor run */
  onRunAnalysis: () => void;
}

/* ── Severity helpers ──────────────────────────────────────────────────── */

/** Severity scale is 0–100 (matching backend risk engine) */
function severityLabel(score: number): string {
  if (score >= 80) return "Critical";
  if (score >= 60) return "High";
  if (score >= 40) return "Medium";
  if (score >= 16) return "Low";
  return "Normal";
}

function severityColor(score: number): string {
  if (score >= 80) return "text-risk-critical";
  if (score >= 60) return "text-risk-high";
  if (score >= 40) return "text-risk-medium";
  if (score >= 16) return "text-risk-low";
  return "text-text-tertiary";
}

function severityBgColor(score: number): string {
  if (score >= 80) return "bg-risk-critical";
  if (score >= 60) return "bg-risk-high";
  if (score >= 40) return "bg-risk-medium";
  if (score >= 16) return "bg-risk-low";
  return "bg-risk-low";
}

function confidenceLabel(confidence: number): string {
  if (confidence >= 0.9) return "Very High";
  if (confidence >= 0.7) return "High";
  if (confidence >= 0.4) return "Moderate";
  return "Low";
}

function confidenceColor(confidence: number): string {
  if (confidence >= 0.7) return "text-risk-low";
  if (confidence >= 0.4) return "text-risk-medium";
  return "text-risk-high";
}

/* ── Component ─────────────────────────────────────────────────────────── */

/**
 * AI Anomaly Analysis — GPT-powered reasoning about detected anomalies.
 *
 * 7 distinct states:
 *   1. Loading          — Skeleton placeholder
 *   2. Running          — Live progress indicator during monitor run
 *   3. Empty / No runs  — First-time user, explain what this does
 *   4. Insufficient data — Need more runs for meaningful analysis
 *   5. No anomaly       — All healthy with confidence score
 *   6. Anomaly detected — Full breakdown with severity, reasoning, cause
 *   7. Stale data       — Last analysis was long ago, prompt refresh
 *
 * Design: Purple accent for AI-powered features.
 * Severity scale: 0–100 (matching backend exactly).
 */
export function AnomalyAnalysis({
  anomalies,
  lastReadout,
  totalRuns,
  isLoading,
  isRunning,
  onRunAnalysis,
}: AnomalyAnalysisProps) {
  const [expanded, setExpanded] = useState(false);

  // ── State 1: Loading ─────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="card p-5">
        <Skeleton className="mb-3 h-4 w-40" />
        <Skeleton className="h-44 w-full rounded-lg" />
      </div>
    );
  }

  // ── State 2: Running (monitor in progress) ──────────────────────
  if (isRunning) {
    return (
      <div className="card p-5">
        <CardHeader />
        <div className="flex h-44 items-center justify-center">
          <div className="text-center">
            <div className="relative mx-auto mb-3 h-10 w-10">
              <Brain className="h-10 w-10 text-ai-purple animate-pulse" />
              <Activity className="absolute -right-1 -top-1 h-4 w-4 text-ai-purple animate-ping" />
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-ai-purple">
                Analysing endpoint...
              </p>
              <ProgressSteps />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── State 3: Empty / No runs yet ────────────────────────────────
  if (totalRuns === 0) {
    return (
      <div className="card p-5">
        <CardHeader />
        <div className="flex h-44 items-center justify-center">
          <div className="text-center max-w-xs">
            <Brain className="mx-auto h-8 w-8 text-text-tertiary/40 mb-2" />
            <p className="text-xs font-medium text-text-secondary mb-1">
              AI Anomaly Detection
            </p>
            <p className="text-[11px] text-text-tertiary leading-relaxed mb-3">
              Analyses API responses using GPT to detect latency spikes,
              status anomalies, and schema drift. Run the monitor to start.
            </p>
            <button
              onClick={onRunAnalysis}
              className="inline-flex items-center gap-1.5 rounded-lg bg-ai-purple/10 border border-ai-purple/20 px-3 py-1.5 text-xs font-medium text-ai-purple hover:bg-ai-purple/20 transition-colors"
            >
              <Zap className="h-3 w-3" />
              Run Analysis
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── State 4: Insufficient data (< 3 runs, no anomalies yet) ────
  if (totalRuns < 3 && (!anomalies || anomalies.length === 0)) {
    return (
      <div className="card p-5">
        <CardHeader />
        <div className="rounded-lg border border-border bg-surface-tertiary/30 p-4">
          <div className="flex items-start gap-3">
            <Activity className="mt-0.5 h-4 w-4 shrink-0 text-risk-medium" />
            <div className="flex-1">
              <p className="text-xs font-medium text-text-secondary mb-1">
                Building baseline...
              </p>
              <p className="text-[11px] text-text-tertiary leading-relaxed mb-3">
                SentinelAI needs at least 3 runs to establish a performance
                baseline for meaningful anomaly detection.
              </p>
              {/* Progress bar */}
              <div className="flex items-center gap-2">
                <div className="h-1.5 flex-1 rounded-full bg-surface-tertiary overflow-hidden">
                  <div
                    className="h-full rounded-full bg-ai-purple transition-all duration-500"
                    style={{ width: `${Math.min((totalRuns / 3) * 100, 100)}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono text-text-tertiary">
                  {totalRuns}/3 runs
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Derive latest anomaly data ──────────────────────────────────
  const latest = anomalies?.[0];
  const hasAnomaly = latest?.anomaly_detected ?? false;
  const severity = latest?.severity_score ?? 0;
  const reasoning = latest?.reasoning ?? lastReadout?.reasoning ?? "";
  const probableCause = latest?.probable_cause ?? lastReadout?.probable_cause ?? "";
  const confidence = lastReadout?.confidence ?? latest?.confidence ?? 0.0;
  const recommendation = lastReadout?.recommendation ?? latest?.recommendation ?? "";
  const usedFallback = lastReadout?.used_fallback ?? latest?.used_fallback ?? false;
  const aiCalled = lastReadout?.ai_called ?? latest?.ai_called ?? false;
  const analysisTime = latest?.created_at;

  // Check staleness (> 2 hours)
  const isStale = analysisTime
    ? Date.now() - new Date(analysisTime).getTime() > 2 * 60 * 60 * 1000
    : false;

  // ── State 5: No anomaly detected (healthy) ─────────────────────
  // Show healthy state when: (a) latest anomaly is not detected, or
  // (b) no anomalies ever recorded but we have enough runs (meaning analysis ran, all clear)
  if (!hasAnomaly && totalRuns >= 3) {
    return (
      <div className="card p-5">
        <CardHeader
          badge={<HealthyBadge />}
          timestamp={analysisTime}
          isStale={isStale}
          onRefresh={onRunAnalysis}
        />

        <div className="rounded-lg bg-success-bg/50 px-4 py-5 text-center">
          <CheckCircle2 className="mx-auto h-7 w-7 text-success mb-2" />
          <p className="text-xs font-medium text-risk-low">
            All systems normal
          </p>
          <p className="mt-1 text-[11px] text-text-tertiary leading-relaxed">
            No anomalies detected in the latest analysis
          </p>

          {/* What was checked */}
          <div className="mt-3 flex items-center justify-center gap-3">
            <CheckItem label="Status codes" />
            <CheckItem label="Latency" />
            <CheckItem label="Schema" />
          </div>

          {/* Confidence — only show when we have a real analysis */}
          {confidence > 0 && (
            <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-surface-tertiary/50 px-2.5 py-1">
              <Shield className="h-3 w-3 text-text-tertiary" />
              <span className="text-[10px] text-text-tertiary">
                Confidence:{" "}
                <span className={confidenceColor(confidence)}>
                  {(confidence * 100).toFixed(0)}%
                </span>
              </span>
            </div>
          )}
        </div>

        {/* History sparkline */}
        {anomalies && anomalies.length > 1 && <HistorySparkline anomalies={anomalies} />}
      </div>
    );
  }

  // ── State 6: Anomaly detected ───────────────────────────────────
  if (hasAnomaly) {
    return (
      <div className="card p-5">
        <CardHeader
          badge={<AnomalyBadge />}
          timestamp={analysisTime}
          isStale={isStale}
          onRefresh={onRunAnalysis}
        />

        <div className="space-y-3">
          {/* Severity score — 0 to 100 */}
          <div className="rounded-lg border border-border bg-surface-tertiary/30 p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium text-text-secondary uppercase tracking-wider">
                  Severity
                </span>
                <span
                  className={clsx(
                    "text-[10px] font-medium px-1.5 py-0.5 rounded",
                    severity >= 80
                      ? "bg-risk-critical-bg text-risk-critical"
                      : severity >= 60
                      ? "bg-risk-high-bg text-risk-high"
                      : severity >= 40
                      ? "bg-risk-medium-bg text-risk-medium"
                      : severity >= 16
                      ? "bg-risk-low-bg text-risk-low"
                      : "bg-surface-tertiary text-text-tertiary",
                  )}
                >
                  {severityLabel(severity)}
                </span>
              </div>
              <span className={clsx("text-lg font-bold tabular-nums", severityColor(severity))}>
                {severity.toFixed(0)}
                <span className="text-xs font-normal text-text-tertiary">/100</span>
              </span>
            </div>
            <div
              className="h-1.5 w-full rounded-full bg-surface-tertiary overflow-hidden"
              role="progressbar"
              aria-valuenow={severity}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Severity: ${severity.toFixed(0)} out of 100`}
            >
              <div
                className={clsx(
                  "h-full rounded-full transition-all duration-700 ease-out",
                  severityBgColor(severity),
                )}
                style={{ width: `${Math.min(severity, 100)}%` }}
              />
            </div>
            {/* Confidence + source indicator */}
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-1">
                <Shield className="h-3 w-3 text-text-tertiary" />
                <span className="text-[10px] text-text-tertiary">
                  Confidence:{" "}
                  <span className={confidenceColor(confidence)}>
                    {confidenceLabel(confidence)}
                  </span>{" "}
                  ({(confidence * 100).toFixed(0)}%)
                </span>
              </div>
              {usedFallback && (
                <span className="text-[10px] text-text-tertiary flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  Rule-based
                </span>
              )}
              {aiCalled && !usedFallback && (
                <span className="text-[10px] text-ai-purple flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  AI-powered
                </span>
              )}
            </div>
          </div>

          {/* AI Reasoning */}
          {reasoning && (
            <div className="rounded-lg border border-ai-purple-border bg-ai-purple-bg/40 p-3">
              <div className="flex items-start gap-2">
                <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ai-purple" />
                <div>
                  <p className="text-[11px] font-medium text-ai-purple mb-1">AI Reasoning</p>
                  <p className="text-xs leading-relaxed text-text-secondary">{reasoning}</p>
                </div>
              </div>
            </div>
          )}

          {/* Probable Cause */}
          {probableCause && (
            <div className="rounded-lg border border-border bg-surface-tertiary/30 p-3">
              <div className="flex items-start gap-2">
                <Target className="mt-0.5 h-3.5 w-3.5 shrink-0 text-text-tertiary" />
                <div>
                  <p className="text-[11px] font-medium text-text-secondary mb-1">Probable Cause</p>
                  <p className="text-xs leading-relaxed text-text-secondary">{probableCause}</p>
                </div>
              </div>
            </div>
          )}

          {/* Recommendation */}
          {recommendation && (
            <div className="rounded-lg border border-risk-low/20 bg-risk-low-bg/30 p-3">
              <div className="flex items-start gap-2">
                <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-risk-low" />
                <div>
                  <p className="text-[11px] font-medium text-risk-low mb-1">Recommended Action</p>
                  <p className="text-xs leading-relaxed text-text-secondary">{recommendation}</p>
                </div>
              </div>
            </div>
          )}

          {/* Expandable: history */}
          {anomalies && anomalies.length > 1 && (
            <div className="border-t border-border-subtle pt-2">
              <button
                onClick={() => setExpanded(!expanded)}
                aria-expanded={expanded}
                aria-label="Toggle anomaly history"
                className="flex items-center gap-1 text-[11px] font-medium text-text-tertiary hover:text-text-secondary transition-colors"
              >
                {expanded ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
                {expanded ? "Hide" : "Show"} history ({anomalies.length} analyses)
              </button>
              {expanded && <HistorySparkline anomalies={anomalies} />}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Fallback: edge case (anomalies exist but none detected) ─────
  return (
    <div className="card p-5">
      <CardHeader />
      <div className="flex h-40 items-center justify-center">
        <div className="text-center">
          <Brain className="mx-auto h-8 w-8 text-text-tertiary/40 mb-2" />
          <p className="text-xs text-text-tertiary mb-2">
            Run the monitor to trigger AI analysis
          </p>
          <button
            onClick={onRunAnalysis}
            className="inline-flex items-center gap-1.5 rounded-lg bg-ai-purple/10 border border-ai-purple/20 px-3 py-1.5 text-xs font-medium text-ai-purple hover:bg-ai-purple/20 transition-colors"
          >
            <Zap className="h-3 w-3" />
            Run Analysis
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────────────────────── */

function CardHeader({
  badge,
  timestamp,
  isStale,
  onRefresh,
}: {
  badge?: React.ReactNode;
  timestamp?: string;
  isStale?: boolean;
  onRefresh?: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <Brain className="h-4 w-4 text-ai-purple" />
        <h3 className="text-sm font-medium text-text-primary">AI Anomaly Analysis</h3>
      </div>
      <div className="flex items-center gap-2">
        {timestamp && (
          <span
            className={clsx(
              "text-[10px] flex items-center gap-1",
              isStale ? "text-risk-medium" : "text-text-tertiary",
            )}
          >
            <Clock className="h-3 w-3" />
            {timeAgo(timestamp)}
            {isStale && onRefresh && (
              <button
                onClick={onRefresh}
                className="ml-1 text-ai-purple hover:text-ai-purple/80 transition-colors"
                title="Refresh analysis"
              >
                <RefreshCw className="h-3 w-3" />
              </button>
            )}
          </span>
        )}
        {badge}
      </div>
    </div>
  );
}

function HealthyBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-risk-low-bg px-2.5 py-0.5 text-xs font-medium text-risk-low">
      <CheckCircle2 className="h-3 w-3" />
      Normal
    </span>
  );
}

function AnomalyBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-risk-critical-bg px-2.5 py-0.5 text-xs font-medium text-risk-critical">
      <AlertTriangle className="h-3 w-3" />
      Anomaly Detected
    </span>
  );
}

function CheckItem({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-text-tertiary">
      <CheckCircle2 className="h-2.5 w-2.5 text-success" />
      {label}
    </span>
  );
}

function ProgressSteps() {
  return (
    <div className="flex items-center justify-center gap-1.5 text-[10px] text-text-tertiary">
      <span className="flex items-center gap-1">
        <span className="h-1.5 w-1.5 rounded-full bg-ai-purple animate-pulse" />
        Probing endpoint
      </span>
      <span className="text-border">&rarr;</span>
      <span className="opacity-50">Analysing patterns</span>
      <span className="text-border">&rarr;</span>
      <span className="opacity-30">Scoring risk</span>
    </div>
  );
}

function HistorySparkline({ anomalies }: { anomalies: Anomaly[] }) {
  return (
    <div className="pt-2">
      <p className="text-[11px] font-medium text-text-tertiary mb-2 flex items-center gap-1">
        <Info className="h-3 w-3" />
        Recent History
      </p>
      <div className="flex gap-1">
        {anomalies.slice(0, 10).map((a) => (
          <div
            key={a.id}
            className={clsx(
              "h-5 flex-1 rounded-sm transition-all",
              a.anomaly_detected
                ? a.severity_score >= 80
                  ? "bg-risk-critical/80"
                  : a.severity_score >= 60
                  ? "bg-risk-high/60"
                  : a.severity_score >= 40
                  ? "bg-risk-medium/50"
                  : "bg-risk-low/40"
                : "bg-risk-low/20",
            )}
            title={`${timeAgo(a.created_at)}: ${
              a.anomaly_detected
                ? `Anomaly (severity ${(a.severity_score ?? 0).toFixed(0)}/100)`
                : "Normal"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
