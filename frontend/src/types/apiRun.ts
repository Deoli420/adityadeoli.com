// ── API Run types ─────────────────────────────────────────────────────────

export interface ApiRun {
  id: string;
  endpoint_id: string;
  status_code: number | null;
  response_time_ms: number | null;
  response_body: Record<string, unknown> | null;
  is_success: boolean;
  error_message: string | null;
  created_at: string;
}

/** Lightweight run without response_body — used in lists */
export interface ApiRunSummary {
  id: string;
  endpoint_id: string;
  status_code: number | null;
  response_time_ms: number | null;
  is_success: boolean;
  created_at: string;
}
