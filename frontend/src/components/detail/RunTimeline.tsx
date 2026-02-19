import type { ApiRunSummary } from "@/types/index.ts";
import { Skeleton } from "@/components/common/Skeleton.tsx";
import { formatMs, timeAgo } from "@/utils/formatters.ts";
import { History } from "lucide-react";
import clsx from "clsx";

interface RunTimelineProps {
  runs: ApiRunSummary[] | undefined;
  isLoading: boolean;
}

/**
 * Chronological list of monitoring runs with status and latency.
 *
 * Shows a compact table with:
 * - Status code (color-coded: green for 2xx, amber for 3xx, red for 4xx/5xx)
 * - Response time
 * - Relative timestamp
 *
 * Runs are shown newest-first (already sorted by the API).
 */
export function RunTimeline({ runs, isLoading }: RunTimelineProps) {
  if (isLoading) {
    return (
      <div className="card p-5">
        <Skeleton className="mb-4 h-4 w-28" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!runs || runs.length === 0) {
    return (
      <div className="card p-5">
        <h3 className="text-sm font-medium text-text-primary">Run Timeline</h3>
        <div className="mt-4 flex h-24 flex-col items-center justify-center text-center">
          <History className="h-8 w-8 text-text-tertiary/50 mb-2" />
          <p className="text-xs text-text-tertiary">No runs recorded yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-border px-5 py-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-text-primary">Run Timeline</h3>
        <span className="text-[11px] text-text-tertiary tabular-nums">
          {runs.length} runs
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-left text-[11px] font-medium uppercase tracking-wider text-text-tertiary">
              <th className="px-5 py-2.5 w-8">#</th>
              <th className="px-5 py-2.5">Status</th>
              <th className="px-5 py-2.5">Latency</th>
              <th className="px-5 py-2.5">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {runs.map((run, index) => (
              <tr
                key={run.id}
                className="transition-colors hover:bg-surface-secondary/50 animate-fade-in"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <td className="px-5 py-2.5 text-xs text-text-tertiary tabular-nums">
                  {runs.length - index}
                </td>
                <td className="px-5 py-2.5">
                  <StatusBadge code={run.status_code ?? 0} />
                </td>
                <td className="px-5 py-2.5 font-mono text-xs text-text-secondary tabular-nums">
                  {formatMs(run.response_time_ms)}
                </td>
                <td className="px-5 py-2.5 text-xs text-text-secondary">
                  {timeAgo(run.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ code }: { code: number }) {
  const isSuccess = code >= 200 && code < 300;
  const isRedirect = code >= 300 && code < 400;
  const isClientError = code >= 400 && code < 500;
  const isServerError = code >= 500;

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums",
        isSuccess && "bg-risk-low-bg text-risk-low border border-risk-low-border",
        isRedirect && "bg-risk-medium-bg text-risk-medium border border-risk-medium-border",
        isClientError && "bg-risk-high-bg text-risk-high border border-risk-high-border",
        isServerError && "bg-risk-critical-bg text-risk-critical border border-risk-critical-border",
      )}
    >
      <span
        className={clsx(
          "h-1.5 w-1.5 rounded-full",
          isSuccess && "bg-risk-low",
          isRedirect && "bg-risk-medium",
          isClientError && "bg-risk-high",
          isServerError && "bg-risk-critical",
        )}
      />
      {code}
    </span>
  );
}
