import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { TrendingUp } from "lucide-react";
import { useResponseTrends } from "@/hooks/useDashboard.ts";
import { Skeleton } from "@/components/common/Skeleton.tsx";

/**
 * 24h response-time trend — AreaChart with accent gradient.
 *
 * Each point = 1 hour bucket showing avg response time across
 * all tenant endpoints.
 */
export function ResponseTrendsChart() {
  const { data, isLoading } = useResponseTrends(24);

  if (isLoading) {
    return (
      <ChartShell title="Response Trends" subtitle="Last 24 hours">
        <Skeleton className="h-56 w-full rounded-lg" />
      </ChartShell>
    );
  }

  const points = data?.points ?? [];

  if (points.length === 0) {
    return (
      <ChartShell title="Response Trends" subtitle="Last 24 hours">
        <div className="flex h-56 flex-col items-center justify-center text-center">
          <TrendingUp className="h-8 w-8 text-text-tertiary/50 mb-2" />
          <p className="text-xs text-text-tertiary">
            No data yet. Response trends will appear after monitoring runs.
          </p>
        </div>
      </ChartShell>
    );
  }

  const chartData = points.map((p) => ({
    hour: new Date(p.hour).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
    avgMs: Math.round(p.avg_response_time_ms),
    count: p.request_count,
  }));

  return (
    <ChartShell
      title="Response Trends"
      subtitle={`Last 24h \u00b7 ${points.reduce((s, p) => s + p.request_count, 0)} requests`}
    >
      <ResponsiveContainer width="100%" height={224}>
        <AreaChart
          data={chartData}
          margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
        >
          <defs>
            <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.3} />
              <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--color-border-subtle)"
            vertical={false}
          />
          <XAxis
            dataKey="hour"
            tick={{ fontSize: 10, fill: "var(--color-text-tertiary)" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "var(--color-text-tertiary)" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => `${v}ms`}
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
            formatter={(value: number | undefined) => [`${value ?? 0}ms`, "Avg Response"]}
          />
          <Area
            type="monotone"
            dataKey="avgMs"
            stroke="var(--color-accent)"
            strokeWidth={2}
            fill="url(#trendGradient)"
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
