export type IncidentStatus = "OPEN" | "INVESTIGATING" | "RESOLVED";
export type IncidentSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type TriggerType = "anomaly" | "alert_rule" | "manual";

export interface Incident {
  id: string;
  endpoint_id: string;
  organization_id: string;
  title: string;
  status: IncidentStatus;
  severity: IncidentSeverity;
  trigger_type: TriggerType;
  trigger_run_id: string | null;
  notes: string | null;
  started_at: string;
  acknowledged_at: string | null;
  resolved_at: string | null;
  auto_resolve_after: number;
  created_at: string;
  updated_at: string;
}

export interface IncidentListItem {
  id: string;
  endpoint_id: string;
  title: string;
  status: IncidentStatus;
  severity: IncidentSeverity;
  trigger_type: TriggerType;
  started_at: string;
  resolved_at: string | null;
  endpoint_name: string;
}

export interface IncidentEvent {
  id: string;
  incident_id: string;
  event_type: string;
  detail: Record<string, unknown> | null;
  created_at: string;
}

export interface IncidentCreate {
  endpoint_id: string;
  title: string;
  severity: IncidentSeverity;
  trigger_type: TriggerType;
  trigger_run_id?: string;
  notes?: string;
  auto_resolve_after?: number;
}

export interface IncidentStatusUpdate {
  status: IncidentStatus;
}

export interface IncidentNoteCreate {
  note: string;
}
