import { Shield, AlertTriangle, Bug, Layers } from "lucide-react";
import { useSecurityStats } from "@/hooks/useSecurity.ts";
import { Skeleton } from "@/components/common/Skeleton.tsx";
import clsx from "clsx";

/**
 * KPI stat cards for the Security page — total findings,
 * affected endpoints, critical count, and finding types.
 */
export function SecurityStatsCards({ days = 30 }: { days?: number }) {
  const { data: stats, isLoading } = useSecurityStats(days);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card p-4">
            <Skeleton className="h-3 w-20 mb-2" />
            <Skeleton className="h-6 w-12" />
          </div>
        ))}
      </div>
    );
  }

  const criticalCount =
    stats?.by_severity.find((s) => s.severity === "CRITICAL")?.count ?? 0;
  const typeCount = stats?.by_type.length ?? 0;

  const cards = [
    {
      label: "Total Findings",
      value: stats?.total_findings ?? 0,
      icon: Shield,
      color: "text-red-400",
    },
    {
      label: "Affected Endpoints",
      value: stats?.affected_endpoints ?? 0,
      icon: Layers,
      color: "text-amber-400",
    },
    {
      label: "Critical Leaks",
      value: criticalCount,
      icon: AlertTriangle,
      color: "text-risk-critical",
    },
    {
      label: "Leak Types Found",
      value: typeCount,
      icon: Bug,
      color: "text-purple-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map(({ label, value, icon: Icon, color }) => (
        <div key={label} className="card p-4">
          <div className="flex items-center gap-2 mb-1.5">
            <Icon className={clsx("h-4 w-4", color)} />
            <span className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider">
              {label}
            </span>
          </div>
          <p className="text-lg font-bold tabular-nums text-text-primary">
            {value}
          </p>
        </div>
      ))}
    </div>
  );
}
