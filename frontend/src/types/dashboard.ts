// ── Dashboard chart types ──────────────────────────────────────────────────

export interface TrendPoint {
  hour: string;
  avg_response_time_ms: number;
  request_count: number;
}

export interface ResponseTrendsData {
  points: TrendPoint[];
}

export interface TopFailureEntry {
  endpoint_id: string;
  endpoint_name: string;
  failure_rate_percent: number;
  risk_level: string;
  risk_score: number;
}

export interface TopFailuresData {
  endpoints: TopFailureEntry[];
}

export interface RiskDistribution {
  low: number;
  medium: number;
  high: number;
  critical: number;
}

export interface UptimeOverviewEntry {
  endpoint_id: string;
  endpoint_name: string;
  uptime_percent: number;
  sla_target: number;
  is_breached: boolean;
}

export interface UptimeOverviewData {
  entries: UptimeOverviewEntry[];
}

// ── SLA types ─────────────────────────────────────────────────────────────

export type UptimeWindow = "24h" | "7d" | "30d";

export interface EndpointSLA {
  id: string;
  endpoint_id: string;
  organization_id: string;
  sla_target_percent: number;
  uptime_window: UptimeWindow;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EndpointSLACreate {
  endpoint_id: string;
  sla_target_percent?: number;
  uptime_window?: UptimeWindow;
}

export interface EndpointSLAUpdate {
  sla_target_percent?: number;
  uptime_window?: UptimeWindow;
  is_active?: boolean;
}

export interface UptimeStats {
  endpoint_id: string;
  uptime_percent: number;
  total_runs: number;
  successful_runs: number;
  window: string;
  sla_target: number;
  is_breached: boolean;
}
