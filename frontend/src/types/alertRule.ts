export type ConditionType =
  | "LATENCY_ABOVE"
  | "FAILURE_COUNT"
  | "STATUS_CODE"
  | "SCHEMA_CHANGE"
  | "RISK_ABOVE"
  | "SLA_BREACH";

export interface AlertRule {
  id: string;
  endpoint_id: string;
  organization_id: string;
  name: string;
  condition_type: ConditionType;
  threshold: number;
  consecutive_count: number;
  current_consecutive: number;
  is_active: boolean;
  last_triggered_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AlertRuleCreate {
  endpoint_id: string;
  name: string;
  condition_type: ConditionType;
  threshold: number;
  consecutive_count?: number;
}

export interface AlertRuleUpdate {
  name?: string;
  condition_type?: ConditionType;
  threshold?: number;
  consecutive_count?: number;
  is_active?: boolean;
}
