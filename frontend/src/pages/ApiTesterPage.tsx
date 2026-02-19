import { useState, useCallback } from "react";
import { UrlBar } from "@/components/api-tester/UrlBar.tsx";
import { RequestPanel } from "@/components/api-tester/RequestPanel.tsx";
import { ResponsePanel } from "@/components/api-tester/ResponsePanel.tsx";
import { HistoryPanel } from "@/components/api-tester/HistoryPanel.tsx";
import { CollectionsSidebar } from "@/components/api-tester/CollectionsSidebar.tsx";
import { CurlModal } from "@/components/api-tester/CurlModal.tsx";
import { SaveRequestModal } from "@/components/api-tester/SaveRequestModal.tsx";
import { useApiTesterStore, uid } from "@/stores/apiTesterStore.ts";
import { proxyRequest } from "@/services/requestRunner.ts";
import type {
  Collection,
  SavedRequest,
  HistoryEntry,
} from "@/types/apiTester.ts";
import {
  Save,
  Import,
  FileUp,
  Clock,
  FolderOpen,
  Plus,
} from "lucide-react";
import toast from "react-hot-toast";
import clsx from "clsx";

/**
 * Postman-like API tester page.
 *
 * Layout:
 *   ┌────────────────────────────────────────────────────────────┐
 *   │  Toolbar: [New] [Save] [Import cURL] [Export cURL]        │
 *   │  ┌────────────────────────────────────────────────────────┐│
 *   │  │  [METHOD ▾] [URL ...............]  [Send ▶]            ││
 *   │  └────────────────────────────────────────────────────────┘│
 *   │  ┌───────────────────────────┐ ┌──────────────────────────┐│
 *   │  │  Request Tabs             │ │ Collections / History    ││
 *   │  │  Params|Auth|Headers|Body │ │ ┌─ Collections ─────────┐││
 *   │  │                           │ │ │ > Folder 1            │││
 *   │  │                           │ │ │   GET /users          │││
 *   │  │                           │ │ ├─ History ─────────────┤││
 *   │  │                           │ │ │   POST /api → 201     │││
 *   │  └───────────────────────────┘ └──────────────────────────┘│
 *   │  ┌────────────────────────────────────────────────────────┐│
 *   │  │  Response Panel                                        ││
 *   │  │  [200 OK]  158ms  2.3KB                                ││
 *   │  │  Body | Headers                                        ││
 *   │  │  { "data": [...] }                                     ││
 *   │  └────────────────────────────────────────────────────────┘│
 *   └────────────────────────────────────────────────────────────┘
 */
