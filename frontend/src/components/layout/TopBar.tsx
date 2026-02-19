import { useLocation } from "react-router-dom";
import { Activity } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getHealth } from "@/services/endpointsService.ts";

/**
 * Top bar — minimal header with page title and live health indicator.
 *
 * Derives the page title from the current route path.
 * Health dot pulses green when the API is reachable, dims red when not.
 *
 * Design: Clean white surface, 1px bottom border. No heavy shadows.
 * Keeps focus on the content area below.
 */
export function TopBar() {
  const { pathname } = useLocation();
  const title = deriveTitle(pathname);

  const { data: health, isError } = useQuery({
    queryKey: ["health"],
    queryFn: getHealth,
    refetchInterval: 30_000,
    retry: 1,
  });

  const isLive = !!health && !isError;

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-surface px-6">
      <h1 className="text-sm font-semibold tracking-tight text-text-primary">
        {title}
      </h1>

      {/* Health pulse */}
      <div className="flex items-center gap-2 text-[11px] text-text-tertiary">
        <span className="relative flex h-1.5 w-1.5">
          {isLive && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-risk-low opacity-75" />
          )}
          <span
            className={`relative inline-flex h-1.5 w-1.5 rounded-full ${
              isLive ? "bg-risk-low" : "bg-risk-critical"
            }`}
          />
        </span>
        <Activity className="h-3 w-3" />
        <span className="font-medium">{isLive ? "Live" : "Offline"}</span>
      </div>
    </header>
  );
}

function deriveTitle(pathname: string): string {
  if (pathname === "/") return "Dashboard";
  if (pathname === "/endpoints/new") return "Add Endpoint";
  if (pathname.startsWith("/endpoints/")) return "Endpoint Detail";
  if (pathname === "/api-tester") return "API Tester";
  return "SentinelAI";
}
