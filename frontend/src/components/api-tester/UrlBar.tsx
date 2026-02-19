import { Send, Loader2, ChevronDown } from "lucide-react";
import { useApiTesterStore } from "@/stores/apiTesterStore.ts";
import type { HttpMethod } from "@/types/apiTester.ts";
import clsx from "clsx";

const METHODS: { value: HttpMethod; color: string }[] = [
  { value: "GET", color: "text-risk-low" },
  { value: "POST", color: "text-risk-medium" },
  { value: "PUT", color: "text-drift-new" },
  { value: "PATCH", color: "text-ai-purple" },
  { value: "DELETE", color: "text-risk-critical" },
  { value: "HEAD", color: "text-text-secondary" },
  { value: "OPTIONS", color: "text-text-secondary" },
];

interface Props {
  onSend: () => void;
}

/**
 * Postman-style URL bar: [METHOD ▾] [URL input                    ] [Send ▶]
 *
 * The method dropdown uses the HTTP method colors.
 * The URL input is a wide monospace field.
 * The Send button pulses indigo when idle, shows spinner when sending.
 */
export function UrlBar({ onSend }: Props) {
  const method = useApiTesterStore((s) => s.request.method);
  const url = useApiTesterStore((s) => s.request.url);
  const sending = useApiTesterStore((s) => s.sending);
  const setMethod = useApiTesterStore((s) => s.setMethod);
  const setUrl = useApiTesterStore((s) => s.setUrl);

  const currentMethodColor =
    METHODS.find((m) => m.value === method)?.color ?? "text-text-primary";

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !sending) {
      e.preventDefault();
      onSend();
    }
  }

  return (
    <div className="flex items-stretch rounded-lg border border-border bg-surface shadow-sm overflow-hidden focus-within:border-accent focus-within:ring-2 focus-within:ring-accent-light transition-all">
      {/* Method Dropdown */}
      <div className="relative flex items-center border-r border-border bg-surface-secondary">
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value as HttpMethod)}
          className={clsx(
            "appearance-none bg-transparent pl-3 pr-7 py-2.5 text-xs font-bold font-mono cursor-pointer outline-none",
            currentMethodColor,
          )}
        >
          {METHODS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.value}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-1.5 h-3 w-3 text-text-tertiary" />
      </div>

      {/* URL Input */}
      <input
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Enter request URL or paste cURL..."
        className="flex-1 bg-transparent px-3 py-2.5 text-sm font-mono text-text-primary placeholder:text-text-tertiary outline-none min-w-0"
        spellCheck={false}
        autoComplete="off"
      />

      {/* Send Button */}
      <button
        type="button"
        onClick={onSend}
        disabled={sending || !url.trim()}
        className={clsx(
          "flex items-center gap-1.5 px-5 text-xs font-semibold text-white transition-all",
          sending
            ? "bg-accent/70 cursor-wait"
            : "bg-accent hover:bg-accent-hover active:scale-[0.98]",
          (!url.trim() && !sending) && "opacity-40 cursor-not-allowed",
        )}
      >
        {sending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Send className="h-3.5 w-3.5" />
        )}
        Send
      </button>
    </div>
  );
}
