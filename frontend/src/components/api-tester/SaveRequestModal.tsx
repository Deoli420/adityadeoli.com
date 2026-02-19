import { useState } from "react";
import { X, Save, FolderPlus } from "lucide-react";
import { useApiTesterStore } from "@/stores/apiTesterStore.ts";
import type { Collection } from "@/types/apiTester.ts";

interface Props {
  collections: Collection[];
  onSave: (collectionId: string, name: string) => void;
  onCreateCollection: (name: string) => Promise<Collection>;
  onClose: () => void;
}

/**
 * Modal to save current request to a collection.
 *
 * Select existing collection or create new one.
 * Enter request name and save.
 */
export function SaveRequestModal({
  collections,
  onSave,
  onCreateCollection,
  onClose,
}: Props) {
  const request = useApiTesterStore((s) => s.request);

  const [name, setName] = useState(() => {
    try {
      const u = new URL(
        request.url.startsWith("http")
          ? request.url
          : "https://" + request.url,
      );
      return `${request.method} ${u.pathname}`;
    } catch {
      return `${request.method} Request`;
    }
  });

  const [selectedCollection, setSelectedCollection] = useState(
    collections[0]?.id ?? "",
  );
  const [showNewCollection, setShowNewCollection] = useState(
    collections.length === 0,
  );
  const [newCollectionName, setNewCollectionName] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);

    try {
      let collId = selectedCollection;

      // Create new collection if needed
      if (showNewCollection && newCollectionName.trim()) {
        const newColl = await onCreateCollection(newCollectionName.trim());
        collId = newColl.id;
      }

      if (!collId) return;
      onSave(collId, name.trim());
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="card w-full max-w-sm mx-4 overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <Save className="h-4 w-4 text-accent" />
            <h3 className="text-sm font-semibold text-text-primary">
              Save Request
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
        <div className="p-4 space-y-4">
          {/* Request name */}
          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-text-tertiary uppercase tracking-wider">
              Request Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input text-xs"
              placeholder="GET /api/users"
              autoFocus
            />
          </div>

          {/* Collection selector */}
          {!showNewCollection && collections.length > 0 ? (
            <div>
              <label className="mb-1.5 block text-[11px] font-medium text-text-tertiary uppercase tracking-wider">
                Collection
              </label>
              <select
                value={selectedCollection}
                onChange={(e) => setSelectedCollection(e.target.value)}
                className="input text-xs"
              >
                {collections.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowNewCollection(true)}
                className="mt-2 flex items-center gap-1 text-[10px] text-accent hover:text-accent-hover transition-colors"
              >
                <FolderPlus className="h-3 w-3" />
                New collection
              </button>
            </div>
          ) : (
            <div>
              <label className="mb-1.5 block text-[11px] font-medium text-text-tertiary uppercase tracking-wider">
                New Collection Name
              </label>
              <input
                type="text"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                className="input text-xs"
                placeholder="My API Collection"
              />
              {collections.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowNewCollection(false)}
                  className="mt-2 text-[10px] text-text-tertiary hover:text-text-secondary transition-colors"
                >
                  Use existing collection
                </button>
              )}
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
          <button
            type="button"
            onClick={handleSave}
            disabled={
              saving ||
              !name.trim() ||
              (!selectedCollection && !newCollectionName.trim())
            }
            className="btn-primary px-3 py-1.5 text-xs gap-1.5"
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
