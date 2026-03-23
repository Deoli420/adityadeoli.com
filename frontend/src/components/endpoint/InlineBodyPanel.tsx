import type React from "react";
import { Ban, Wand2 } from "lucide-react";
import type { BodyConfig, BodyType } from "@/types/apiTester.ts";
import { KeyValueEditor } from "@/components/api-tester/KeyValueEditor.tsx";
import {
  emptyKV,
  updateKVList,
  toggleKVItem,
  removeKVItem,
} from "@/utils/endpointForm.ts";
import clsx from "clsx";

const BODY_TYPES: { value: BodyType; label: string }[] = [
  { value: "none", label: "none" },
  { value: "json", label: "raw (JSON)" },
  { value: "form-data", label: "form-data" },
  { value: "x-www-form-urlencoded", label: "x-www-form-urlencoded" },
];

interface InlineBodyPanelProps {
  body: BodyConfig;
  setBody: React.Dispatch<React.SetStateAction<BodyConfig>>;
}

export function InlineBodyPanel({ body, setBody }: InlineBodyPanelProps) {
  function handleFormatJson() {
    try {
      const parsed = JSON.parse(body.raw);
      setBody((b) => ({ ...b, raw: JSON.stringify(parsed, null, 2) }));
    } catch {
      // Invalid JSON - leave as-is
    }
  }

  return (
    <div className="space-y-3 p-4">
      {/* Body type selector */}
      <div className="flex items-center gap-1">
        {BODY_TYPES.map((bt) => (
          <button
            key={bt.value}
            type="button"
            onClick={() => setBody((b) => ({ ...b, type: bt.value }))}
            className={clsx(
              "rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-all",
              body.type === bt.value
                ? "bg-accent-light text-accent"
                : "text-text-tertiary hover:text-text-secondary hover:bg-surface-tertiary",
            )}
          >
            {bt.label}
          </button>
        ))}
      </div>

      {body.type === "none" && (
        <div className="flex items-center gap-2 rounded-lg bg-surface-secondary px-3 py-4 text-xs text-text-tertiary">
          <Ban className="h-4 w-4" />
          <span>This request does not have a body.</span>
        </div>
      )}
      {body.type === "none" && (
        <p className="text-[10px] text-text-tertiary mt-1">POST, PUT, and PATCH requests typically need a request body.</p>
      )}

      {body.type === "json" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium text-text-tertiary uppercase tracking-wider">
              JSON
            </span>
            <button
              type="button"
              onClick={handleFormatJson}
              className="flex items-center gap-1 text-[10px] text-text-tertiary hover:text-accent transition-colors"
            >
              <Wand2 className="h-3 w-3" />
              Format
            </button>
          </div>
          <textarea
            value={body.raw}
            onChange={(e) => setBody((b) => ({ ...b, raw: e.target.value }))}
            className="input font-mono text-xs leading-relaxed resize-y"
            rows={8}
            placeholder={'{\n  "key": "value"\n}'}
            spellCheck={false}
          />
        </div>
      )}

      {body.type === "form-data" && (
        <KeyValueEditor
          pairs={body.formData}
          onUpdate={(id, field, val) =>
            setBody((b) => ({
              ...b,
              formData: updateKVList(b.formData, id, field, val),
            }))
          }
          onToggle={(id) =>
            setBody((b) => ({
              ...b,
              formData: toggleKVItem(b.formData, id),
            }))
          }
          onRemove={(id) =>
            setBody((b) => ({
              ...b,
              formData: removeKVItem(b.formData, id),
            }))
          }
          onAdd={() =>
            setBody((b) => ({
              ...b,
              formData: [...b.formData, emptyKV()],
            }))
          }
          keyPlaceholder="Field name"
          valuePlaceholder="Value"
        />
      )}

      {body.type === "x-www-form-urlencoded" && (
        <KeyValueEditor
          pairs={body.urlEncoded}
          onUpdate={(id, field, val) =>
            setBody((b) => ({
              ...b,
              urlEncoded: updateKVList(b.urlEncoded, id, field, val),
            }))
          }
          onToggle={(id) =>
            setBody((b) => ({
              ...b,
              urlEncoded: toggleKVItem(b.urlEncoded, id),
            }))
          }
          onRemove={(id) =>
            setBody((b) => ({
              ...b,
              urlEncoded: removeKVItem(b.urlEncoded, id),
            }))
          }
          onAdd={() =>
            setBody((b) => ({
              ...b,
              urlEncoded: [...b.urlEncoded, emptyKV()],
            }))
          }
          keyPlaceholder="Key"
          valuePlaceholder="Value"
        />
      )}
    </div>
  );
}
