import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

/**
 * Empty state placeholder for lists with no data.
 *
 * Shown when:
 * - No endpoints have been created yet
 * - A filtered list returns zero results
 * - No anomalies detected (positive empty state)
 */
export function EmptyState({
  title = "No data yet",
  description = "Items will appear here once they're available.",
  icon,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 text-text-tertiary">
        {icon ?? <Inbox className="h-10 w-10" />}
      </div>
      <h3 className="text-sm font-medium text-text-primary">{title}</h3>
      <p className="mt-1 max-w-sm text-xs text-text-secondary">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
