import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import type { ApiRunSummary, PerformanceReadout } from "@/types/index.ts";
import { Skeleton } from "@/components/common/Skeleton.tsx";
import { formatMs, timeAgo } from "@/utils/formatters.ts";
import { BarChart3 } from "lucide-react";

interface PerformanceChartProps {
  runs: ApiRunSummary[] | undefined;
  performance: PerformanceReadout | null | undefined;
  isLoading: boolean;
}

/**
 * Latency line chart showing response time over recent runs.
 *
 * - X axis: run timestamp (relative)
 * - Y axis: response time in ms
 * - Rolling average shown as a dashed reference line
 * - Spike runs highlighted with a red dot
 *
 * Uses Recharts ResponsiveContainer for fluid width.
 */
export function PerformanceChart({
  runs,
  performance,
  isLoading,
}: PerformanceChartProps) {
  if (isLoading) {
    return (
      <ChartShell title="Performance">
        <Skeleton className="h-56 w-full rounded-lg" />
      </ChartShell>
    );
  }

  if (!runs || runs.length === 0) {
    return (
      <ChartShell title="Performance">
        <div className="flex h-56 flex-col items-center justify-center text-center">
          <BarChart3 className="h-8 w-8 text-text-tertiary/50 mb-2" />
          <p className="text-xs text-text-tertiary">
            No runs yet. Click &ldquo;Run Now&rdquo; to start monitoring.
          </p>
        </div>
      </ChartShell>
    );
  }

  // Transform runs into chart data (oldest -> newest)
  const chartData = [...runs]
    .reverse()
    .map((run) => ({
      time: timeAgo(run.created_at),
      latency: run.response_time_ms ?? 0,
      status: run.status_code ?? 0,
      isError: (run.status_code ?? 0) >= 400,
    }));

  const avgMs = performance?.rolling_avg_ms;

  return (
    <ChartShell
      title="Performance"
      subtitle={
        avgMs != null
          ? `Rolling avg: ${formatMs(avgMs)} \u00b7 ${runs.length} runs`
          : `${runs.length} runs`
      }
    >
      <ResponsiveContainer width="100%" height={224}>
        <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--color-border-subtle)"
            vertical={false}
          />
          <XAxis
            dataKey="time"
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
            formatter={(value: number | undefined) => [formatMs(value ?? 0), "Latency"]}
          />
          {avgMs != null && (
            <ReferenceLine
              y={avgMs}
              stroke="var(--color-accent)"
              strokeDasharray="4 4"
              strokeWidth={1}
              strokeOpacity={0.6}
            />
          )}
          <Line
            type="monotone"
            dataKey="latency"
            stroke="var(--color-accent)"
            strokeWidth={2}
            dot={(props: Record<string, unknown>) => {
              const { cx, cy, payload } = props as {
                cx: number;
                cy: number;
                payload: { isError: boolean };
              };
              if (payload.isError) {
                return (
                  <circle
                    key={`${cx}-${cy}`}
                    cx={cx}
                    cy={cy}
                    r={4}
                    fill="var(--color-risk-critical)"
                    stroke="var(--color-surface)"
                    strokeWidth={2}
                  />
                );
              }
              return (
                <circle
                  key={`${cx}-${cy}`}
                  cx={cx}
                  cy={cy}
                  r={3}
                  fill="var(--color-accent)"
                  stroke="var(--color-surface)"
                  strokeWidth={2}
                />
              );
            }}
            activeDot={{ r: 5, strokeWidth: 2 }}
          />
        </LineChart>
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
