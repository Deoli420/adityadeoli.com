import { useState } from "react";
import {
  Bell,
  Plus,
  Trash2,
  X,
  Zap,
  AlertTriangle,
  Hash,
  GitBranch,
  Shield,
  Target,
  Loader2,
} from "lucide-react";
import {
  useAlertRules,
  useCreateAlertRule,
  useDeleteAlertRule,
  useToggleAlertRule,
} from "@/hooks/useAlertRules.ts";
import { Skeleton } from "@/components/common/Skeleton.tsx";
import { timeAgo } from "@/utils/formatters.ts";
import type { ConditionType } from "@/types/index.ts";
import clsx from "clsx";

const CONDITION_META: Record<
  ConditionType,
  { label: string; icon: React.ReactNode; unit: string; placeholder: string }
> = {
  LATENCY_ABOVE: {
    label: "Latency Above",
    icon: <Zap className="h-3.5 w-3.5" />,
    unit: "ms",
    placeholder: "e.g. 2000",
  },
  FAILURE_COUNT: {
    label: "Consecutive Failures",
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
    unit: "failures",
    placeholder: "e.g. 3",
  },
  STATUS_CODE: {
    label: "Status Code Equals",
    icon: <Hash className="h-3.5 w-3.5" />,
    unit: "",
    placeholder: "e.g. 500",
  },
  SCHEMA_CHANGE: {
    label: "Schema Change Detected",
    icon: <GitBranch className="h-3.5 w-3.5" />,
    unit: "",
    placeholder: "1",
  },
  RISK_ABOVE: {
    label: "Risk Score Above",
    icon: <Shield className="h-3.5 w-3.5" />,
    unit: "/100",
    placeholder: "e.g. 70",
  },
  SLA_BREACH: {
    label: "SLA Breach",
    icon: <Target className="h-3.5 w-3.5" />,
    unit: "",
    placeholder: "1",
  },
};

const CONDITION_TYPES = Object.keys(CONDITION_META) as ConditionType[];