export function ApiTesterPage() {
  const request = useApiTesterStore((s) => s.request);
  const setSending = useApiTesterStore((s) => s.setSending);
  const setResponse = useApiTesterStore((s) => s.setResponse);
  const addHistory = useApiTesterStore((s) => s.addHistory);
  const resetRequest = useApiTesterStore((s) => s.resetRequest);

  // Modals
  const [curlMode, setCurlMode] = useState<"import" | "export" | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);

  // Side panel
  const [sidePanel, setSidePanel] = useState<"collections" | "history">(
    "collections",
  );

  // Collections (client-side state for now, backend integration later)
  const [collections, setCollections] = useState<Collection[]>(() => {
    try {
      const stored = localStorage.getItem("sentinel_collections");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  function persistCollections(colls: Collection[]) {
    setCollections(colls);
    localStorage.setItem("sentinel_collections", JSON.stringify(colls));
  }

  // ── Send Request ──────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    if (!request.url.trim()) {
      toast.error("Enter a URL first");
      return;
    }

    setSending(true);
    setResponse(null);

    try {
      const response = await proxyRequest(request);
      setResponse(response);

      // Add to history
      const entry: HistoryEntry = {
        id: uid(),
        method: request.method,
        url: request.url,
        status: response.status,
        duration: response.timing.duration,
        timestamp: Date.now(),
        request: structuredClone(request),
      };
      addHistory(entry);

      if (response.error) {
        toast.error("Request failed");
      }
    } catch (err) {
      toast.error("Failed to send request");
    } finally {
      setSending(false);
    }
  }, [request, setSending, setResponse, addHistory]);

  // ── Save Request ──────────────────────────────────────────────
  function handleSaveRequest(collectionId: string, name: string) {
    const saved: SavedRequest = {
      id: uid(),
      collection_id: collectionId,
      name,
      request: structuredClone(request),
      sort_order: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updated = collections.map((c) => {
      if (c.id === collectionId) {
        return { ...c, requests: [...c.requests, saved] };
      }
      return c;
    });

    persistCollections(updated);
    setShowSaveModal(false);
    toast.success("Request saved");
  }

  async function handleCreateCollection(name: string): Promise<Collection> {
    const newColl: Collection = {
      id: uid(),
      name,
      requests: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    persistCollections([...collections, newColl]);
    return newColl;
  }

  function handleDeleteRequest(requestId: string) {
    const updated = collections.map((c) => ({
      ...c,
      requests: c.requests.filter((r) => r.id !== requestId),
    }));
    persistCollections(updated);
    toast.success("Request deleted");
  }

  function handleDeleteCollection(collectionId: string) {
    persistCollections(collections.filter((c) => c.id !== collectionId));
    toast.success("Collection deleted");
  }

  function handleDuplicateRequest(saved: SavedRequest) {
    const duplicate: SavedRequest = {
      ...saved,
      id: uid(),
      name: `${saved.name} (copy)`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updated = collections.map((c) => {
      if (c.id === saved.collection_id) {
        return { ...c, requests: [...c.requests, duplicate] };
      }
      return c;
    });

    persistCollections(updated);
    toast.success("Request duplicated");
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={resetRequest}
            className="btn-secondary px-2.5 py-1.5 text-[11px] gap-1.5"
          >
            <Plus className="h-3 w-3" />
            New
          </button>
          <button
            type="button"
            onClick={() => setShowSaveModal(true)}
            disabled={!request.url.trim()}
            className="btn-secondary px-2.5 py-1.5 text-[11px] gap-1.5"
          >
            <Save className="h-3 w-3" />
            Save
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCurlMode("import")}
            className="btn-secondary px-2.5 py-1.5 text-[11px] gap-1.5"
          >
            <Import className="h-3 w-3" />
            Import cURL
          </button>
          <button
            type="button"
            onClick={() => setCurlMode("export")}
            disabled={!request.url.trim()}
            className="btn-secondary px-2.5 py-1.5 text-[11px] gap-1.5"
          >
            <FileUp className="h-3 w-3" />
            Export cURL
          </button>
        </div>
      </div>

      {/* URL Bar */}
      <UrlBar onSend={handleSend} />

      {/* Main content area */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
        {/* Left: Request + Response */}
        <div className="space-y-4 min-w-0">
          <RequestPanel />
          <ResponsePanel />
        </div>

        {/* Right: Collections + History */}
        <div className="card overflow-hidden">
          {/* Tab toggle */}
          <div className="flex items-center border-b border-border bg-surface">
            <button
              type="button"
              onClick={() => setSidePanel("collections")}
              className={clsx(
                "relative flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors flex-1 justify-center",
                sidePanel === "collections"
                  ? "text-text-primary"
                  : "text-text-tertiary hover:text-text-secondary",
              )}
            >
              <FolderOpen className="h-3 w-3" />
              Collections
              {sidePanel === "collections" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setSidePanel("history")}
              className={clsx(
                "relative flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors flex-1 justify-center",
                sidePanel === "history"
                  ? "text-text-primary"
                  : "text-text-tertiary hover:text-text-secondary",
              )}
            >
              <Clock className="h-3 w-3" />
              History
              {sidePanel === "history" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
              )}
            </button>
          </div>

          {/* Panel content */}
          {sidePanel === "collections" ? (
            <CollectionsSidebar
              collections={collections}
              onDeleteRequest={handleDeleteRequest}
              onDeleteCollection={handleDeleteCollection}
              onDuplicateRequest={handleDuplicateRequest}
            />
          ) : (
            <HistoryPanel />
          )}
        </div>
      </div>

      {/* Modals */}
      {curlMode && (
        <CurlModal mode={curlMode} onClose={() => setCurlMode(null)} />
      )}

      {showSaveModal && (
        <SaveRequestModal
          collections={collections}
          onSave={handleSaveRequest}
          onCreateCollection={handleCreateCollection}
          onClose={() => setShowSaveModal(false)}
        />
      )}
    </div>
  );
}
