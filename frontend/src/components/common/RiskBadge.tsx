import clsx from "clsx";
import type { RiskLevel } from "@/types/index.ts";
import { getRiskStyle } from "@/utils/riskUtils.ts";

interface RiskBadgeProps {
  level: RiskLevel;
  /** Optional: show numeric score alongside the label */
  score?: number;
  /** Size variant */
  size?: "sm" | "md";
}

/**
 * Risk-level badge with semantic colouring.
 *
 * Uses the design token system (--color-risk-*) via Tailwind utility classes.
 * Dot + label pattern is inspired by Linear's status badges.
 */
export function RiskBadge({ level, score, size = "sm" }: RiskBadgeProps) {
  const style = getRiskStyle(level);

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        style.bg,
        style.border,
        style.color,
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm",
      )}
    >
      {/* Status dot */}
      <span className={clsx("inline-block h-1.5 w-1.5 rounded-full", style.dot)} />
      {style.label}
      {score !== undefined && (
        <span className="opacity-70">({score})</span>
      )}
    </span>
  );
}
