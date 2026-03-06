import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Brain } from "lucide-react";
import { useAiDailyBreakdown } from "@/hooks/useAiTelemetry.ts";
import { Skeleton } from "@/components/common/Skeleton.tsx";

/**
 * Daily AI token usage — AreaChart with accent gradient.
 * Each point = 1 day showing total tokens used.
 */
export function TokenUsageChart({ days = 30 }: { days?: number }) {
  const { data, isLoading } = useAiDailyBreakdown(days);

  if (isLoading) {
    return (
      <ChartShell title="Token Usage" subtitle="Daily AI token consumption">
        <Skeleton className="h-56 w-full rounded-lg" />
      </ChartShell>
    );
  }

  const points = data?.points ?? [];

  if (points.length === 0) {
    return (
      <ChartShell title="Token Usage" subtitle="Daily AI token consumption">
        <div className="flex h-56 flex-col items-center justify-center text-center">
          <Brain className="mb-2 h-8 w-8 text-text-tertiary/50" />
          <p className="text-xs text-text-tertiary">
            No AI usage data yet. Token metrics will appear after AI-powered
            anomaly analysis runs.
          </p>
        </div>
      </ChartShell>
    );
  }

  const chartData = points.map((p) => ({
    date: new Date(p.date).toLocaleDateString([], {
      month: "short",
      day: "numeric",
    }),
    tokens: p.tokens,
    calls: p.calls,
    cost: p.cost_usd,
  }));

  const totalTokens = points.reduce((s, p) => s + p.tokens, 0);

  return (
    <ChartShell
      title="Token Usage"
      subtitle={`Last ${days}d · ${totalTokens.toLocaleString()} total tokens`}
    >
      <ResponsiveContainer width="100%" height={224}>
        <AreaChart
          data={chartData}
          margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
        >
          <defs>
            <linearGradient
              id="tokenGradient"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor="var(--color-accent)"
                stopOpacity={0.3}
              />
              <stop
                offset="100%"
                stopColor="var(--color-accent)"
                stopOpacity={0.02}
              />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--color-border-subtle)"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "var(--color-text-tertiary)" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "var(--color-text-tertiary)" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) =>
              v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${v}`
            }
            width={48}
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
              (value ?? 0).toLocaleString(),
              "Tokens",
            ]}
          />
          <Area
            type="monotone"
            dataKey="tokens"
            stroke="var(--color-accent)"
            strokeWidth={2}
            fill="url(#tokenGradient)"
          />
        </AreaChart>
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
