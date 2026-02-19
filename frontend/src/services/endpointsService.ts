import apiClient from "./apiClient.ts";
import type {
  ApiEndpoint,
  ApiEndpointCreate,
  ApiEndpointUpdate,
  ApiRunSummary,
  Anomaly,
  RiskScore,
  MonitorRunResult,
  PerformanceReadout,
} from "@/types/index.ts";

const API = "/api/v1";

// ── Endpoints CRUD ────────────────────────────────────────────────────────

export async function getEndpoints(): Promise<ApiEndpoint[]> {
  const { data } = await apiClient.get<ApiEndpoint[]>(`${API}/endpoints/`);
  return data;
}

export async function getEndpoint(id: string): Promise<ApiEndpoint> {
  const { data } = await apiClient.get<ApiEndpoint>(`${API}/endpoints/${id}`);
  return data;
}

export async function createEndpoint(
  payload: ApiEndpointCreate,
): Promise<ApiEndpoint> {
  const { data } = await apiClient.post<ApiEndpoint>(
    `${API}/endpoints/`,
    payload,
  );
  return data;
}

export async function updateEndpoint(
  id: string,
  payload: ApiEndpointUpdate,
): Promise<ApiEndpoint> {
  const { data } = await apiClient.patch<ApiEndpoint>(
    `${API}/endpoints/${id}`,
    payload,
  );
  return data;
}

export async function deleteEndpoint(id: string): Promise<void> {
  await apiClient.delete(`${API}/endpoints/${id}`);
}

// ── Runs ──────────────────────────────────────────────────────────────────

export async function getEndpointRuns(
  endpointId: string,
  limit = 50,
): Promise<ApiRunSummary[]> {
  const { data } = await apiClient.get<ApiRunSummary[]>(
    `${API}/runs/endpoint/${endpointId}`,
    { params: { limit } },
  );
  return data;
}

export async function getFailureRate(
  endpointId: string,
): Promise<{ endpoint_id: string; failure_rate_percent: number }> {
  const { data } = await apiClient.get(
    `${API}/runs/endpoint/${endpointId}/failure-rate`,
  );
  return data;
}

// ── Risk Scores ───────────────────────────────────────────────────────────

export async function getLatestRiskScore(
  endpointId: string,
): Promise<RiskScore | null> {
  const { data } = await apiClient.get<RiskScore | null>(
    `${API}/risk-scores/endpoint/${endpointId}/latest`,
  );
  return data;
}

// ── Anomalies ─────────────────────────────────────────────────────────────

export async function getEndpointAnomalies(
  endpointId: string,
  limit = 50,
): Promise<Anomaly[]> {
  const { data } = await apiClient.get<Anomaly[]>(
    `${API}/anomalies/endpoint/${endpointId}`,
    { params: { limit } },
  );
  return data;
}

// ── Monitoring Pipeline ───────────────────────────────────────────────────

export async function triggerMonitorRun(
  endpointId: string,
): Promise<MonitorRunResult> {
  const { data } = await apiClient.post<MonitorRunResult>(
    `${API}/monitor/run/${endpointId}`,
  );
  return data;
}

export async function getPerformance(
  endpointId: string,
  window = 20,
): Promise<PerformanceReadout> {
  const { data } = await apiClient.get<PerformanceReadout>(
    `${API}/monitor/performance/${endpointId}`,
    { params: { window } },
  );
  return data;
}

// ── Dashboard Stats ───────────────────────────────────────────────────────

export interface DashboardStats {
  total_endpoints: number;
  active_monitors: number;
  anomalies_24h: number;
  avg_risk_score: number;
  avg_risk_level: string;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const { data } = await apiClient.get<DashboardStats>(
    `${API}/dashboard/stats`,
  );
  return data;
}

// ── Health ─────────────────────────────────────────────────────────────────

export async function getHealth(): Promise<{
  status: string;
  app: string;
  version: string;
  database: string;
}> {
  const { data } = await apiClient.get(`${API}/health`);
  return data;
}
