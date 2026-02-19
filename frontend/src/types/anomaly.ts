// ── Anomaly types ─────────────────────────────────────────────────────────

export interface Anomaly {
  id: string;
  api_run_id: string;
  anomaly_detected: boolean;
  severity_score: number;
  reasoning: string | null;
  probable_cause: string | null;
  created_at: string;
}

/** Transient readout from the monitoring pipeline */
export interface AnomalyReadout {
  anomaly_detected: boolean;
  severity_score: number;
  reasoning: string;
  probable_cause: string;
  skipped_reason: string | null;
  ai_called: boolean;
}
