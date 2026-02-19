// ── Risk types ────────────────────────────────────────────────────────────

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface RiskScore {
  id: string;
  api_run_id: string;
  calculated_score: number;
  risk_level: RiskLevel;
  created_at: string;
}

/** Transient readout from the monitoring pipeline — includes breakdown */
export interface RiskReadout {
  calculated_score: number;
  risk_level: RiskLevel;
  status_score: number;
  performance_score: number;
  drift_score: number;
  ai_score: number;
  history_score: number;
}

/** Performance readout from the monitoring pipeline */
export interface PerformanceReadout {
  current_time_ms: number;
  rolling_avg_ms: number | null;
  rolling_median_ms: number | null;
  rolling_stddev_ms: number | null;
  deviation_percent: number | null;
  is_spike: boolean;
  is_critical_spike: boolean;
  sample_size: number;
  has_enough_data: boolean;
}

/** Schema drift types */
export interface FieldDifference {
  path: string;
  expected_type: string | null;
  actual_type: string | null;
}

export interface SchemaDriftReadout {
  has_drift: boolean;
  total_differences: number;
  missing_fields: FieldDifference[];
  new_fields: FieldDifference[];
  type_mismatches: FieldDifference[];
  skipped_reason: string | null;
}

/** Full monitoring result from POST /monitor/run/{endpoint_id} */
export interface MonitorRunResult {
  run: import("./apiRun.ts").ApiRun;
  performance: PerformanceReadout | null;
  schema_drift: SchemaDriftReadout | null;
  anomaly: import("./anomaly.ts").AnomalyReadout | null;
  risk: RiskReadout | null;
}
