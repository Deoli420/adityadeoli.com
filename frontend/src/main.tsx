import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { router } from "@/app/router.tsx";
import { authService } from "@/services/authService.ts";
import { useAuthStore } from "@/stores/authStore.ts";
import { ErrorBoundary } from "@/components/common/ErrorBoundary.tsx";
import "./index.css";

/**
 * React Query client — global defaults.
 *
 * - staleTime: 10s — prevents re-fetching the same data within 10 seconds
 *   of a previous fetch (e.g., navigating back to dashboard).
 * - retry: 1 — one automatic retry on failure, then show error state.
 * - refetchOnWindowFocus: true — catches stale data when user tabs back.
 *
 * Per-hook overrides (like 30s refetchInterval) take precedence.
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10_000,
      retry: 1,
      refetchOnWindowFocus: true,
    },
  },
});

/**
 * Attempt to restore the user session from the refresh cookie.
 *
 * If the browser still has a valid httpOnly refresh-token cookie,
 * POST /auth/refresh will return a new access token + user object.
 * On success we populate the auth store so PrivateRoute lets the
 * user through without showing the login page.
 *
 * If it fails (expired cookie, no cookie, server down) we silently
 * fall through — PrivateRoute will redirect to /login.
 */
async function initAuth(): Promise<void> {
  try {
    const { access_token, user } = await authService.refresh();
    useAuthStore.getState().setAuth(user, access_token);
  } catch {
    // No valid session — user will be redirected to login
  }
}

// Initialise auth before rendering
initAuth().finally(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: "var(--color-surface)",
                color: "var(--color-text-primary)",
                border: "1px solid var(--color-border)",
                borderRadius: "0.75rem",
                fontSize: "0.8125rem",
                fontWeight: 500,
                padding: "0.625rem 0.875rem",
                boxShadow:
                  "0 4px 12px rgb(0 0 0 / 0.08), 0 2px 4px rgb(0 0 0 / 0.04)",
              },
              success: {
                iconTheme: {
                  primary: "#22c55e",
                  secondary: "#ffffff",
                },
              },
              error: {
                iconTheme: {
                  primary: "#ef4444",
                  secondary: "#ffffff",
                },
              },
            }}
          />
        </QueryClientProvider>
      </ErrorBoundary>
    </StrictMode>,
  );
});
