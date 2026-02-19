export interface Organization {
  id: string;
  name: string;
  slug: string;
}

export type UserRole = "ADMIN" | "MEMBER" | "VIEWER";

export interface User {
  id: string;
  email: string;
  display_name: string;
  role: UserRole;
  organization: Organization;
}

export interface LoginRequest {
  email: string;
  password: string;
  organization_slug: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}
