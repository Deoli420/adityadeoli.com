// ── AI Telemetry types ──────────────────────────────────────────────────────

export interface AiTelemetryStats {
  total_calls: number;
  successful_calls: number;
  failed_calls: number;
  total_tokens: number;
  total_prompt_tokens: number;
  total_completion_tokens: number;
  total_cost_usd: number;
  avg_latency_ms: number;
  avg_tokens_per_call: number;
}

export interface AiTelemetryStatsResponse {
  stats: AiTelemetryStats;
}

export interface DailyBreakdownPoint {
  date: string;
  calls: number;
  tokens: number;
  cost_usd: number;
  avg_latency_ms: number;
}

export interface DailyBreakdownResponse {
  points: DailyBreakdownPoint[];
}

export interface PerEndpointUsage {
  endpoint_id: string;
  endpoint_name: string;
  total_calls: number;
  total_tokens: number;
  total_cost_usd: number;
  avg_latency_ms: number;
  success_rate: number;
}

export interface PerEndpointUsageResponse {
  endpoints: PerEndpointUsage[];
}

export interface AiHealthResponse {
  total_calls: number;
  success_rate: number;
  error_rate: number;
  avg_latency_ms: number;
  last_error: string | null;
  last_error_at: string | null;
  model_name: string;
}
