import { NavLink, Outlet } from "react-router-dom";
import { Settings, User, Users, Building2 } from "lucide-react";
import { useIsAdmin } from "@/hooks/useAuth.ts";
import clsx from "clsx";

const SETTINGS_TABS = [
  { to: "/settings", label: "Profile", icon: User, end: true, adminOnly: false },
  { to: "/settings/team", label: "Team", icon: Users, end: false, adminOnly: true },
  { to: "/settings/organization", label: "Organization", icon: Building2, end: false, adminOnly: true },
];

export function SettingsLayout() {
  const isAdmin = useIsAdmin();

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
          <Settings className="h-5 w-5 text-accent" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Settings</h1>
          <p className="text-sm text-text-secondary">
            Manage your account, team, and organization
          </p>
        </div>
      </div>

      {/* Content with sub-nav */}
      <div className="flex gap-6">
        {/* Left sub-nav */}
        <nav className="w-48 shrink-0 space-y-1">
          {SETTINGS_TABS.filter((tab) => !tab.adminOnly || isAdmin).map(
            ({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  clsx(
                    "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-accent/10 text-accent"
                      : "text-text-secondary hover:bg-surface-tertiary hover:text-text-primary",
                  )
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ),
          )}
        </nav>

        {/* Right content */}
        <div className="min-w-0 flex-1">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
