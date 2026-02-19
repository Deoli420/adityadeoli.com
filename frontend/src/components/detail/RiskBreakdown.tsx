import type { RiskScore } from "@/types/index.ts";
import { RiskBadge } from "@/components/common/RiskBadge.tsx";
import { Skeleton } from "@/components/common/Skeleton.tsx";
import { scoreToLevel } from "@/utils/riskUtils.ts";
import { ShieldCheck } from "lucide-react";
import clsx from "clsx";

interface RiskBreakdownProps {
  risk: RiskScore | null | undefined;
  isLoading: boolean;
}

/**
 * Risk breakdown card showing the overall score + weighted component bars.
 *
 * Features a large score readout, a color-coded fill bar, and a breakdown
 * of the five scoring components with their weights.
 */
export function RiskBreakdown({ risk, isLoading }: RiskBreakdownProps) {
  if (isLoading) {
    return (
      <div className="card p-5">
        <Skeleton className="mb-3 h-4 w-32" />
        <Skeleton className="h-40 w-full rounded-lg" />
      </div>
    );
  }

  if (!risk) {
    return (
      <div className="card p-5">
        <h3 className="text-sm font-medium text-text-primary">Risk Breakdown</h3>
        <div className="mt-4 flex h-40 flex-col items-center justify-center text-center">
          <ShieldCheck className="h-8 w-8 text-text-tertiary/50 mb-2" />
          <p className="text-xs text-text-tertiary">
            No risk score yet. Run the monitor to generate one.
          </p>
        </div>
      </div>
    );
  }

  const level = scoreToLevel(risk.calculated_score);

  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-medium text-text-primary">Risk Breakdown</h3>
        <RiskBadge level={level} score={risk.calculated_score} size="md" />
      </div>

      {/* Score gauge */}
      <div className="mt-2">
        <div className="flex items-end justify-between mb-2">
          <span className="text-3xl font-bold tabular-nums text-text-primary">
            {risk.calculated_score}
          </span>
          <span className="text-xs text-text-tertiary">/100</span>
        </div>

        {/* Visual bar */}
        <div className="h-2.5 w-full rounded-full bg-surface-tertiary overflow-hidden">
          <div
            className={clsx(
              "h-full rounded-full transition-all duration-700 ease-out",
              level === "LOW" && "bg-risk-low",
              level === "MEDIUM" && "bg-risk-medium",
              level === "HIGH" && "bg-risk-high",
              level === "CRITICAL" && "bg-risk-critical",
            )}
            style={{ width: `${Math.min(risk.calculated_score, 100)}%` }}
          />
        </div>

        {/* Scale labels */}
        <div className="mt-2 flex justify-between text-[10px] text-text-tertiary">
          <span>Low (0)</span>
          <span>Medium (25)</span>
          <span>High (50)</span>
          <span>Critical (75+)</span>
        </div>
      </div>

      {/* Component weights */}
      <div className="mt-5 space-y-2">
        <p className="text-[11px] font-medium text-text-secondary uppercase tracking-wider">
          Score Components
        </p>
        {COMPONENTS.map(({ label, weight, color }) => (
          <div key={label} className="flex items-center gap-2 text-xs">
            <div className={clsx("h-1.5 w-1.5 rounded-full shrink-0", color)} />
            <span className="flex-1 text-text-secondary">{label}</span>
            <span className="text-text-tertiary tabular-nums">{weight}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const COMPONENTS = [
  { label: "Status Code Match", weight: 35, color: "bg-accent" },
  { label: "Performance (Latency)", weight: 25, color: "bg-risk-medium" },
  { label: "Schema Drift", weight: 20, color: "bg-drift-new" },
  { label: "AI Anomaly", weight: 15, color: "bg-ai-purple" },
  { label: "Historical Trend", weight: 5, color: "bg-text-tertiary" },
] as const;
