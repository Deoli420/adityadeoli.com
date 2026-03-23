import {
  Activity,
  AlertTriangle,
  Clock,
  ShieldAlert,
  TrendingUp,
} from "lucide-react";
import clsx from "clsx";
import { useWsStore } from "@/stores/wsStore.ts";
import type { WsEvent } from "@/stores/wsStore.ts";
import { timeAgo } from "@/utils/formatters.ts";

// ── Helpers ──────────────────────────────────────────────────────────────

interface EventConfig {
  icon: typeof Activity;
  colorClass: string;
  message: string;
}

function resolveEvent(e: WsEvent): EventConfig {
  switch (e.type) {
    case "new_run": {
      const code = (e.status_code as number) ?? 0;
      const ok = code > 0 && code < 400;
      return {
        icon: Activity,
        colorClass: ok ? "text-risk-low" : "text-risk-critical",
        message: `${e.endpoint_name} \u2014 ${code} \u2014 ${e.response_time_ms ?? "?"}ms`,
      };
    }
    case "risk_update": {
      const score = (e.score as number) ?? 0;
      return {
        icon: TrendingUp,
        colorClass: score >= 75 ? "text-risk-critical" : "text-risk-medium",
        message: `Risk: ${e.endpoint_name} \u2192 ${score}/100`,
      };
    }
    case "anomaly_detected":
      return {
        icon: AlertTriangle,
        colorClass: "text-risk-medium",
        message: `Anomaly: ${e.endpoint_name}`,
      };
    case "incident_created":
      return {
        icon: ShieldAlert,
        colorClass: "text-risk-critical",
        message: `Incident: ${e.endpoint_name}`,
      };
    case "sla_breach":
      return {
        icon: Clock,
        colorClass: "text-risk-critical",
        message: `SLA breach: ${e.endpoint_name}`,
      };
    default:
      return {
        icon: Activity,
        colorClass: "text-text-tertiary",
        message: `${e.type}: ${e.endpoint_name ?? "unknown"}`,
      };
  }
}

// ── Component ────────────────────────────────────────────────────────────

/**
 * Real-time activity feed driven by WebSocket events stored in wsStore.
 * Designed to sit in a sticky sidebar column on the dashboard.
 */
export function ActivityFeed() {
  const events = useWsStore((s) => s.events);
  const connected = useWsStore((s) => s.connected);

  return (
    <div className="card lg:sticky lg:top-6">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-4 pb-3">
        <h3 className="text-sm font-medium text-text-primary">
          Live Activity
        </h3>

        {/* Connection dot */}
        <span
          className={clsx(
            "h-2 w-2 rounded-full shrink-0",
            connected
              ? "bg-risk-low animate-pulse-ring"
              : "bg-text-tertiary",
          )}
        />

        {!connected && (
          <span className="text-[11px] text-text-tertiary">(reconnecting...)</span>
        )}
      </div>

      {/* Scrollable body */}
      <div className="max-h-80 overflow-y-auto px-4 pb-4">
        {events.length === 0 ? (
          <p className="text-xs text-text-tertiary opacity-50 animate-pulse py-6 text-center">
            Waiting for monitoring events&hellip;
          </p>
        ) : (
          <div className="space-y-2">
            {events.map((evt, idx) => {
              const { icon: Icon, colorClass, message } = resolveEvent(evt);
              const ts = evt._ts as number | undefined;

              return (
                <div
                  key={`${evt.type}-${ts}-${idx}`}
                  className="flex items-start gap-2"
                >
                  <Icon
                    className={clsx("h-3.5 w-3.5 mt-0.5 shrink-0", colorClass)}
                  />
                  <span className="text-xs text-text-secondary truncate flex-1 min-w-0">
                    {message}
                  </span>
                  <span className="text-[11px] text-text-tertiary whitespace-nowrap shrink-0">
                    {ts ? timeAgo(new Date(ts).toISOString()) : ""}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
