import apiClient from "./apiClient.ts";
import type { LoginRequest, TokenResponse, User } from "@/types/auth.ts";

const AUTH_PREFIX = "/api/v1/auth";

/**
 * Auth API service.
 *
 * - login / refresh use `withCredentials: true` so the browser sends
 *   and receives the httpOnly refresh-token cookie automatically.
 * - The access token is returned in the JSON body and kept in memory.
 */
export const authService = {
  async login(data: LoginRequest): Promise<TokenResponse> {
    const res = await apiClient.post<TokenResponse>(
      `${AUTH_PREFIX}/login`,
      data,
      { withCredentials: true },
    );
    return res.data;
  },

  async refresh(): Promise<TokenResponse> {
    const res = await apiClient.post<TokenResponse>(
      `${AUTH_PREFIX}/refresh`,
      null,
      { withCredentials: true },
    );
    return res.data;
  },

  async logout(): Promise<void> {
    await apiClient.post(`${AUTH_PREFIX}/logout`, null, {
      withCredentials: true,
    });
  },

  async getMe(): Promise<User> {
    const res = await apiClient.get<User>(`${AUTH_PREFIX}/me`);
    return res.data;
  },
};
