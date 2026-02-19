import { NavLink, useNavigate } from "react-router-dom";
import { useAppStore } from "@/stores/appStore.ts";
import { useAuthStore } from "@/stores/authStore.ts";
import { authService } from "@/services/authService.ts";
import {
  LayoutDashboard,
  Plus,
  Zap,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";
import clsx from "clsx";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/endpoints/new", label: "Add Endpoint", icon: Plus },
  { to: "/api-tester", label: "API Tester", icon: Zap },
] as const;

/**
 * Fixed sidebar — dark variant inspired by Linear/Vercel.
 *
 * - Collapsible via Zustand store (icon-only at 64px, full at 240px)
 * - NavLink for active-state highlighting with accent colour
 * - Shield icon as brand mark
 * - User info and logout at the bottom
 *
 * Design: Dark background (slate-900) to anchor the app visually,
 * with light text and subtle hover states for contrast.
 */
export function Sidebar() {
  const collapsed = useAppStore((s) => s.sidebarCollapsed);
  const toggle = useAppStore((s) => s.toggleSidebar);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await authService.logout();
    } catch {
      // Even if the API call fails, clear local state
    }
    logout();
    navigate("/login", { replace: true });
  }

  // User initials for avatar
  const initials = user?.display_name
    ? user.display_name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.charAt(0).toUpperCase() ?? "?";

  return (
    <aside
      className={clsx(
        "fixed inset-y-0 left-0 z-30 flex flex-col bg-slate-900 transition-all duration-200 ease-in-out",
        collapsed ? "w-16" : "w-60",
      )}
    >
      {/* Brand */}
      <div className="flex h-14 items-center gap-2.5 border-b border-white/[0.06] px-4">
        <img
          src="/logo-icon.png"
          alt="SentinelAI"
          className="h-7 w-7 shrink-0"
        />
        {!collapsed && (
          <span className="text-sm font-semibold tracking-tight text-white">
            SentinelAI
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-2 py-3">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              clsx(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150",
                isActive
                  ? "bg-white/[0.08] text-white"
                  : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200",
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User info + logout */}
      {user && (
        <div className="border-t border-white/[0.06] px-2 py-2">
          <div
            className={clsx(
              "flex items-center gap-2.5 rounded-lg px-2 py-2",
              collapsed && "justify-center",
            )}
          >
            {/* Avatar */}
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/15 text-[11px] font-semibold text-accent">
              {initials}
            </div>

            {/* Name + role (only when expanded) */}
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-slate-200">
                  {user.display_name || user.email}
                </p>
                <p className="text-[10px] text-slate-500">{user.role}</p>
              </div>
            )}

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className={clsx(
                "shrink-0 rounded-md p-1.5 text-slate-500 transition-colors hover:bg-white/[0.06] hover:text-slate-300",
                collapsed && "hidden",
              )}
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Collapse toggle */}
      <button
        onClick={toggle}
        className="flex h-10 items-center justify-center border-t border-white/[0.06] text-slate-500 hover:text-slate-300 hover:bg-white/[0.04] transition-all duration-150"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </button>
    </aside>
  );
}
