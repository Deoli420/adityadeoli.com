import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Global error boundary — catches unhandled React errors and renders
 * a friendly fallback instead of a blank white screen.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-surface-secondary p-6">
          <div className="card max-w-md p-8 text-center animate-fade-in">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-risk-critical-bg">
              <AlertTriangle className="h-5 w-5 text-risk-critical" />
            </div>
            <h2 className="text-lg font-semibold text-text-primary">
              Something went wrong
            </h2>
            <p className="mt-2 text-xs text-text-secondary leading-relaxed">
              An unexpected error occurred. Try refreshing the page.
            </p>
            {this.state.error && (
              <pre className="mt-4 max-h-32 overflow-auto rounded-lg bg-surface-tertiary p-3 text-left text-[11px] font-mono text-text-tertiary">
                {this.state.error.message}
              </pre>
            )}
            <button
              className="btn-primary mt-5"
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
