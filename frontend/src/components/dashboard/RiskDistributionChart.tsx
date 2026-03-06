import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import { Shield } from "lucide-react";
import { useRiskDistribution } from "@/hooks/useDashboard.ts";
import { Skeleton } from "@/components/common/Skeleton.tsx";

const RISK_COLORS: Record<string, string> = {
  low: "var(--color-risk-low)",
  medium: "var(--color-risk-medium)",
  high: "var(--color-risk-high)",
  critical: "var(--color-risk-critical)",
};

const RISK_LABELS: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

/**
 * Donut chart showing endpoint distribution by risk level.
 */
export function RiskDistributionChart() {
  const { data, isLoading } = useRiskDistribution();

  if (isLoading) {
    return (
      <div className="card p-5">
        <h3 className="text-sm font-medium text-text-primary mb-4">
          Risk Distribution
        </h3>
        <Skeleton className="h-56 w-full rounded-lg" />
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const total = data.low + data.medium + data.high + data.critical;

  if (total === 0) {
    return (
      <div className="card p-5">
        <h3 className="text-sm font-medium text-text-primary mb-4">
          Risk Distribution
        </h3>
        <div className="flex h-56 flex-col items-center justify-center text-center">
          <Shield className="h-8 w-8 text-text-tertiary/50 mb-2" />
          <p className="text-xs text-text-tertiary">
            No risk data available yet.
          </p>
        </div>
      </div>
    );
  }

  const chartData = [
    { name: "low", value: data.low },
    { name: "medium", value: data.medium },
    { name: "high", value: data.high },
    { name: "critical", value: data.critical },
  ].filter((d) => d.value > 0);

  return (
    <div className="card p-5">
      <h3 className="text-sm font-medium text-text-primary mb-4">
        Risk Distribution
      </h3>
      <div className="flex items-center gap-6">
        <ResponsiveContainer width={160} height={160}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={70}
              paddingAngle={2}
              dataKey="value"
              strokeWidth={0}
            >
              {chartData.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={RISK_COLORS[entry.name]}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "0.5rem",
                fontSize: "0.75rem",
                boxShadow: "0 4px 12px rgb(0 0 0 / 0.08)",
              }}
              formatter={(value: number | undefined, name: string | undefined) => [
                `${value ?? 0} endpoint${(value ?? 0) !== 1 ? "s" : ""}`,
                RISK_LABELS[name ?? ""] ?? name ?? "",
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
        {/* Legend */}
        <div className="space-y-2">
          {chartData.map((entry) => (
            <div key={entry.name} className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: RISK_COLORS[entry.name] }}
              />
              <span className="text-xs text-text-secondary">
                {RISK_LABELS[entry.name]}
              </span>
              <span className="text-xs font-semibold text-text-primary tabular-nums">
                {entry.value}
              </span>
            </div>
          ))}
          <div className="pt-1 border-t border-border-subtle">
            <span className="text-[11px] text-text-tertiary">
              {total} total endpoint{total !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
