// ── API Endpoint types ────────────────────────────────────────────────────

import type { KeyValuePair, AuthConfig, BodyConfig } from "./apiTester.ts";

/** V2 advanced request configuration */
export interface AdvancedConfig {
  timeout_ms: number;
  retries: number;
  retry_delay_ms: number;
  follow_redirects: boolean;
  expected_response_time_ms: number | null;
}

export interface ApiEndpoint {
  id: string;
  name: string;
  url: string;
  method: string;
  expected_status: number;
  expected_schema: Record<string, unknown> | null;
  monitoring_interval_seconds: number;

  // V2 fields
  query_params: KeyValuePair[] | null;
  request_headers: KeyValuePair[] | null;
  cookies: KeyValuePair[] | null;
  auth_config: AuthConfig | null;
  body_config: BodyConfig | null;
  advanced_config: AdvancedConfig | null;
  config_version: number;

  created_at: string;
  updated_at: string;
}

export interface ApiEndpointCreate {
  name: string;
  url: string;
  method?: string;
  expected_status?: number;
  expected_schema?: Record<string, unknown> | null;
  monitoring_interval_seconds?: number;

  // V2 fields (optional)
  query_params?: KeyValuePair[] | null;
  request_headers?: KeyValuePair[] | null;
  cookies?: KeyValuePair[] | null;
  auth_config?: AuthConfig | null;
  body_config?: BodyConfig | null;
  advanced_config?: AdvancedConfig | null;
}

export interface ApiEndpointUpdate {
  name?: string;
  url?: string;
  method?: string;
  expected_status?: number;
  expected_schema?: Record<string, unknown> | null;
  monitoring_interval_seconds?: number;

  // V2 fields (optional)
  query_params?: KeyValuePair[] | null;
  request_headers?: KeyValuePair[] | null;
  cookies?: KeyValuePair[] | null;
  auth_config?: AuthConfig | null;
  body_config?: BodyConfig | null;
  advanced_config?: AdvancedConfig | null;
}
