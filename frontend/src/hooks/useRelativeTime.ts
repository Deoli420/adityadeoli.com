import { useState, useEffect } from "react";
import { timeAgo } from "@/utils/formatters.ts";

/**
 * Returns a reactive "time ago" string that re-renders every 30 seconds.
 * Keeps "Last checked: 3m ago" always fresh without manual refresh.
 */
export function useRelativeTime(dateStr: string | null | undefined): string {
  const [display, setDisplay] = useState(() => timeAgo(dateStr));

  useEffect(() => {
    setDisplay(timeAgo(dateStr));
    const id = setInterval(() => setDisplay(timeAgo(dateStr)), 30_000);
    return () => clearInterval(id);
  }, [dateStr]);

  return display;
}
