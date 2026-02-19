import { useState } from "react";
import { useApiTesterStore } from "@/stores/apiTesterStore.ts";
import {
  formatBytes,
  formatDuration,
} from "@/services/requestRunner.ts";
import {
  Copy,
  Check,
  ChevronRight,
  ChevronDown,
  AlertTriangle,
  Zap,
  ArrowDownToLine,
} from "lucide-react";
import clsx from "clsx";

/**
 * Response display panel.
 *
 * Shows: Status badge | Duration | Size
 * Tabs: Body | Headers
 * Body: Pretty (collapsible JSON tree) / Raw toggle.
 *
 * SDS: Uses risk-palette for status codes, monospace for body,
 * subtle background for the response area.
 */
export function ResponsePanel() {
  const response = useApiTesterStore((s) => s.response);
  const sending = useApiTesterStore((s) => s.sending);
  const responseTab = useApiTesterStore((s) => s.responseTab);
  const setResponseTab = useApiTesterStore((s) => s.setResponseTab);

  if (sending) {
    return (
      <div className="card flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <p className="text-xs text-text-tertiary">Sending request...</p>
        </div>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="card flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-2 text-text-tertiary">
          <Zap className="h-8 w-8 opacity-30" />
          <p className="text-xs">Send a request to see the response</p>
          <p className="text-[10px]">Hit Send or press Enter in the URL bar</p>
        </div>
      </div>
    );
  }

  // Error state
  if (response.error) {
    return (
      <div className="card overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border bg-risk-critical-bg px-4 py-2.5">
          <AlertTriangle className="h-3.5 w-3.5 text-risk-critical" />
          <span className="text-xs font-medium text-risk-critical">
            Request Failed
          </span>
          <span className="ml-auto text-[10px] text-text-tertiary tabular-nums">
            {formatDuration(response.timing.duration)}
          </span>
        </div>
        <div className="p-4">
          <p className="text-xs text-risk-critical">{response.error}</p>
        </div>
      </div>
    );
  }

  const headerCount = Object.keys(response.headers).length;

  return (
    <div className="card overflow-hidden">
      {/* Status bar */}
      <div className="flex items-center gap-3 border-b border-border bg-surface px-4 py-2.5">
        {/* Status badge */}
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

        {/* Metrics */}
        <div className="flex items-center gap-3 ml-auto text-[10px] text-text-tertiary tabular-nums">
          <span className="flex items-center gap-1">
            <Zap className="h-3 w-3" />
            {formatDuration(response.timing.duration)}
          </span>
          <span className="flex items-center gap-1">
            <ArrowDownToLine className="h-3 w-3" />
            {formatBytes(response.size)}
          </span>
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
      <div className="max-h-[500px] overflow-auto">
        {responseTab === "body" && <ResponseBody body={response.body} />}
        {responseTab === "headers" && (
          <ResponseHeaders headers={response.headers} />
        )}
      </div>
    </div>
  );
}

// ── Response Body ───────────────────────────────────────────────────────

function ResponseBody({ body }: { body: string }) {
  const [mode, setMode] = useState<"pretty" | "raw">("pretty");
  const [copied, setCopied] = useState(false);

  // Try to parse as JSON for pretty view
  let parsedJson: unknown = null;
  let isJson = false;
  try {
    parsedJson = JSON.parse(body);
    isJson = true;
  } catch {
    // Not JSON
  }

  function handleCopy() {
    navigator.clipboard.writeText(body);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-border-subtle bg-surface-secondary/50 px-3 py-1.5">
        <div className="flex items-center gap-1">
          {isJson && (
            <>
              <button
                type="button"
                onClick={() => setMode("pretty")}
                className={clsx(
                  "rounded px-2 py-1 text-[10px] font-medium transition-colors",
                  mode === "pretty"
                    ? "bg-surface text-text-primary shadow-sm"
                    : "text-text-tertiary hover:text-text-secondary",
                )}
              >
                Pretty
              </button>
              <button
                type="button"
                onClick={() => setMode("raw")}
                className={clsx(
                  "rounded px-2 py-1 text-[10px] font-medium transition-colors",
                  mode === "raw"
                    ? "bg-surface text-text-primary shadow-sm"
                    : "text-text-tertiary hover:text-text-secondary",
                )}
              >
                Raw
              </button>
            </>
          )}
        </div>

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

      {/* Body content */}
      <div className="p-3">
        {isJson && mode === "pretty" ? (
          <JsonTree data={parsedJson} />
        ) : (
          <pre className="whitespace-pre-wrap break-all font-mono text-xs text-text-primary leading-relaxed">
            {body || "(empty response)"}
          </pre>
        )}
      </div>
    </div>
  );
}

// ── JSON Tree Viewer ────────────────────────────────────────────────────

