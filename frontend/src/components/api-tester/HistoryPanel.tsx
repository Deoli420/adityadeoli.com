import { useApiTesterStore } from "@/stores/apiTesterStore.ts";
import { statusColor, formatDuration } from "@/services/requestRunner.ts";
import { Clock, Trash2, RotateCcw } from "lucide-react";
import clsx from "clsx";

/**
 * Request history sidebar panel.
 *
 * Shows recent requests with method, URL, status, duration.
 * Click to reload into the editor.
 */
export function HistoryPanel() {
  const history = useApiTesterStore((s) => s.history);
  const loadRequest = useApiTesterStore((s) => s.loadRequest);
  const clearHistory = useApiTesterStore((s) => s.clearHistory);

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-text-tertiary">
        <Clock className="h-6 w-6 opacity-30 mb-2" />
        <p className="text-xs">No history yet</p>
        <p className="text-[10px]">Sent requests will appear here</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border-subtle">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">
          History
        </span>
        <button
          type="button"
          onClick={clearHistory}
          className="text-[10px] text-text-tertiary hover:text-risk-critical transition-colors flex items-center gap-1"
        >
          <Trash2 className="h-2.5 w-2.5" />
          Clear
        </button>
      </div>

      {/* List */}
      <div className="max-h-[400px] overflow-y-auto">
        {history.map((entry) => {
          // Method color mapping
          const methodColors: Record<string, string> = {
            GET: "text-risk-low",
            POST: "text-risk-medium",
            PUT: "text-drift-new",
            PATCH: "text-ai-purple",
            DELETE: "text-risk-critical",
            HEAD: "text-text-secondary",
            OPTIONS: "text-text-secondary",
          };

          const methodColor = methodColors[entry.method] || "text-text-secondary";
          const urlDisplay = (() => {
            try {
              const u = new URL(entry.url);
              return u.pathname + u.search;
            } catch {
              return entry.url;
            }
          })();

          const timeAgo = formatTimeAgo(entry.timestamp);

          return (
            <button
              key={entry.id}
              type="button"
              onClick={() => loadRequest(entry.request)}
              className="w-full flex items-start gap-2 px-3 py-2 text-left border-b border-border-subtle hover:bg-surface-tertiary/50 transition-colors group"
            >
              <span
                className={clsx(
                  "text-[10px] font-bold font-mono w-10 shrink-0 pt-0.5",
                  methodColor,
                )}
              >
                {entry.method}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-mono text-text-primary truncate">
                  {urlDisplay}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className={clsx(
                      "text-[10px] font-medium tabular-nums",
                      statusColor(entry.status),
                    )}
                  >
                    {entry.status || "ERR"}
                  </span>
                  <span className="text-[10px] text-text-tertiary tabular-nums">
                    {formatDuration(entry.duration)}
                  </span>
                  <span className="text-[10px] text-text-tertiary">
                    {timeAgo}
                  </span>
                </div>
              </div>
              <RotateCcw className="h-3 w-3 text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
