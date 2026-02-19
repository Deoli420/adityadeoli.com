import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore.ts";

/**
 * Route guard — redirects unauthenticated users to /login.
 *
 * Wrap protected routes with this component in the router config.
 * The Outlet renders the matched child route.
 */
export function PrivateRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
