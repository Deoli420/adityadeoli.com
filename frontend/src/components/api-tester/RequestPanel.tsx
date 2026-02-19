import { useApiTesterStore } from "@/stores/apiTesterStore.ts";
import { KeyValueEditor } from "./KeyValueEditor.tsx";
import { AuthPanel } from "./AuthPanel.tsx";
import { BodyPanel } from "./BodyPanel.tsx";
import clsx from "clsx";

type Tab = "params" | "auth" | "headers" | "body";

const TABS: { value: Tab; label: string }[] = [
  { value: "params", label: "Params" },
  { value: "auth", label: "Authorization" },
  { value: "headers", label: "Headers" },
  { value: "body", label: "Body" },
];

/**
 * Tabbed request configuration panel.
 *
 * Tabs: Params | Authorization | Headers | Body
 * Each tab has a count badge for non-empty, enabled items.
 *
 * SDS: Tab bar uses subtle underline active state (no pills).
 * Active tab gets accent underline + text-primary, others text-tertiary.
 */
export function RequestPanel() {
  const activeTab = useApiTesterStore((s) => s.activeTab);
  const setActiveTab = useApiTesterStore((s) => s.setActiveTab);
  const request = useApiTesterStore((s) => s.request);

  // Count badges
  const paramCount = request.params.filter(
    (p) => p.enabled && p.key.trim(),
  ).length;
  const headerCount = request.headers.filter(
    (h) => h.enabled && h.key.trim(),
  ).length;
  const hasAuth = request.auth.type !== "none";
  const hasBody = request.body.type !== "none";

  // Param actions
  const addParam = useApiTesterStore((s) => s.addParam);
  const updateParam = useApiTesterStore((s) => s.updateParam);
  const toggleParam = useApiTesterStore((s) => s.toggleParam);
  const removeParam = useApiTesterStore((s) => s.removeParam);

  // Header actions
  const addHeader = useApiTesterStore((s) => s.addHeader);
  const updateHeader = useApiTesterStore((s) => s.updateHeader);
  const toggleHeader = useApiTesterStore((s) => s.toggleHeader);
  const removeHeader = useApiTesterStore((s) => s.removeHeader);

  function getBadge(tab: Tab): number | null {
    switch (tab) {
      case "params":
        return paramCount || null;
      case "headers":
        return headerCount || null;
      default:
        return null;
    }
  }

  function getDot(tab: Tab): boolean {
    switch (tab) {
      case "auth":
        return hasAuth;
      case "body":
        return hasBody;
      default:
        return false;
    }
  }

  return (
    <div className="card overflow-hidden">
      {/* Tab bar */}
      <div className="flex items-center border-b border-border bg-surface">
        {TABS.map((tab) => {
          const badge = getBadge(tab.value);
          const dot = getDot(tab.value);
          const isActive = activeTab === tab.value;

          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActiveTab(tab.value)}
              className={clsx(
                "relative flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors",
                isActive
                  ? "text-text-primary"
                  : "text-text-tertiary hover:text-text-secondary",
              )}
            >
              {tab.label}

              {/* Count badge */}
              {badge !== null && (
                <span
                  className={clsx(
                    "flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-semibold",
                    isActive
                      ? "bg-accent text-white"
                      : "bg-surface-tertiary text-text-tertiary",
                  )}
                >
                  {badge}
                </span>
              )}

              {/* Active dot for auth/body */}
              {dot && !badge && (
                <span
                  className={clsx(
                    "h-1.5 w-1.5 rounded-full",
                    isActive ? "bg-accent" : "bg-text-tertiary",
                  )}
                />
              )}

              {/* Active underline */}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="min-h-[200px]">
        {activeTab === "params" && (
          <div className="p-4">
            <p className="mb-3 text-[10px] text-text-tertiary uppercase tracking-wider font-medium">
              Query Parameters
            </p>
            <KeyValueEditor
              pairs={request.params}
              onUpdate={updateParam}
              onToggle={toggleParam}
              onRemove={removeParam}
              onAdd={addParam}
              keyPlaceholder="Parameter"
              valuePlaceholder="Value"
            />
          </div>
        )}

        {activeTab === "auth" && <AuthPanel />}

        {activeTab === "headers" && (
          <div className="p-4">
            <p className="mb-3 text-[10px] text-text-tertiary uppercase tracking-wider font-medium">
              Request Headers
            </p>
            <KeyValueEditor
              pairs={request.headers}
              onUpdate={updateHeader}
              onToggle={toggleHeader}
              onRemove={removeHeader}
              onAdd={addHeader}
            />
          </div>
        )}

        {activeTab === "body" && <BodyPanel />}
      </div>
    </div>
  );
}
