import { useAuthStore } from "@/stores/authStore.ts";

/** Convenience hook — returns the current user, role helpers, and logout. */
export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout = useAuthStore((s) => s.logout);

  const role = user?.role ?? null;

  return {
    user,
    isAuthenticated,
    logout,
    role,
  };
}

/** True if the current user can create/edit endpoints (OWNER, ADMIN, or MEMBER). */
export function useCanWrite() {
  const role = useAuthStore((s) => s.user?.role);
  return role === "OWNER" || role === "ADMIN" || role === "MEMBER";
}

/** True if the current user is an OWNER or ADMIN. */
export function useIsAdmin() {
  const role = useAuthStore((s) => s.user?.role);
  return role === "OWNER" || role === "ADMIN";
}

/** True if the current user is the organization OWNER. */
export function useIsOwner() {
  const role = useAuthStore((s) => s.user?.role);
  return role === "OWNER";
}
