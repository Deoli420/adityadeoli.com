import { useState } from "react";
import { useApiTesterStore, emptyKV } from "@/stores/apiTesterStore.ts";
import type { Collection, SavedRequest, HttpMethod } from "@/types/apiTester.ts";
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  Trash2,
  MoreHorizontal,
  Copy,
} from "lucide-react";
import clsx from "clsx";

interface Props {
  collections: Collection[];
  onDeleteRequest: (requestId: string) => void;
  onDeleteCollection: (collectionId: string) => void;
  onDuplicateRequest: (request: SavedRequest) => void;
}

/** Method color map */
const METHOD_COLORS: Record<string, string> = {
  GET: "text-risk-low",
  POST: "text-risk-medium",
  PUT: "text-drift-new",
  PATCH: "text-ai-purple",
  DELETE: "text-risk-critical",
  HEAD: "text-text-secondary",
  OPTIONS: "text-text-secondary",
};

/**
 * Collections sidebar — tree view of saved requests.
 *
 * Collapsible collection folders with request items.
 * Click request to load it into the editor.
 */
export function CollectionsSidebar({
  collections,
  onDeleteRequest,
  onDeleteCollection,
  onDuplicateRequest,
}: Props) {
  const loadRequest = useApiTesterStore((s) => s.loadRequest);
  const loadedRequestId = useApiTesterStore((s) => s.loadedRequestId);

  if (collections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-text-tertiary">
        <Folder className="h-6 w-6 opacity-30 mb-2" />
        <p className="text-xs">No collections yet</p>
        <p className="text-[10px]">Save a request to create one</p>
      </div>
    );
  }

  function handleLoadRequest(saved: SavedRequest) {
    // Reconstruct a full RequestConfig from saved data
    const req = saved.request;
    loadRequest(
      {
        method: (req.method || "GET") as HttpMethod,
        url: req.url || "",
        params: req.params?.length ? req.params : [emptyKV()],
        headers: req.headers?.length ? req.headers : [emptyKV()],
        auth: req.auth || {
          type: "none",
          bearer: { token: "" },
          basic: { username: "", password: "" },
          apiKey: { key: "X-API-Key", value: "", addTo: "header" },
        },
        body: req.body || {
          type: "none",
          raw: "{\n  \n}",
          formData: [emptyKV()],
          urlEncoded: [emptyKV()],
        },
      },
      saved.id,
    );
  }

  return (
    <div>
      <div className="px-3 py-2 border-b border-border-subtle">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">
          Collections
        </span>
      </div>
      <div className="max-h-[400px] overflow-y-auto">
        {collections.map((collection) => (
          <CollectionFolder
            key={collection.id}
            collection={collection}
            loadedRequestId={loadedRequestId}
            onLoadRequest={handleLoadRequest}
            onDeleteRequest={onDeleteRequest}
            onDeleteCollection={onDeleteCollection}
            onDuplicateRequest={onDuplicateRequest}
          />
        ))}
      </div>
    </div>
  );
}

// ── Collection Folder ───────────────────────────────────────────────────

function CollectionFolder({
  collection,
  loadedRequestId,
  onLoadRequest,
  onDeleteRequest,
  onDeleteCollection,
  onDuplicateRequest,
}: {
  collection: Collection;
  loadedRequestId: string | null;
  onLoadRequest: (r: SavedRequest) => void;
  onDeleteRequest: (id: string) => void;
  onDeleteCollection: (id: string) => void;
  onDuplicateRequest: (r: SavedRequest) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div>
      {/* Folder header */}
      <div className="group flex items-center gap-1 px-3 py-1.5 hover:bg-surface-tertiary/50 transition-colors">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 flex-1 min-w-0 text-left"
        >
          {expanded ? (
            <ChevronDown className="h-3 w-3 text-text-tertiary shrink-0" />
          ) : (
            <ChevronRight className="h-3 w-3 text-text-tertiary shrink-0" />
          )}
          {expanded ? (
            <FolderOpen className="h-3.5 w-3.5 text-risk-medium shrink-0" />
          ) : (
            <Folder className="h-3.5 w-3.5 text-risk-medium shrink-0" />
          )}
          <span className="text-[11px] font-medium text-text-primary truncate">
            {collection.name}
          </span>
          <span className="text-[10px] text-text-tertiary shrink-0">
            ({collection.requests.length})
          </span>
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowMenu(!showMenu)}
            className="p-0.5 rounded text-text-tertiary opacity-0 group-hover:opacity-100 hover:text-text-secondary transition-all"
          >
            <MoreHorizontal className="h-3 w-3" />
          </button>
          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-full z-50 mt-1 w-32 rounded-lg border border-border bg-surface shadow-lg py-1">
                <button
                  onClick={() => {
                    onDeleteCollection(collection.id);
                    setShowMenu(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-risk-critical hover:bg-surface-tertiary transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Requests */}
      {expanded && (
        <div className="ml-3">
          {collection.requests.map((req) => (
            <RequestItem
              key={req.id}
              request={req}
              isActive={loadedRequestId === req.id}
              onLoad={() => onLoadRequest(req)}
              onDelete={() => onDeleteRequest(req.id)}
              onDuplicate={() => onDuplicateRequest(req)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Request Item ────────────────────────────────────────────────────────

function RequestItem({
  request,
  isActive,
  onLoad,
  onDelete,
  onDuplicate,
}: {
  request: SavedRequest;
  isActive: boolean;
  onLoad: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const methodColor =
    METHOD_COLORS[request.request.method] || "text-text-secondary";

  return (
    <div
      className={clsx(
        "group flex items-center gap-2 pl-5 pr-3 py-1.5 cursor-pointer transition-colors",
        isActive
          ? "bg-accent-light border-l-2 border-accent"
          : "hover:bg-surface-tertiary/50 border-l-2 border-transparent",
      )}
    >
      <button
        type="button"
        onClick={onLoad}
        className="flex items-center gap-2 flex-1 min-w-0 text-left"
      >
        <span
          className={clsx(
            "text-[9px] font-bold font-mono w-8 shrink-0",
            methodColor,
          )}
        >
          {request.request.method}
        </span>
        <span className="text-[11px] text-text-primary truncate">
          {request.name}
        </span>
      </button>

      <div className="relative">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className="p-0.5 rounded text-text-tertiary opacity-0 group-hover:opacity-100 hover:text-text-secondary transition-all"
        >
          <MoreHorizontal className="h-3 w-3" />
        </button>
        {showMenu && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowMenu(false)}
            />
            <div className="absolute right-0 top-full z-50 mt-1 w-32 rounded-lg border border-border bg-surface shadow-lg py-1">
              <button
                onClick={() => {
                  onDuplicate();
                  setShowMenu(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-text-secondary hover:bg-surface-tertiary transition-colors"
              >
                <Copy className="h-3 w-3" />
                Duplicate
              </button>
              <button
                onClick={() => {
                  onDelete();
                  setShowMenu(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-risk-critical hover:bg-surface-tertiary transition-colors"
              >
                <Trash2 className="h-3 w-3" />
                Delete
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
