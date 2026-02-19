import { useState } from "react";
import { X, Copy, Check, Terminal, Import } from "lucide-react";
import { parseCurl } from "@/utils/parseCurl.ts";
import { exportCurl } from "@/services/requestRunner.ts";
import { useApiTesterStore, uid, emptyKV } from "@/stores/apiTesterStore.ts";
import type { HttpMethod, KeyValuePair } from "@/types/apiTester.ts";

interface Props {
  mode: "import" | "export";
  onClose: () => void;
}

/**
 * Modal for cURL import/export.
 *
 * Import mode: textarea → parse → populate store
 * Export mode: read-only textarea showing the generated cURL command
 */
export function CurlModal({ mode, onClose }: Props) {
  const request = useApiTesterStore((s) => s.request);
  const loadRequest = useApiTesterStore((s) => s.loadRequest);
  const [curlInput, setCurlInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const curlExport = mode === "export" ? exportCurl(request) : "";

  function handleImport() {
    setError(null);
    try {
      const parsed = parseCurl(curlInput);

      // Convert parsed headers to KeyValuePair[]
      const headers: KeyValuePair[] = Object.entries(parsed.headers).map(
        ([key, value]) => ({ id: uid(), key, value, enabled: true }),
      );
      if (headers.length === 0) headers.push(emptyKV());

      loadRequest({
        method: (parsed.method as HttpMethod) || "GET",
        url: parsed.url,
        params: [emptyKV()],
        headers,
        auth: {
          type: "none",
          bearer: { token: "" },
          basic: { username: "", password: "" },
          apiKey: { key: "X-API-Key", value: "", addTo: "header" },
        },
        body: parsed.body
          ? {
              type: "json",
              raw: parsed.body,
              formData: [emptyKV()],
              urlEncoded: [emptyKV()],
            }
          : {
              type: "none",
              raw: "{\n  \n}",
              formData: [emptyKV()],
              urlEncoded: [emptyKV()],
            },
      });

      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to parse cURL command",
      );
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(curlExport);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="card w-full max-w-lg mx-4 overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-accent" />
            <h3 className="text-sm font-semibold text-text-primary">
              {mode === "import" ? "Import cURL" : "Export as cURL"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-text-tertiary hover:text-text-primary hover:bg-surface-tertiary transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3">
          {mode === "import" ? (
            <>
              <textarea
                value={curlInput}
                onChange={(e) => {
                  setCurlInput(e.target.value);
                  setError(null);
                }}
                placeholder={`curl -X GET 'https://api.example.com/v1/users' \\
  -H 'Authorization: Bearer token' \\
  -H 'Accept: application/json'`}
                className="input font-mono text-xs leading-relaxed resize-none"
                rows={8}
                spellCheck={false}
                autoFocus
              />
              {error && (
                <p className="text-xs text-risk-critical">{error}</p>
              )}
            </>
          ) : (
            <div className="relative">
              <pre className="rounded-lg bg-slate-900 p-4 text-xs text-slate-100 font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap">
                {curlExport || "// Build a request first"}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-border px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary px-3 py-1.5 text-xs"
          >
            Cancel
          </button>
          {mode === "import" ? (
            <button
              type="button"
              onClick={handleImport}
              disabled={!curlInput.trim()}
              className="btn-primary px-3 py-1.5 text-xs gap-1.5"
            >
              <Import className="h-3.5 w-3.5" />
              Import
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCopy}
              className="btn-primary px-3 py-1.5 text-xs gap-1.5"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              {copied ? "Copied!" : "Copy to Clipboard"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
