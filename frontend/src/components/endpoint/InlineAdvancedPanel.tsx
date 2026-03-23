import type React from "react";
import type { AdvancedConfig } from "@/types/index.ts";

interface InlineAdvancedPanelProps {
  config: AdvancedConfig;
  setConfig: React.Dispatch<React.SetStateAction<AdvancedConfig>>;
}

export function InlineAdvancedPanel({
  config,
  setConfig,
}: InlineAdvancedPanelProps) {
  return (
    <div className="space-y-4 p-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-[11px] font-medium text-text-tertiary uppercase tracking-wider">
            Timeout (ms)
          </label>
          <input
            type="number"
            min={1000}
            max={120000}
            value={config.timeout_ms}
            onChange={(e) =>
              setConfig((c) => ({
                ...c,
                timeout_ms: parseInt(e.target.value, 10) || 30000,
              }))
            }
            className="input font-mono text-xs tabular-nums"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[11px] font-medium text-text-tertiary uppercase tracking-wider">
            Retries
          </label>
          <input
            type="number"
            min={0}
            max={5}
            value={config.retries}
            onChange={(e) =>
              setConfig((c) => ({
                ...c,
                retries: parseInt(e.target.value, 10) || 0,
              }))
            }
            className="input font-mono text-xs tabular-nums"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-[11px] font-medium text-text-tertiary uppercase tracking-wider">
            Retry Delay (ms)
          </label>
          <input
            type="number"
            min={0}
            max={30000}
            value={config.retry_delay_ms}
            onChange={(e) =>
              setConfig((c) => ({
                ...c,
                retry_delay_ms: parseInt(e.target.value, 10) || 1000,
              }))
            }
            className="input font-mono text-xs tabular-nums"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[11px] font-medium text-text-tertiary uppercase tracking-wider">
            Expected Response (ms)
          </label>
          <input
            type="number"
            min={0}
            max={120000}
            value={config.expected_response_time_ms ?? ""}
            onChange={(e) => {
              const val = e.target.value;
              setConfig((c) => ({
                ...c,
                expected_response_time_ms: val ? parseInt(val, 10) : null,
              }));
            }}
            placeholder="Optional"
            className="input font-mono text-xs tabular-nums"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="follow-redirects"
          checked={config.follow_redirects}
          onChange={(e) =>
            setConfig((c) => ({
              ...c,
              follow_redirects: e.target.checked,
            }))
          }
          className="h-3.5 w-3.5 rounded border-border text-accent focus:ring-accent/30 cursor-pointer"
        />
        <label
          htmlFor="follow-redirects"
          className="text-xs text-text-secondary cursor-pointer"
        >
          Follow redirects automatically
        </label>
      </div>
    </div>
  );
}
