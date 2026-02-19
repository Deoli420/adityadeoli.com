import type { RiskLevel } from "@/types/index.ts";

// ── Risk level → visual mapping ───────────────────────────────────────────

interface RiskStyle {
  label: string;
  color: string;       // Tailwind text color class
  bg: string;          // Tailwind bg color class
  border: string;      // Tailwind border color class
  dot: string;         // Tailwind bg for status dot
}

const RISK_STYLES: Record<RiskLevel, RiskStyle> = {
  LOW: {
    label: "Low",
    color: "text-risk-low",
    bg: "bg-risk-low-bg",
    border: "border-risk-low-border",
    dot: "bg-risk-low",
  },
  MEDIUM: {
    label: "Medium",
    color: "text-risk-medium",
    bg: "bg-risk-medium-bg",
    border: "border-risk-medium-border",
    dot: "bg-risk-medium",
  },
  HIGH: {
    label: "High",
    color: "text-risk-high",
    bg: "bg-risk-high-bg",
    border: "border-risk-high-border",
    dot: "bg-risk-high",
  },
  CRITICAL: {
    label: "Critical",
    color: "text-risk-critical",
    bg: "bg-risk-critical-bg",
    border: "border-risk-critical-border",
    dot: "bg-risk-critical",
  },
};

export function getRiskStyle(level: RiskLevel): RiskStyle {
  return RISK_STYLES[level] ?? RISK_STYLES.LOW;
}

/** Derive risk level from numeric score (matches backend thresholds) */
export function scoreToLevel(score: number): RiskLevel {
  if (score >= 75) return "CRITICAL";
  if (score >= 50) return "HIGH";
  if (score >= 25) return "MEDIUM";
  return "LOW";
}

/** Recharts-friendly hex colour for a risk level */
export function riskHex(level: RiskLevel): string {
  const map: Record<RiskLevel, string> = {
    LOW: "#22c55e",
    MEDIUM: "#f59e0b",
    HIGH: "#f97316",
    CRITICAL: "#ef4444",
  };
  return map[level] ?? "#6b7280";
}

/** Sort order for risk levels (higher = more severe) */
export function riskSeverity(level: RiskLevel): number {
  const order: Record<RiskLevel, number> = {
    LOW: 0,
    MEDIUM: 1,
    HIGH: 2,
    CRITICAL: 3,
  };
  return order[level] ?? 0;
}
