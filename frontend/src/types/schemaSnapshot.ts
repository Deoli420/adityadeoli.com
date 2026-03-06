// ── Schema Snapshot types ───────────────────────────────────────────────────

export interface DiffSummary {
  has_drift: boolean;
  total_differences: number;
  missing_fields: { path: string; expected_type?: string }[];
  new_fields: { path: string; actual_type?: string }[];
  type_mismatches: {
    path: string;
    expected_type?: string;
    actual_type?: string;
  }[];
}

export interface SchemaSnapshot {
  id: string;
  endpoint_id: string;
  schema_hash: string;
  field_count: number;
  diff_summary: DiffSummary | null;
  created_at: string;
}

export interface SchemaHistoryResponse {
  snapshots: SchemaSnapshot[];
}

export interface SchemaDiffResponse {
  snapshot_a_id: string;
  snapshot_b_id: string;
  diff: DiffSummary;
}