export function AlertRulesPanel({ endpointId }: { endpointId: string }) {
  const { data: rules, isLoading } = useAlertRules(endpointId);
  const createMutation = useCreateAlertRule(endpointId);
  const deleteMutation = useDeleteAlertRule(endpointId);
  const toggleMutation = useToggleAlertRule(endpointId);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [conditionType, setConditionType] = useState<ConditionType>("LATENCY_ABOVE");
  const [threshold, setThreshold] = useState("");
  const [consecutiveCount, setConsecutiveCount] = useState("1");

  const resetForm = () => {
    setName("");
    setConditionType("LATENCY_ABOVE");
    setThreshold("");
    setConsecutiveCount("1");
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = parseFloat(threshold);
    if (isNaN(t) || t < 0) return;

    await createMutation.mutateAsync({
      endpoint_id: endpointId,
      name: name.trim(),
      condition_type: conditionType,
      threshold: t,
      consecutive_count: parseInt(consecutiveCount, 10) || 1,
    });
    resetForm();
  };

  if (isLoading) {
    return (
      <div className="card p-5">
        <h3 className="text-sm font-medium text-text-primary mb-4">Alert Rules</h3>
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const ruleList = rules ?? [];

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-text-tertiary" />
          <h3 className="text-sm font-medium text-text-primary">Alert Rules</h3>
          {ruleList.length > 0 && (
            <span className="text-[10px] text-text-tertiary bg-surface-secondary rounded-full px-1.5 py-0.5">
              {ruleList.filter((r) => r.is_active).length} active
            </span>
          )}
        </div>
        {!showForm && (
          <button
            className="btn-secondary text-xs"
            onClick={() => setShowForm(true)}
          >
            <Plus className="h-3 w-3" />
            Add Rule
          </button>
        )}
      </div>

      {/* Create rule form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-4 rounded-lg border border-border-subtle bg-surface-secondary/30 p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-text-primary">New Alert Rule</span>
            <button
              type="button"
              onClick={resetForm}
              className="text-text-tertiary hover:text-text-primary"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div>
            <label className="text-[11px] text-text-secondary mb-1 block">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. High Latency Alert"
              className="input w-full text-xs"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-text-secondary mb-1 block">Condition</label>
              <select
                value={conditionType}
                onChange={(e) => setConditionType(e.target.value as ConditionType)}
                className="input w-full text-xs"
              >
                {CONDITION_TYPES.map((ct) => (
                  <option key={ct} value={ct}>
                    {CONDITION_META[ct].label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] text-text-secondary mb-1 block">
                Threshold {CONDITION_META[conditionType].unit && `(${CONDITION_META[conditionType].unit})`}
              </label>
              <input
                type="number"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                placeholder={CONDITION_META[conditionType].placeholder}
                className="input w-full text-xs"
                min={0}
                step="any"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] text-text-secondary mb-1 block">
              Consecutive count (trigger after N consecutive matches)
            </label>
            <input
              type="number"
              value={consecutiveCount}
              onChange={(e) => setConsecutiveCount(e.target.value)}
              className="input w-24 text-xs"
              min={1}
              max={100}
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" className="btn-secondary text-xs" onClick={resetForm}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary text-xs"
              disabled={createMutation.isPending || !name.trim() || !threshold}
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Rule"
              )}
            </button>
          </div>
        </form>
      )}

      {/* Rules list */}
      {ruleList.length === 0 && !showForm ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Bell className="h-8 w-8 text-text-tertiary/50 mb-2" />
          <p className="text-xs text-text-tertiary">No alert rules configured.</p>
          <p className="text-[11px] text-text-tertiary mt-0.5">
            Create rules to get notified about specific conditions.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {ruleList.map((rule) => {
            const meta = CONDITION_META[rule.condition_type as ConditionType];
            return (
              <div
                key={rule.id}
                className={clsx(
                  "flex items-center gap-3 rounded-lg border p-3 transition-colors",
                  rule.is_active
                    ? "border-border-subtle bg-surface"
                    : "border-border-subtle/50 bg-surface-secondary/30 opacity-60",
                )}
              >
                {/* Icon */}
                <div
                  className={clsx(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                    rule.is_active ? "bg-accent/10 text-accent" : "bg-surface-tertiary text-text-tertiary",
                  )}
                >
                  {meta?.icon ?? <Bell className="h-3.5 w-3.5" />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-text-primary truncate">
                      {rule.name}
                    </span>
                    {rule.consecutive_count > 1 && (
                      <span className="text-[10px] text-text-tertiary bg-surface-secondary rounded px-1 py-0.5">
                        {rule.current_consecutive}/{rule.consecutive_count}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-text-secondary mt-0.5">
                    {meta?.label ?? rule.condition_type}
                    {" \u00b7 "}
                    Threshold: {rule.threshold}
                    {meta?.unit ? ` ${meta.unit}` : ""}
                    {rule.last_triggered_at && (
                      <>
                        {" \u00b7 "}
                        <span className="text-risk-medium">
                          Last triggered {timeAgo(rule.last_triggered_at)}
                        </span>
                      </>
                    )}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {/* Toggle */}
                  <button
                    onClick={() => toggleMutation.mutate(rule.id)}
                    className={clsx(
                      "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
                      rule.is_active ? "bg-accent" : "bg-surface-tertiary",
                    )}
                    title={rule.is_active ? "Disable" : "Enable"}
                  >
                    <span
                      className={clsx(
                        "inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform",
                        rule.is_active ? "translate-x-4" : "translate-x-1",
                      )}
                    />
                  </button>
                  {/* Delete */}
                  <button
                    onClick={() => deleteMutation.mutate(rule.id)}
                    className="p-1 rounded text-text-tertiary hover:text-risk-critical hover:bg-risk-critical-bg transition-colors"
                    title="Delete rule"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
