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
  ResponseTrendsData,
  TopFailuresData,
  RiskDistribution,
  UptimeOverviewData,
  EndpointSLA,
  EndpointSLACreate,
  EndpointSLAUpdate,
  UptimeStats,
  AlertRule,
  AlertRuleCreate,
  AlertRuleUpdate,
  Incident,
  IncidentListItem,
  IncidentEvent,
  IncidentCreate,
  IncidentStatusUpdate,
  IncidentNoteCreate,
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

// ── Dashboard Charts ──────────────────────────────────────────────────────

export async function getResponseTrends(
  hours = 24,
): Promise<ResponseTrendsData> {
  const { data } = await apiClient.get<ResponseTrendsData>(
    `${API}/dashboard/response-trends`,
    { params: { hours } },
  );
  return data;
}

export async function getTopFailures(
  limit = 5,
): Promise<TopFailuresData> {
  const { data } = await apiClient.get<TopFailuresData>(
    `${API}/dashboard/top-failures`,
    { params: { limit } },
  );
  return data;
}

export async function getRiskDistribution(): Promise<RiskDistribution> {
  const { data } = await apiClient.get<RiskDistribution>(
    `${API}/dashboard/risk-distribution`,
  );
  return data;
}

export async function getUptimeOverview(): Promise<UptimeOverviewData> {
  const { data } = await apiClient.get<UptimeOverviewData>(
    `${API}/dashboard/uptime-overview`,
  );
  return data;
}

// ── SLA ───────────────────────────────────────────────────────────────────

export async function getEndpointSLA(
  endpointId: string,
): Promise<EndpointSLA> {
  const { data } = await apiClient.get<EndpointSLA>(
    `${API}/sla/${endpointId}`,
  );
  return data;
}

export async function getEndpointUptime(
  endpointId: string,
): Promise<UptimeStats> {
  const { data } = await apiClient.get<UptimeStats>(
    `${API}/sla/${endpointId}/uptime`,
  );
  return data;
}

export async function createEndpointSLA(
  payload: EndpointSLACreate,
): Promise<EndpointSLA> {
  const { data } = await apiClient.post<EndpointSLA>(
    `${API}/sla/`,
    payload,
  );
  return data;
}

export async function updateEndpointSLA(
  endpointId: string,
  payload: EndpointSLAUpdate,
): Promise<EndpointSLA> {
  const { data } = await apiClient.patch<EndpointSLA>(
    `${API}/sla/${endpointId}`,
    payload,
  );
  return data;
}

export async function deleteEndpointSLA(
  endpointId: string,
): Promise<void> {
  await apiClient.delete(`${API}/sla/${endpointId}`);
}

// ── Alert Rules ──────────────────────────────────────────────────────────

export async function getAlertRules(
  endpointId: string,
): Promise<AlertRule[]> {
  const { data } = await apiClient.get<AlertRule[]>(
    `${API}/alert-rules/endpoint/${endpointId}`,
  );
  return data;
}

export async function createAlertRule(
  payload: AlertRuleCreate,
): Promise<AlertRule> {
  const { data } = await apiClient.post<AlertRule>(
    `${API}/alert-rules/`,
    payload,
  );
  return data;
}

export async function updateAlertRule(
  ruleId: string,
  payload: AlertRuleUpdate,
): Promise<AlertRule> {
  const { data } = await apiClient.patch<AlertRule>(
    `${API}/alert-rules/${ruleId}`,
    payload,
  );
  return data;
}

export async function deleteAlertRule(ruleId: string): Promise<void> {
  await apiClient.delete(`${API}/alert-rules/${ruleId}`);
}

export async function toggleAlertRule(
  ruleId: string,
): Promise<AlertRule> {
  const { data } = await apiClient.post<AlertRule>(
    `${API}/alert-rules/${ruleId}/toggle`,
  );
  return data;
}

// ── Incidents ────────────────────────────────────────────────────────────

export async function getIncidents(
  status?: string,
): Promise<IncidentListItem[]> {
  const params: Record<string, string> = {};
  if (status) params.status = status;
  const { data } = await apiClient.get<IncidentListItem[]>(
    `${API}/incidents/`,
    { params },
  );
  return data;
}

export async function getIncident(id: string): Promise<Incident> {
  const { data } = await apiClient.get<Incident>(`${API}/incidents/${id}`);
  return data;
}

