import { Trash2, Plus } from "lucide-react";
import type { KeyValuePair } from "@/types/apiTester.ts";
import clsx from "clsx";

interface Props {
  pairs: KeyValuePair[];
  onUpdate: (id: string, field: "key" | "value", val: string) => void;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onAdd: () => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
}

/**
 * Postman-style key-value editor with enable/disable toggles.
 *
 * Each row: [checkbox] [key input] [value input] [delete]
 * Plus a ghost "add row" button at the bottom.
 *
 * SDS: Uses border-border-subtle for the table lines, text-xs
 * for compact density, .input-sm for inline inputs.
 */
export function KeyValueEditor({
  pairs,
  onUpdate,
  onToggle,
  onRemove,
  onAdd,
  keyPlaceholder = "Key",
  valuePlaceholder = "Value",
}: Props) {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      {/* Header row */}
      <div className="grid grid-cols-[32px_1fr_1fr_32px] items-center bg-surface-secondary border-b border-border-subtle px-1">
        <div />
        <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">
          Key
        </div>
        <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">
          Value
        </div>
        <div />
      </div>

      {/* Rows */}
      {pairs.map((pair) => (
        <div
          key={pair.id}
          className={clsx(
            "group grid grid-cols-[32px_1fr_1fr_32px] items-center border-b border-border-subtle last:border-b-0 px-1",
            !pair.enabled && "opacity-50",
          )}
        >
          {/* Enable/disable checkbox */}
          <div className="flex items-center justify-center">
            <input
              type="checkbox"
              checked={pair.enabled}
              onChange={() => onToggle(pair.id)}
              className="h-3.5 w-3.5 rounded border-border text-accent focus:ring-accent/30 cursor-pointer"
            />
          </div>

          {/* Key */}
          <input
            type="text"
            value={pair.key}
            onChange={(e) => onUpdate(pair.id, "key", e.target.value)}
            placeholder={keyPlaceholder}
            className="bg-transparent px-2 py-2 text-xs text-text-primary placeholder:text-text-tertiary border-r border-border-subtle outline-none focus:bg-accent-light/30 transition-colors font-mono"
          />

          {/* Value */}
          <input
            type="text"
            value={pair.value}
            onChange={(e) => onUpdate(pair.id, "value", e.target.value)}
            placeholder={valuePlaceholder}
            className="bg-transparent px-2 py-2 text-xs text-text-primary placeholder:text-text-tertiary outline-none focus:bg-accent-light/30 transition-colors font-mono"
          />

          {/* Delete */}
          <button
            type="button"
            onClick={() => onRemove(pair.id)}
            className="flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-text-tertiary hover:text-risk-critical"
            aria-label="Remove row"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      ))}

      {/* Add row */}
      <button
        type="button"
        onClick={onAdd}
        className="flex w-full items-center gap-1.5 px-3 py-2 text-[11px] text-text-tertiary hover:text-accent hover:bg-accent-light/30 transition-colors"
      >
        <Plus className="h-3 w-3" />
        Add row
      </button>
    </div>
  );
}
