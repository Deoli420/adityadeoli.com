import { Link } from "react-router-dom";
import { ArrowLeft, Search } from "lucide-react";

/**
 * 404 — Page Not Found.
 *
 * Shown for any route that doesn't match a known path.
 * Provides a clear way back to the dashboard.
 */
export function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-secondary p-6">
      <div className="text-center max-w-sm animate-fade-in">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-tertiary">
          <Search className="h-6 w-6 text-text-tertiary" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-text-primary tabular-nums">
          404
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          This page doesn't exist or has been moved.
        </p>
        <Link
          to="/"
          className="btn-primary mt-6 inline-flex items-center gap-2"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