export async function getIncidentTimeline(
  id: string,
): Promise<IncidentEvent[]> {
  const { data } = await apiClient.get<IncidentEvent[]>(
    `${API}/incidents/${id}/timeline`,
  );
  return data;
}

export async function getEndpointIncidents(
  endpointId: string,
): Promise<Incident[]> {
  const { data } = await apiClient.get<Incident[]>(
    `${API}/incidents/endpoint/${endpointId}`,
  );
  return data;
}

export async function createIncident(
  payload: IncidentCreate,
): Promise<Incident> {
  const { data } = await apiClient.post<Incident>(
    `${API}/incidents/`,
    payload,
  );
  return data;
}

export async function updateIncidentStatus(
  id: string,
  payload: IncidentStatusUpdate,
): Promise<Incident> {
  const { data } = await apiClient.patch<Incident>(
    `${API}/incidents/${id}/status`,
    payload,
  );
  return data;
}

export async function addIncidentNote(
  id: string,
  payload: IncidentNoteCreate,
): Promise<Incident> {
  const { data } = await apiClient.post<Incident>(
    `${API}/incidents/${id}/notes`,
    payload,
  );
  return data;
}

// ── Export ─────────────────────────────────────────────────────────────────

export interface ExportParams {
  endpointIds?: string[];
  dateFrom?: string;
  dateTo?: string;
}

function _buildExportUrl(
  path: string,
  params: ExportParams,
): string {
  const qs = new URLSearchParams();
  if (params.endpointIds?.length) {
    qs.set("endpoint_ids", params.endpointIds.join(","));
  }
  if (params.dateFrom) qs.set("date_from", params.dateFrom);
  if (params.dateTo) qs.set("date_to", params.dateTo);
  const query = qs.toString();
  return `${API}/export/${path}${query ? `?${query}` : ""}`;
}

