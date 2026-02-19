import { create } from "zustand";
import type { User } from "@/types/auth.ts";

interface AuthState {
  /** Currently authenticated user (null when logged out) */
  user: User | null;
  /** JWT access token held in memory only — never persisted */
  accessToken: string | null;
  /** Convenience derived flag */
  isAuthenticated: boolean;

  /** Set user + token after login or refresh */
  setAuth: (user: User, token: string) => void;
  /** Update only the access token (after silent refresh) */
  setAccessToken: (token: string) => void;
  /** Clear all auth state (logout) */
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,

  setAuth: (user, token) =>
    set({ user, accessToken: token, isAuthenticated: true }),

  setAccessToken: (token) => set({ accessToken: token }),

  logout: () =>
    set({ user: null, accessToken: null, isAuthenticated: false }),
}));
