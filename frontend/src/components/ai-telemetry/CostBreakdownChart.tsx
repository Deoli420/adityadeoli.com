import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { DollarSign } from "lucide-react";
import { useAiPerEndpoint } from "@/hooks/useAiTelemetry.ts";
import { Skeleton } from "@/components/common/Skeleton.tsx";

/**
 * Cost-by-endpoint bar chart — shows which endpoints consume the most
 * AI budget, sorted by total cost descending.
 */
export function CostBreakdownChart({ days = 30 }: { days?: number }) {
  const { data, isLoading } = useAiPerEndpoint(days);

  if (isLoading) {
    return (
      <ChartShell
        title="Cost by Endpoint"
        subtitle="AI spend per monitored endpoint"
      >
        <Skeleton className="h-56 w-full rounded-lg" />
      </ChartShell>
    );
  }

  const endpoints = data?.endpoints ?? [];

  if (endpoints.length === 0) {
    return (
      <ChartShell
        title="Cost by Endpoint"
        subtitle="AI spend per monitored endpoint"
      >
        <div className="flex h-56 flex-col items-center justify-center text-center">
          <DollarSign className="mb-2 h-8 w-8 text-text-tertiary/50" />
          <p className="text-xs text-text-tertiary">
            No per-endpoint data yet. Cost breakdown will appear after AI
            analysis runs.
          </p>
        </div>
      </ChartShell>
    );
  }

  const chartData = endpoints.slice(0, 10).map((ep) => ({
    name:
      ep.endpoint_name.length > 18
        ? ep.endpoint_name.slice(0, 16) + "…"
        : ep.endpoint_name,
    cost: Number(ep.total_cost_usd.toFixed(4)),
    calls: ep.total_calls,
    tokens: ep.total_tokens,
  }));

  const totalCost = endpoints.reduce((s, ep) => s + ep.total_cost_usd, 0);

  return (
    <ChartShell
      title="Cost by Endpoint"
      subtitle={`Last ${days}d · $${totalCost.toFixed(4)} total`}
    >
      <ResponsiveContainer width="100%" height={224}>
        <BarChart
          data={chartData}
          margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
          layout="vertical"
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--color-border-subtle)"
            horizontal={false}
          />
          <XAxis
            type="number"
            tick={{ fontSize: 10, fill: "var(--color-text-tertiary)" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => `$${v}`}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 10, fill: "var(--color-text-tertiary)" }}
            tickLine={false}
            axisLine={false}
            width={120}
          />
          <Tooltip
            contentStyle={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "0.5rem",
              fontSize: "0.75rem",
              boxShadow: "0 4px 12px rgb(0 0 0 / 0.08)",
            }}
            formatter={(value: number | undefined) => [
              `$${(value ?? 0).toFixed(4)}`,
              "Cost",
            ]}
          />
          <Bar
            dataKey="cost"
            fill="var(--color-accent)"
            radius={[0, 4, 4, 0]}
            maxBarSize={24}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

function ChartShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card p-5">
      <div className="mb-4">
        <h3 className="text-sm font-medium text-text-primary">{title}</h3>
        {subtitle && (
          <p className="mt-0.5 text-[11px] text-text-tertiary">{subtitle}</p>
        )}
      </div>
      {children}
    </div>
  );
}
