import { useApiTesterStore } from "@/stores/apiTesterStore.ts";
import { KeyValueEditor } from "./KeyValueEditor.tsx";
import type { BodyType } from "@/types/apiTester.ts";
import { Ban, Wand2 } from "lucide-react";
import clsx from "clsx";

const BODY_TYPES: { value: BodyType; label: string }[] = [
  { value: "none", label: "none" },
  { value: "json", label: "raw (JSON)" },
  { value: "form-data", label: "form-data" },
  { value: "x-www-form-urlencoded", label: "x-www-form-urlencoded" },
];

/**
 * Body configuration panel.
 *
 * Radio-style selector for body type, then type-specific editor.
 * JSON mode: monospace textarea with format button.
 * Form modes: KeyValueEditor.
 */
export function BodyPanel() {
  const body = useApiTesterStore((s) => s.request.body);
  const setBodyType = useApiTesterStore((s) => s.setBodyType);
  const setRawBody = useApiTesterStore((s) => s.setRawBody);

  // Form-data actions
  const addFormData = useApiTesterStore((s) => s.addFormData);
  const updateFormData = useApiTesterStore((s) => s.updateFormData);
  const toggleFormData = useApiTesterStore((s) => s.toggleFormData);
  const removeFormData = useApiTesterStore((s) => s.removeFormData);

  // URL-encoded actions
  const addUrlEncoded = useApiTesterStore((s) => s.addUrlEncoded);
  const updateUrlEncoded = useApiTesterStore((s) => s.updateUrlEncoded);
  const toggleUrlEncoded = useApiTesterStore((s) => s.toggleUrlEncoded);
  const removeUrlEncoded = useApiTesterStore((s) => s.removeUrlEncoded);

  function handleFormatJson() {
    try {
      const parsed = JSON.parse(body.raw);
      setRawBody(JSON.stringify(parsed, null, 2));
    } catch {
      // Invalid JSON — leave as-is
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
            onClick={() => setBodyType(bt.value)}
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

      {/* Body content */}
      {body.type === "none" && (
        <div className="flex items-center gap-2 rounded-lg bg-surface-secondary px-3 py-4 text-xs text-text-tertiary">
          <Ban className="h-4 w-4" />
          <span>This request does not have a body.</span>
        </div>
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
            onChange={(e) => setRawBody(e.target.value)}
            className="input font-mono text-xs leading-relaxed resize-y"
            rows={10}
            placeholder='{\n  "key": "value"\n}'
            spellCheck={false}
          />
        </div>
      )}

      {body.type === "form-data" && (
        <KeyValueEditor
          pairs={body.formData}
          onUpdate={updateFormData}
          onToggle={toggleFormData}
          onRemove={removeFormData}
          onAdd={addFormData}
          keyPlaceholder="Field name"
          valuePlaceholder="Value"
        />
      )}

      {body.type === "x-www-form-urlencoded" && (
        <KeyValueEditor
          pairs={body.urlEncoded}
          onUpdate={updateUrlEncoded}
          onToggle={toggleUrlEncoded}
          onRemove={removeUrlEncoded}
          onAdd={addUrlEncoded}
          keyPlaceholder="Key"
          valuePlaceholder="Value"
        />
      )}
    </div>
  );
}