function JsonTree({ data }: { data: unknown }) {
  return (
    <div className="font-mono text-xs leading-relaxed">
      <JsonNode data={data} depth={0} />
    </div>
  );
}

function JsonNode({
  data,
  depth,
  keyName,
}: {
  data: unknown;
  depth: number;
  keyName?: string;
}) {
  const [collapsed, setCollapsed] = useState(depth > 2);

  if (data === null) {
    return (
      <span>
        {keyName !== undefined && (
          <span className="text-ai-purple">{`"${keyName}"`}: </span>
        )}
        <span className="text-text-tertiary italic">null</span>
      </span>
    );
  }

  if (typeof data === "boolean") {
    return (
      <span>
        {keyName !== undefined && (
          <span className="text-ai-purple">{`"${keyName}"`}: </span>
        )}
        <span className="text-risk-medium">{data.toString()}</span>
      </span>
    );
  }

  if (typeof data === "number") {
    return (
      <span>
        {keyName !== undefined && (
          <span className="text-ai-purple">{`"${keyName}"`}: </span>
        )}
        <span className="text-drift-new">{data}</span>
      </span>
    );
  }

  if (typeof data === "string") {
    return (
      <span>
        {keyName !== undefined && (
          <span className="text-ai-purple">{`"${keyName}"`}: </span>
        )}
        <span className="text-risk-low">{`"${data}"`}</span>
      </span>
    );
  }

  if (Array.isArray(data)) {
    if (data.length === 0) {
      return (
        <span>
          {keyName !== undefined && (
            <span className="text-ai-purple">{`"${keyName}"`}: </span>
          )}
          <span className="text-text-tertiary">[]</span>
        </span>
      );
    }

    return (
      <div>
        <span
          className="cursor-pointer select-none inline-flex items-center gap-0.5"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <ChevronRight className="inline h-3 w-3 text-text-tertiary" />
          ) : (
            <ChevronDown className="inline h-3 w-3 text-text-tertiary" />
          )}
          {keyName !== undefined && (
            <span className="text-ai-purple">{`"${keyName}"`}: </span>
          )}
          <span className="text-text-primary">[</span>
          {collapsed && (
            <span className="text-text-tertiary text-[10px]">
              {" "}
              {data.length} items{" "}
            </span>
          )}
          {collapsed && <span className="text-text-primary">]</span>}
        </span>
        {!collapsed && (
          <>
            <div style={{ paddingLeft: 16 }}>
              {data.map((item, i) => (
                <div key={i}>
                  <JsonNode data={item} depth={depth + 1} />
                  {i < data.length - 1 && (
                    <span className="text-text-tertiary">,</span>
                  )}
                </div>
              ))}
            </div>
            <span className="text-text-primary">]</span>
          </>
        )}
      </div>
    );
  }

  if (typeof data === "object") {
    const entries = Object.entries(data as Record<string, unknown>);
    if (entries.length === 0) {
      return (
        <span>
          {keyName !== undefined && (
            <span className="text-ai-purple">{`"${keyName}"`}: </span>
          )}
          <span className="text-text-tertiary">{"{}"}</span>
        </span>
      );
    }

    return (
      <div>
        <span
          className="cursor-pointer select-none inline-flex items-center gap-0.5"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <ChevronRight className="inline h-3 w-3 text-text-tertiary" />
          ) : (
            <ChevronDown className="inline h-3 w-3 text-text-tertiary" />
          )}
          {keyName !== undefined && (
            <span className="text-ai-purple">{`"${keyName}"`}: </span>
          )}
          <span className="text-text-primary">{"{"}</span>
          {collapsed && (
            <span className="text-text-tertiary text-[10px]">
              {" "}
              {entries.length} keys{" "}
            </span>
          )}
          {collapsed && <span className="text-text-primary">{"}"}</span>}
        </span>
        {!collapsed && (
          <>
            <div style={{ paddingLeft: 16 }}>
              {entries.map(([key, value], i) => (
                <div key={key}>
                  <JsonNode
                    data={value}
                    depth={depth + 1}
                    keyName={key}
                  />
                  {i < entries.length - 1 && (
                    <span className="text-text-tertiary">,</span>
                  )}
                </div>
              ))}
            </div>
            <span className="text-text-primary">{"}"}</span>
          </>
        )}
      </div>
    );
  }

  return <span className="text-text-primary">{String(data)}</span>;
}

// ── Response Headers ────────────────────────────────────────────────────

function ResponseHeaders({ headers }: { headers: Record<string, string> }) {
  const entries = Object.entries(headers);

  if (entries.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-xs text-text-tertiary">
        No headers in response
      </div>
    );
  }

  return (
    <div className="divide-y divide-border-subtle">
      {entries.map(([key, value]) => (
        <div
          key={key}
          className="grid grid-cols-[200px_1fr] gap-2 px-4 py-2"
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
  );
}
