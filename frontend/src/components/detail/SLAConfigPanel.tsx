import { useState } from "react";
import {
  Shield,
  Settings,
  Loader2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import {
  useEndpointSLA,
  useEndpointUptime,
  useCreateSLA,
  useUpdateSLA,
  useDeleteSLA,
} from "@/hooks/useSLA.ts";
import { Skeleton } from "@/components/common/Skeleton.tsx";
import clsx from "clsx";

interface SLAConfigPanelProps {
  endpointId: string;
}

/**
 * SLA configuration + uptime display for the endpoint detail page.
 *
 * States:
 *   1. No SLA configured → "Configure SLA" CTA
 *   2. SLA active → Uptime progress bar + edit modal
 */
export function SLAConfigPanel({ endpointId }: SLAConfigPanelProps) {
  const { data: sla, isLoading: slaLoading, isError: slaError } = useEndpointSLA(endpointId);
  const { data: uptime } = useEndpointUptime(endpointId);
  const createSLA = useCreateSLA();
  const updateSLA = useUpdateSLA(endpointId);
  const deleteSLA = useDeleteSLA(endpointId);
  const [showEdit, setShowEdit] = useState(false);
  const [target, setTarget] = useState(99.9);
  const [window, setWindow] = useState<"24h" | "7d" | "30d">("24h");

  if (slaLoading) {
    return (
      <div className="card p-5">
        <h3 className="text-sm font-medium text-text-primary mb-3">
          SLA &amp; Uptime
        </h3>
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  // No SLA configured — show setup CTA
  if (slaError || !sla) {
    return (
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-text-primary">
            SLA &amp; Uptime
          </h3>
        </div>
        {!showEdit ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Shield className="h-8 w-8 text-text-tertiary/50 mb-2" />
            <p className="text-xs text-text-tertiary mb-3">
              No SLA target configured for this endpoint.
            </p>
            <button
              className="btn-primary"
              onClick={() => {
                setTarget(99.9);
                setWindow("24h");
                setShowEdit(true);
              }}
            >
              <Settings className="h-3.5 w-3.5" />
              Configure SLA
            </button>
          </div>
        ) : (
          <SLAForm
            target={target}
            setTarget={setTarget}
            window={window}
            setWindow={setWindow}
            isPending={createSLA.isPending}
            onSave={() => {
              createSLA.mutate(
                {
                  endpoint_id: endpointId,
                  sla_target_percent: target,
                  uptime_window: window,
                },
                { onSuccess: () => setShowEdit(false) },
              );
            }}
            onCancel={() => setShowEdit(false)}
          />
        )}
      </div>
    );
  }

  // SLA configured — show uptime + edit
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-text-primary">
          SLA &amp; Uptime
        </h3>
        <div className="flex items-center gap-1.5">
          <button
            className="btn-secondary !px-2 !py-1"
            onClick={() => {
              setTarget(sla.sla_target_percent);
              setWindow(sla.uptime_window as "24h" | "7d" | "30d");
              setShowEdit(true);
            }}
          >
            <Settings className="h-3 w-3" />
          </button>
          <button
            className="btn-secondary !px-2 !py-1 !text-risk-critical hover:!bg-risk-critical-bg"
            disabled={deleteSLA.isPending}
            onClick={() => deleteSLA.mutate()}
          >
            {deleteSLA.isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Trash2 className="h-3 w-3" />
            )}
          </button>
        </div>
      </div>

      {showEdit ? (
        <SLAForm
          target={target}
          setTarget={setTarget}
          window={window}
          setWindow={setWindow}
          isPending={updateSLA.isPending}
          onSave={() => {
            updateSLA.mutate(
              {
                sla_target_percent: target,
                uptime_window: window,
              },
              { onSuccess: () => setShowEdit(false) },
            );
          }}
          onCancel={() => setShowEdit(false)}
        />
      ) : (
        <>
          {/* Uptime display */}
          {uptime ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {uptime.is_breached ? (
                    <AlertTriangle className="h-4 w-4 text-risk-critical" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-risk-low" />
                  )}
                  <span
                    className={clsx(
                      "text-xl font-semibold tabular-nums",
                      uptime.is_breached ? "text-risk-critical" : "text-risk-low",
                    )}
                  >
                    {uptime.uptime_percent.toFixed(2)}%
                  </span>
                </div>
                <span className="text-[11px] text-text-tertiary">
                  {uptime.window} window
                </span>
              </div>
              {/* Progress bar */}
              <div className="relative h-2.5 w-full rounded-full bg-surface-tertiary overflow-hidden">
                <div
                  className={clsx(
                    "h-full rounded-full transition-all",
                    uptime.is_breached ? "bg-risk-critical" : "bg-risk-low",
                  )}
                  style={{
                    width: `${Math.min(uptime.uptime_percent, 100)}%`,
                  }}
                />
                <div
                  className="absolute top-0 h-full w-0.5 bg-text-secondary"
                  style={{ left: `${uptime.sla_target}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-text-tertiary">
                  Target: {uptime.sla_target}%
                </span>
                <span className="text-text-tertiary tabular-nums">
                  {uptime.successful_runs}/{uptime.total_runs} successful
                </span>
              </div>
              {uptime.is_breached && (
                <div className="rounded-lg bg-risk-critical-bg border border-risk-critical/20 px-3 py-2">
                  <p className="text-[11px] text-risk-critical font-medium">
                    SLA breach detected — uptime is{" "}
                    {(uptime.sla_target - uptime.uptime_percent).toFixed(2)}%
                    below target.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-xs text-text-tertiary">
                SLA target: {sla.sla_target_percent}% ({sla.uptime_window})
              </p>
              <p className="text-[11px] text-text-tertiary mt-0.5">
                Uptime will be calculated after monitoring runs.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ── Shared form ─────────────────────────────────────────────────────────── */

function SLAForm({
  target,
  setTarget,
  window: win,
  setWindow,
  isPending,
  onSave,
  onCancel,
}: {
  target: number;
  setTarget: (v: number) => void;
  window: string;
  setWindow: (v: "24h" | "7d" | "30d") => void;
  isPending: boolean;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-[11px] font-medium text-text-secondary block mb-1">
          Uptime Target (%)
        </label>
        <input
          type="number"
          min={0}
          max={100}
          step={0.1}
          value={target}
          onChange={(e) => setTarget(parseFloat(e.target.value) || 0)}
          className="input h-8 w-full text-xs"
        />
      </div>
      <div>
        <label className="text-[11px] font-medium text-text-secondary block mb-1">
          Window
        </label>
        <div className="flex items-center gap-1">
          {(["24h", "7d", "30d"] as const).map((w) => (
            <button
              key={w}
              onClick={() => setWindow(w)}
              className={clsx(
                "px-3 py-1 text-xs rounded-md transition-colors",
                win === w
                  ? "bg-accent text-white"
                  : "bg-surface-tertiary text-text-secondary hover:text-text-primary",
              )}
            >
              {w}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-end gap-2 pt-1">
        <button className="btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button className="btn-primary" disabled={isPending} onClick={onSave}>
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            "Save"
          )}
        </button>
      </div>
    </div>
  );
}
