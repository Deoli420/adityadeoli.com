/** Security finding — a detected credential leak or sensitive data exposure. */
export interface SecurityFinding {
  id: string;
  api_run_id: string;
  endpoint_id: string;
  finding_type: string;
  pattern_name: string;
  field_path: string | null;
  severity: string;
  redacted_preview: string | null;
  match_count: number;
  created_at: string;
}

export interface TypeBreakdown {
  type: string;
  count: number;
}

export interface SeverityBreakdown {
  severity: string;
  count: number;
}

export interface SecurityStats {
  total_findings: number;
  by_type: TypeBreakdown[];
  by_severity: SeverityBreakdown[];
  affected_endpoints: number;
  period_days: number;
}
