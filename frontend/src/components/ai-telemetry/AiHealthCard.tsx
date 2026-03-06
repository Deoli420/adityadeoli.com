import { Activity, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import clsx from "clsx";
import { useAiHealth } from "@/hooks/useAiTelemetry.ts";
import { Skeleton } from "@/components/common/Skeleton.tsx";

/**
 * AI Health card — shows LLM success rate, error info, and model name.
 * Acts as a quick health-check indicator for the AI subsystem.
 */
export function AiHealthCard() {
  const { data, isLoading } = useAiHealth();

  if (isLoading) {
    return <Skeleton className="h-40 w-full rounded-xl" />;
  }

  if (!data) {
    return (
      <div className="card flex h-40 items-center justify-center p-5">
        <p className="text-xs text-text-tertiary">No AI health data</p>
      </div>
    );
  }

  const successPct = (data.success_rate * 100).toFixed(1);
  const isHealthy = data.success_rate >= 0.95;
  const isDegraded = data.success_rate >= 0.8 && data.success_rate < 0.95;

  return (
    <div className="card space-y-4 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-text-primary">AI Health</h3>
        <span
          className={clsx(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium",
            isHealthy && "bg-emerald-500/10 text-emerald-400",
            isDegraded && "bg-amber-500/10 text-amber-400",
            !isHealthy && !isDegraded && "bg-red-500/10 text-red-400",
          )}
        >
          {isHealthy ? (
            <CheckCircle2 className="h-3 w-3" />
          ) : (
            <AlertCircle className="h-3 w-3" />
          )}
          {isHealthy ? "Healthy" : isDegraded ? "Degraded" : "Unhealthy"}
        </span>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <Stat
          label="Success Rate"
          value={`${successPct}%`}
          icon={Activity}
          color={
            isHealthy
              ? "text-emerald-400"
              : isDegraded
                ? "text-amber-400"
                : "text-red-400"
          }
        />
        <Stat
          label="Avg Latency"
          value={`${Math.round(data.avg_latency_ms)}ms`}
          icon={Clock}
          color="text-blue-400"
        />
        <Stat
          label="Total Calls"
          value={data.total_calls.toLocaleString()}
          icon={Activity}
          color="text-slate-400"
        />
        <div>
          <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-text-tertiary">
            Model
          </p>
          <p className="text-sm font-semibold text-text-primary">
            {data.model_name}
          </p>
        </div>
      </div>

      {/* Last error */}
      {data.last_error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2">
          <p className="text-[10px] font-medium uppercase tracking-wider text-red-400">
            Last Error
          </p>
          <p className="mt-0.5 truncate text-xs text-red-300">
            {data.last_error}
          </p>
          {data.last_error_at && (
            <p className="mt-0.5 text-[10px] text-red-400/60">
              {new Date(data.last_error_at).toLocaleString()}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div>
      <p className="mb-1 flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-text-tertiary">
        <Icon className={clsx("h-3 w-3", color)} />
        {label}
      </p>
      <p className="text-sm font-semibold text-text-primary">{value}</p>
    </div>
  );
}