/** Trigger CSV download as a file blob */
async function _downloadCsv(path: string, params: ExportParams, filename: string) {
  const url = _buildExportUrl(path, params);
  const { data } = await apiClient.get(url, { responseType: "blob" });
  const blob = new Blob([data], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

export async function exportRuns(params: ExportParams = {}): Promise<void> {
  await _downloadCsv("runs", params, "sentinel_runs.csv");
}

export async function exportIncidents(params: ExportParams = {}): Promise<void> {
  await _downloadCsv("incidents", params, "sentinel_incidents.csv");
}

export async function exportRiskScores(params: ExportParams = {}): Promise<void> {
  await _downloadCsv("risk-scores", params, "sentinel_risk_scores.csv");
}

export async function exportSLA(params: ExportParams = {}): Promise<void> {
  await _downloadCsv("sla", params, "sentinel_sla_report.csv");
}

// ── Onboarding ────────────────────────────────────────────────────────────

export interface OnboardingStep {
  key: string;
  title: string;
  description: string;
  completed: boolean;
  link: string;
}

export interface OnboardingStatus {
  completed_count: number;
  total_count: number;
  percent: number;
  dismissed: boolean;
  steps: OnboardingStep[];
}

export async function getOnboardingStatus(): Promise<OnboardingStatus> {
  const { data } = await apiClient.get<OnboardingStatus>(
    `${API}/onboarding/status`,
  );
  return data;
}

// ── AI Telemetry ──────────────────────────────────────────────────────────

import type {
  AiTelemetryStatsResponse,
  DailyBreakdownResponse,
  PerEndpointUsageResponse,
  AiHealthResponse,
} from "@/types/index.ts";

export async function getAiTelemetryStats(
  days = 30,
): Promise<AiTelemetryStatsResponse> {
  const { data } = await apiClient.get<AiTelemetryStatsResponse>(
    `${API}/ai-telemetry/stats`,
    { params: { days } },
  );
  return data;
}

export async function getAiDailyBreakdown(
  days = 30,
): Promise<DailyBreakdownResponse> {
  const { data } = await apiClient.get<DailyBreakdownResponse>(
    `${API}/ai-telemetry/daily`,
    { params: { days } },
  );
  return data;
}

export async function getAiPerEndpoint(
  days = 30,
): Promise<PerEndpointUsageResponse> {
  const { data } = await apiClient.get<PerEndpointUsageResponse>(
    `${API}/ai-telemetry/by-endpoint`,
    { params: { days } },
  );
  return data;
}

export async function getAiHealth(): Promise<AiHealthResponse> {
  const { data } = await apiClient.get<AiHealthResponse>(
    `${API}/ai-telemetry/health`,
  );
  return data;
}

// ── Schema Snapshots ──────────────────────────────────────────────────────

import type {
  SchemaHistoryResponse,
  SchemaDiffResponse,
  SchemaSnapshot,
} from "@/types/index.ts";

export async function getSchemaHistory(
  endpointId: string,
  limit = 50,
): Promise<SchemaHistoryResponse> {
  const { data } = await apiClient.get<SchemaHistoryResponse>(
    `${API}/schema/${endpointId}/history`,
    { params: { limit } },
  );
  return data;
}

export async function getSchemaSnapshots(
  endpointId: string,
  limit = 50,
): Promise<SchemaHistoryResponse> {
  const { data } = await apiClient.get<SchemaHistoryResponse>(
    `${API}/schema/${endpointId}/snapshots`,
    { params: { limit } },
  );
  return data;
}

export async function getSchemaDiff(
  endpointId: string,
  snapA: string,
  snapB: string,
): Promise<SchemaDiffResponse> {
  const { data } = await apiClient.get<SchemaDiffResponse>(
    `${API}/schema/${endpointId}/diff/${snapA}/${snapB}`,
  );
  return data;
}

export async function acceptSchema(
  endpointId: string,
): Promise<SchemaSnapshot> {
  const { data } = await apiClient.post<SchemaSnapshot>(
    `${API}/schema/${endpointId}/accept`,
  );
  return data;
}

// ── Debug Assistant ───────────────────────────────────────────────────────

export interface DebugSuggestion {
  diagnosis: string;
  steps: string[];
  likely_root_cause: string;
  severity_assessment: string;
  related_patterns: string[];
}

export async function triggerDebugAnalysis(
  endpointId: string,
): Promise<DebugSuggestion> {
  const { data } = await apiClient.post<DebugSuggestion>(
    `${API}/debug/${endpointId}/suggest`,
  );
  return data;
}

export async function getLatestDebugSuggestion(
  endpointId: string,
): Promise<DebugSuggestion | null> {
  const { data } = await apiClient.get<DebugSuggestion | null>(
    `${API}/debug/${endpointId}/latest`,
  );
  return data;
}

// ── Security Findings ──────────────────────────────────────────────────────

import type { SecurityFinding, SecurityStats } from "@/types/index.ts";

export async function getSecurityFindings(
  limit = 100,
  findingType?: string,
): Promise<SecurityFinding[]> {
  const params: Record<string, string | number> = { limit };
  if (findingType) params.finding_type = findingType;
  const { data } = await apiClient.get<SecurityFinding[]>(
    `${API}/security/findings`,
    { params },
  );
  return data;
}

export async function getEndpointSecurityFindings(
  endpointId: string,
  limit = 50,
): Promise<SecurityFinding[]> {
  const { data } = await apiClient.get<SecurityFinding[]>(
    `${API}/security/findings/${endpointId}`,
    { params: { limit } },
  );
  return data;
}

export async function getSecurityStats(
  days = 30,
): Promise<SecurityStats> {
  const { data } = await apiClient.get<SecurityStats>(
    `${API}/security/stats`,
    { params: { days } },
  );
  return data;
}

// ── Contract Testing ──────────────────────────────────────────────────────

export interface ContractViolation {
  rule: string;
  path: string;
  message: string;
  severity: string;
}

export interface ContractValidationResult {
  has_violations: boolean;
  total_violations: number;
  violations: ContractViolation[];
}

export interface SpecUploadResult {
  message: string;
  endpoint_id: string;
  paths_count: number;
}

export async function uploadOpenApiSpec(
  endpointId: string,
  spec: object,
): Promise<SpecUploadResult> {
  const { data } = await apiClient.post<SpecUploadResult>(
    `${API}/contracts/${endpointId}/upload`,
    spec,
  );
  return data;
}

export async function getContractViolations(
  endpointId: string,
): Promise<ContractValidationResult> {
  const { data } = await apiClient.get<ContractValidationResult>(
    `${API}/contracts/${endpointId}/violations`,
  );
  return data;
}

export async function triggerContractValidation(
  endpointId: string,
): Promise<ContractValidationResult> {
  const { data } = await apiClient.post<ContractValidationResult>(
    `${API}/contracts/${endpointId}/validate`,
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
