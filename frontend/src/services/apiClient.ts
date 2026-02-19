import axios, { type InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/stores/authStore.ts";

/**
 * Shared Axios instance for all API calls.
 *
 * Base URL resolution:
 *   1. VITE_API_BASE_URL env var (e.g. "https://api.sentinelai.adityadeoli.com")
 *   2. Falls back to "" which means:
 *      - In dev → Vite proxy rewrites /api/* to http://localhost:8000
 *      - In prod → same-origin (nginx serves both frontend + API)
 */
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30_000,
  withCredentials: true, // Send httpOnly cookies on all requests
});

// ── Request interceptor — inject Bearer token ──────────────────────────
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor — 401 refresh queue ───────────────────────────
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (token) resolve(token);
    else reject(error);
  });
  failedQueue = [];
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // If 401 and we haven't already retried this request
    if (error.response?.status === 401 && !original._retry) {
      // Don't try to refresh auth endpoints themselves
      if (original.url?.includes("/auth/refresh") || original.url?.includes("/auth/login")) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Queue the request and wait for the refresh to complete
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return apiClient(original);
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        // Import dynamically to avoid circular dependency
        const { authService } = await import("./authService.ts");
        const { access_token, user } = await authService.refresh();
        useAuthStore.getState().setAuth(user, access_token);
        processQueue(null, access_token);

        original.headers.Authorization = `Bearer ${access_token}`;
        return apiClient(original);
      } catch (refreshError) {
        processQueue(refreshError, null);
        useAuthStore.getState().logout();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Normalise network / timeout errors into a consistent shape
    if (error.response) {
      const msg =
        error.response.data?.detail ??
        error.response.data?.message ??
        `Request failed (${error.response.status})`;
      return Promise.reject(new Error(msg));
    }
    if (error.request) {
      return Promise.reject(new Error("Network error — API unreachable"));
    }
    return Promise.reject(error);
  },
);

export default apiClient;
