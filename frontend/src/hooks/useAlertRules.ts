import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  getAlertRules,
  createAlertRule,
  updateAlertRule,
  deleteAlertRule,
  toggleAlertRule,
} from "@/services/endpointsService.ts";
import type { AlertRuleCreate, AlertRuleUpdate } from "@/types/index.ts";

const STALE = 30_000;

export function useAlertRules(endpointId: string) {
  return useQuery({
    queryKey: ["alert-rules", endpointId],
    queryFn: () => getAlertRules(endpointId),
    staleTime: STALE,
    refetchInterval: 60_000,
  });
}

export function useCreateAlertRule(endpointId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: AlertRuleCreate) => createAlertRule(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["alert-rules", endpointId] });
      toast.success("Alert rule created");
    },
    onError: () => toast.error("Failed to create alert rule"),
  });
}

export function useUpdateAlertRule(endpointId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ruleId, data }: { ruleId: string; data: AlertRuleUpdate }) =>
      updateAlertRule(ruleId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["alert-rules", endpointId] });
      toast.success("Alert rule updated");
    },
    onError: () => toast.error("Failed to update alert rule"),
  });
}

export function useDeleteAlertRule(endpointId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ruleId: string) => deleteAlertRule(ruleId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["alert-rules", endpointId] });
      toast.success("Alert rule deleted");
    },
    onError: () => toast.error("Failed to delete alert rule"),
  });
}

export function useToggleAlertRule(endpointId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ruleId: string) => toggleAlertRule(ruleId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["alert-rules", endpointId] });
    },
    onError: () => toast.error("Failed to toggle alert rule"),
  });
}
