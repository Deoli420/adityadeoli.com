// ── API Tester types (Postman-like) ───────────────────────────────────────

/** A key-value pair used in params, headers, form fields */
export interface KeyValuePair {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

/** Supported HTTP methods */
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";

/** Auth types supported */
export type AuthType = "none" | "bearer" | "basic" | "api-key";

/** Where to send the API key */
export type ApiKeyLocation = "header" | "query";

/** Auth configuration */
export interface AuthConfig {
  type: AuthType;
  bearer: { token: string };
  basic: { username: string; password: string };
  apiKey: { key: string; value: string; addTo: ApiKeyLocation };
}

/** Body content types */
export type BodyType = "none" | "json" | "form-data" | "x-www-form-urlencoded";

/** Body configuration */
export interface BodyConfig {
  type: BodyType;
  raw: string; // JSON string for raw mode
  formData: KeyValuePair[];
  urlEncoded: KeyValuePair[];
}

/** Full request configuration */
export interface RequestConfig {
  method: HttpMethod;
  url: string;
  params: KeyValuePair[];
  headers: KeyValuePair[];
  auth: AuthConfig;
  body: BodyConfig;
}

/** Timing breakdown */
export interface ResponseTiming {
  start: number; // ms since epoch
  end: number;
  duration: number; // total ms
}

/** Executed response */
export interface ResponseData {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  size: number; // bytes
  timing: ResponseTiming;
  error?: string;
}

/** A saved request in a collection */
export interface SavedRequest {
  id: string;
  collection_id: string;
  name: string;
  request: RequestConfig;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/** A collection of saved requests */
export interface Collection {
  id: string;
  name: string;
  description?: string;
  requests: SavedRequest[];
  created_at: string;
  updated_at: string;
}

/** History entry */
export interface HistoryEntry {
  id: string;
  method: HttpMethod;
  url: string;
  status: number;
  duration: number;
  timestamp: number; // ms since epoch
  request: RequestConfig;
}

/** Create/update payloads for backend */
export interface CollectionCreate {
  name: string;
  description?: string;
}

export interface CollectionUpdate {
  name?: string;
  description?: string;
}

export interface SavedRequestCreate {
  collection_id: string;
  name: string;
  method: string;
  url: string;
  params?: KeyValuePair[];
  headers?: KeyValuePair[];
  auth?: AuthConfig;
  body?: BodyConfig;
  sort_order?: number;
}

export interface SavedRequestUpdate {
  name?: string;
  method?: string;
  url?: string;
  params?: KeyValuePair[];
  headers?: KeyValuePair[];
  auth?: AuthConfig;
  body?: BodyConfig;
  sort_order?: number;
}
