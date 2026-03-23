import apiClient from "./apiClient.ts";

const API = "/api/v1";

// ── Auth (public endpoints) ──────────────────────────────────────────

export async function signup(data: {
  display_name: string;
  email: string;
  password: string;
  org_name?: string;
}) {
  const { data: res } = await apiClient.post(`${API}/auth/signup`, data);
  return res;
}

export async function joinInvite(
  token: string,
  data: { display_name: string; password: string },
) {
  const { data: res } = await apiClient.post(
    `${API}/auth/join/${token}`,
    data,
  );
  return res;
}

export async function validateInvite(token: string) {
  const { data: res } = await apiClient.get(
    `${API}/auth/invites/${token}/validate`,
  );
  return res;
}

// ── Users (authenticated) ────────────────────────────────────────────

export async function getUsers() {
  const { data } = await apiClient.get(`${API}/users/`);
  return data;
}

export async function updateProfile(data: {
  display_name?: string;
  email?: string;
}) {
  const { data: res } = await apiClient.patch(`${API}/users/me`, data);
  return res;
}

export async function changePassword(data: {
  current_password: string;
  new_password: string;
}) {
  const { data: res } = await apiClient.patch(
    `${API}/users/me/password`,
    data,
  );
  return res;
}

export async function changeUserRole(userId: string, role: string) {
  const { data: res } = await apiClient.patch(`${API}/users/${userId}/role`, {
    role,
  });
  return res;
}

export async function removeUser(userId: string) {
  await apiClient.delete(`${API}/users/${userId}`);
}

// ── Invites ──────────────────────────────────────────────────────────

export async function createInvite(data: { email: string; role?: string }) {
  const { data: res } = await apiClient.post(`${API}/invites/`, data);
  return res;
}

export async function getInvites() {
  const { data } = await apiClient.get(`${API}/invites/`);
  return data;
}

export async function revokeInvite(id: string) {
  await apiClient.delete(`${API}/invites/${id}`);
}

// ── Organization ─────────────────────────────────────────────────────

export async function getOrganization() {
  const { data } = await apiClient.get(`${API}/organization/`);
  return data;
}

export async function updateOrganization(data: {
  name?: string;
  slug?: string;
}) {
  const { data: res } = await apiClient.patch(`${API}/organization/`, data);
  return res;
}

export async function transferOwnership(newOwnerId: string) {
  const { data: res } = await apiClient.post(
    `${API}/organization/transfer-ownership`,
    { new_owner_id: newOwnerId },
  );
  return res;
}
