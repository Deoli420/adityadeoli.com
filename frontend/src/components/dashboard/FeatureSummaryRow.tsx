import { Link } from "react-router-dom";
import {
  Brain,
  FileWarning,
  GitCompareArrows,
  Shield,
} from "lucide-react";
import clsx from "clsx";
import { useFeatureSummary } from "@/hooks/useFeatureSummary.ts";
import { SkeletonCard } from "@/components/common/Skeleton.tsx";

// ── Card definitions ─────────────────────────────────────────────────────

interface CardDef {
  icon: typeof Shield;
  title: string;
  link: string;
  getValue: (d: NonNullable<ReturnType<typeof useFeatureSummary>["data"]>) => number;
  /** Use risk-critical colouring when count > 0 (e.g. security findings). */
  critical?: boolean;
}

const CARDS: CardDef[] = [
  {
    icon: Shield,
    title: "Security Findings",
    link: "/security",
    getValue: (d) => d.security_findings_24h,
    critical: true,
  },
  {
    icon: GitCompareArrows,
    title: "Schema Drifts",
    link: "/",
    getValue: (d) => d.schema_drifts_24h,
  },
  {
    icon: FileWarning,
    title: "Contract Issues",
    link: "/",
    getValue: () => 0, // placeholder — contracts aren't tracked globally yet
  },
  {
    icon: Brain,
    title: "AI Analyses",
    link: "/ai-telemetry",
    getValue: (d) => d.ai_analyses_24h,
  },
];

// ── Component ────────────────────────────────────────────────────────────

/**
 * Four mini stat-cards that link to the main feature pages.
 * Highlights non-zero counts with accent (or critical) colour.
 */
export function FeatureSummaryRow() {
  const { data, isLoading } = useFeatureSummary();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {CARDS.map((card) => {
        const Icon = card.icon;
        const count = data ? card.getValue(data) : 0;
        const active = count > 0;
        const colorClass =
          active && card.critical
            ? "text-risk-critical"
            : active
              ? "text-accent"
              : undefined;

        return (
          <Link
            key={card.title}
            to={card.link}
            className="card card-hover p-4"
          >
            <Icon
              className={clsx(
                "h-5 w-5 mb-2",
                colorClass ?? "text-text-tertiary",
              )}
            />
            <p className="text-[11px] uppercase tracking-wider font-medium text-text-tertiary">
              {card.title}
            </p>
            <p
              className={clsx(
                "text-xl font-semibold tabular-nums",
                colorClass ?? "text-text-primary",
              )}
            >
              {count}
            </p>
          </Link>
        );
      })}
    </div>
  );
}
