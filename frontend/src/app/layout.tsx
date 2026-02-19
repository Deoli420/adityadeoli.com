import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar.tsx";
import { TopBar } from "@/components/layout/TopBar.tsx";
import { useAppStore } from "@/stores/appStore.ts";
import clsx from "clsx";

/**
 * Root layout shell.
 *
 * Structure:
 *   ┌──────────┬──────────────────────────────────┐
 *   │ Sidebar  │  TopBar                           │
 *   │          │──────────────────────────────────  │
 *   │          │  <Outlet />  (page content)        │
 *   │          │                                    │
 *   └──────────┴──────────────────────────────────┘
 *
 * The sidebar width transitions between 240px (expanded) and 64px (collapsed).
 * The main content area flexes to fill remaining space.
 */
export function Layout() {
  const collapsed = useAppStore((s) => s.sidebarCollapsed);

  return (
    <div className="flex h-screen overflow-hidden bg-surface-secondary">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div
        className={clsx(
          "flex flex-1 flex-col transition-all duration-200",
          collapsed ? "ml-16" : "ml-60",
        )}
      >
        <TopBar />

        {/* Scrollable page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
