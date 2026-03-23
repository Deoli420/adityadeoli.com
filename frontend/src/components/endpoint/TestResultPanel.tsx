import { useState } from "react";
import {
  Zap,
  Check,
  Copy,
  AlertTriangle,
  ArrowDownToLine,
} from "lucide-react";
import type { ResponseData } from "@/types/apiTester.ts";
import { formatBytes, formatDuration } from "@/services/requestRunner.ts";
import { inferJsonSchema } from "@/utils/jsonSchema.ts";
import clsx from "clsx";

interface TestResultPanelProps {
  response: ResponseData | null;
  sending: boolean;
  onClose: () => void;
  onApplyStatus?: (status: number) => void;
  onCaptureSchema?: (schema: Record<string, unknown>) => void;
  hasExistingSchema?: boolean;
}

export function TestResultPanel({
  response,
  sending,
  onClose,
  onApplyStatus,
  onCaptureSchema,
  hasExistingSchema,
}: TestResultPanelProps) {
  const [responseTab, setResponseTab] = useState<"body" | "headers">("body");
  const [copied, setCopied] = useState(false);

  if (sending) {
    return (
      <div className="rounded-lg border border-border bg-surface overflow-hidden">
        <div className="flex items-center justify-center py-10">
          <div className="flex flex-col items-center gap-2">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            <p className="text-xs text-text-tertiary">Sending request...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!response) return null;

  // Error state
  if (response.error) {
    return (
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="flex items-center justify-between gap-2 border-b border-border bg-risk-critical-bg px-4 py-2.5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5 text-risk-critical" />
            <span className="text-xs font-medium text-risk-critical">
              Request Failed
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[10px] text-text-tertiary hover:text-text-secondary"
          >
            Dismiss
          </button>
        </div>
        <div className="p-4">
          <p className="text-xs text-risk-critical">{response.error}</p>
        </div>
      </div>
    );
  }

  const headerCount = Object.keys(response.headers).length;

  function handleCopy() {
    navigator.clipboard.writeText(response!.body);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      {/* Status bar */}
      <div className="flex items-center gap-3 border-b border-border bg-surface px-4 py-2.5">
        <span
          className={clsx(
            "rounded-md px-2 py-0.5 text-xs font-bold tabular-nums",
            response.status < 300
              ? "bg-risk-low-bg text-risk-low"
              : response.status < 400
                ? "bg-risk-medium-bg text-risk-medium"
                : response.status < 500
                  ? "bg-risk-high-bg text-risk-high"
                  : "bg-risk-critical-bg text-risk-critical",
          )}
        >
          {response.status} {response.statusText}
        </span>

        <div className="flex items-center gap-3 ml-auto text-[10px] text-text-tertiary tabular-nums">
          <span className="flex items-center gap-1">
            <Zap className="h-3 w-3" />
            {formatDuration(response.timing.duration)}
          </span>
          <span className="flex items-center gap-1">
            <ArrowDownToLine className="h-3 w-3" />
            {formatBytes(response.size)}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-text-tertiary hover:text-text-secondary ml-1"
          >
            Dismiss
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-border-subtle bg-surface">
        <button
          type="button"
          onClick={() => setResponseTab("body")}
          className={clsx(
            "relative px-4 py-2 text-xs font-medium transition-colors",
            responseTab === "body"
              ? "text-text-primary"
              : "text-text-tertiary hover:text-text-secondary",
          )}
        >
          Body
          {responseTab === "body" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
          )}
        </button>
        <button
          type="button"
          onClick={() => setResponseTab("headers")}
          className={clsx(
            "relative flex items-center gap-1.5 px-4 py-2 text-xs font-medium transition-colors",
            responseTab === "headers"
              ? "text-text-primary"
              : "text-text-tertiary hover:text-text-secondary",
          )}
        >
          Headers
          {headerCount > 0 && (
            <span
              className={clsx(
                "flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-semibold",
                responseTab === "headers"
                  ? "bg-accent text-white"
                  : "bg-surface-tertiary text-text-tertiary",
              )}
            >
              {headerCount}
            </span>
          )}
          {responseTab === "headers" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
          )}
        </button>
      </div>

      {/* Content */}
      <div className="max-h-[350px] overflow-auto">
        {responseTab === "body" && (
          <div>
            <div className="flex items-center justify-end border-b border-border-subtle bg-surface-secondary/50 px-3 py-1.5">
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1 text-[10px] text-text-tertiary hover:text-text-secondary transition-colors"
              >
                {copied ? (
                  <Check className="h-3 w-3 text-risk-low" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <div className="p-3">
              <pre className="whitespace-pre-wrap break-all font-mono text-xs text-text-primary leading-relaxed">
                {response.body || "(empty response)"}
              </pre>
            </div>
          </div>
        )}
        {responseTab === "headers" && (
          <div className="divide-y divide-border-subtle">
            {Object.entries(response.headers).map(([key, value]) => (
              <div
                key={key}
                className="grid grid-cols-[180px_1fr] gap-2 px-4 py-2"
              >
                <span className="text-xs font-medium text-text-secondary truncate font-mono">
                  {key}
                </span>
                <span className="text-xs text-text-primary break-all font-mono">
                  {value}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action bar for applying test results */}
      {!sending && response && !response.error && response.status > 0 && (onApplyStatus || onCaptureSchema) && (
        <div className="border-t border-border px-4 py-3 flex items-center gap-2">
          <span className="text-[10px] text-text-tertiary">Use this response:</span>
          {onApplyStatus && (
            <button type="button" onClick={() => onApplyStatus(response.status)}
              className="text-[10px] font-medium text-accent hover:underline">
              Set expected status ({response.status})
            </button>
          )}
          {onCaptureSchema && response.body && (
            <button type="button" onClick={() => {
              try { onCaptureSchema(inferJsonSchema(JSON.parse(response.body))); } catch { /* not valid JSON */ }
            }}
              className="text-[10px] font-medium text-accent hover:underline">
              {hasExistingSchema ? "Re-capture schema" : "Capture schema"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
