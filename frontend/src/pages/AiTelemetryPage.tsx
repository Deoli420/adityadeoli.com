import { useState } from "react";
import {
  Brain,
  Coins,
  Zap,
  Hash,
  Clock,
  TrendingUp,
} from "lucide-react";
import clsx from "clsx";
import { useAiTelemetryStats } from "@/hooks/useAiTelemetry.ts";
import { TokenUsageChart } from "@/components/ai-telemetry/TokenUsageChart.tsx";
import { CostBreakdownChart } from "@/components/ai-telemetry/CostBreakdownChart.tsx";
import { AiHealthCard } from "@/components/ai-telemetry/AiHealthCard.tsx";
import { Skeleton } from "@/components/common/Skeleton.tsx";

const TIME_PRESETS = [
  { label: "7d", days: 7 },
  { label: "14d", days: 14 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
] as const;

export function AiTelemetryPage() {
  const [days, setDays] = useState(30);
  const { data, isLoading } = useAiTelemetryStats(days);

  const stats = data?.stats;

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-2 py-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <Brain className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-text-primary">
              AI Telemetry
            </h1>
            <p className="text-sm text-text-secondary">
              LLM usage, cost tracking &amp; health monitoring
            </p>
          </div>
        </div>

        {/* Time range selector */}
        <div className="flex gap-1.5 rounded-lg border border-border bg-surface p-1">
          {TIME_PRESETS.map((preset) => (
            <button
              key={preset.days}
              onClick={() => setDays(preset.days)}
              className={clsx(
                "rounded-md px-3 py-1 text-xs font-medium transition-all",
                days === preset.days
                  ? "bg-accent/15 text-accent"
                  : "text-text-secondary hover:text-text-primary",
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <KpiCard
          label="Total Calls"
          value={stats?.total_calls.toLocaleString() ?? "—"}
          icon={Zap}
          color="text-blue-400 bg-blue-500/10"
          loading={isLoading}
        />
        <KpiCard
          label="Total Tokens"
          value={
            stats
              ? stats.total_tokens >= 1_000_000
                ? `${(stats.total_tokens / 1_000_000).toFixed(1)}M`
                : stats.total_tokens >= 1_000
                  ? `${(stats.total_tokens / 1_000).toFixed(1)}K`
                  : stats.total_tokens.toString()
              : "—"
          }
          icon={Hash}
          color="text-purple-400 bg-purple-500/10"
          loading={isLoading}
        />
        <KpiCard
          label="Total Cost"
          value={stats ? `$${stats.total_cost_usd.toFixed(4)}` : "—"}
          icon={Coins}
          color="text-emerald-400 bg-emerald-500/10"
          loading={isLoading}
        />
        <KpiCard
          label="Avg Latency"
          value={stats ? `${Math.round(stats.avg_latency_ms)}ms` : "—"}
          icon={Clock}
          color="text-amber-400 bg-amber-500/10"
          loading={isLoading}
        />
        <KpiCard
          label="Tokens/Call"
          value={
            stats ? Math.round(stats.avg_tokens_per_call).toString() : "—"
          }
          icon={TrendingUp}
          color="text-cyan-400 bg-cyan-500/10"
          loading={isLoading}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TokenUsageChart days={days} />
        <CostBreakdownChart days={days} />
      </div>

      {/* Health + details row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <AiHealthCard />

        {/* Token distribution */}
        <div className="card col-span-1 space-y-3 p-5 lg:col-span-2">
          <h3 className="text-sm font-medium text-text-primary">
            Token Distribution
          </h3>
          {isLoading ? (
            <Skeleton className="h-20 w-full rounded-lg" />
          ) : stats ? (
            <div className="space-y-3">
              <TokenBar
                label="Prompt Tokens"
                value={stats.total_prompt_tokens}
                total={stats.total_tokens}
                color="bg-blue-500"
              />
              <TokenBar
                label="Completion Tokens"
                value={stats.total_completion_tokens}
                total={stats.total_tokens}
                color="bg-purple-500"
              />
              <div className="mt-2 flex items-center justify-between text-xs text-text-tertiary">
                <span>
                  {stats.successful_calls} successful /{" "}
                  {stats.failed_calls} failed calls
                </span>
                <span>
                  {stats.total_tokens > 0
                    ? `${((stats.total_prompt_tokens / stats.total_tokens) * 100).toFixed(0)}% prompt / ${((stats.total_completion_tokens / stats.total_tokens) * 100).toFixed(0)}% completion`
                    : "No tokens used"}
                </span>
              </div>
            </div>
          ) : (
            <p className="py-4 text-center text-xs text-text-tertiary">
              No token data available
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  icon: Icon,
  color,
  loading,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  color: string;
  loading: boolean;
}) {
  return (
    <div className="card flex items-center gap-3 p-4">
      <div
        className={clsx(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
          color,
        )}
      >
        <Icon className="h-4.5 w-4.5" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-wider text-text-tertiary">
          {label}
        </p>
        {loading ? (
          <Skeleton className="mt-1 h-5 w-16 rounded" />
        ) : (
          <p className="text-lg font-semibold text-text-primary">{value}</p>
        )}
      </div>
    </div>
  );
}

function TokenBar({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs text-text-secondary">{label}</span>
        <span className="text-xs font-medium text-text-primary">
          {value.toLocaleString()}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-tertiary">
        <div
          className={clsx("h-full rounded-full transition-all", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
