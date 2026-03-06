import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getEndpointSLA,
  getEndpointUptime,
  createEndpointSLA,
  updateEndpointSLA,
  deleteEndpointSLA,
} from "@/services/endpointsService.ts";
import type { EndpointSLACreate, EndpointSLAUpdate } from "@/types/index.ts";
import toast from "react-hot-toast";

/** SLA config for a single endpoint */
export function useEndpointSLA(endpointId: string) {
  return useQuery({
    queryKey: ["endpoint-sla", endpointId],
    queryFn: () => getEndpointSLA(endpointId),
    enabled: !!endpointId,
    retry: false, // 404 is expected when no SLA is configured
  });
}

/** Uptime stats for an endpoint */
export function useEndpointUptime(endpointId: string) {
  return useQuery({
    queryKey: ["endpoint-uptime", endpointId],
    queryFn: () => getEndpointUptime(endpointId),
    enabled: !!endpointId,
    refetchInterval: 30_000,
    retry: false,
  });
}

/** Create SLA config */
export function useCreateSLA() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: EndpointSLACreate) => createEndpointSLA(payload),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: ["endpoint-sla", vars.endpoint_id] });
      void qc.invalidateQueries({ queryKey: ["endpoint-uptime", vars.endpoint_id] });
      void qc.invalidateQueries({ queryKey: ["dashboard-uptime-overview"] });
      toast.success("SLA target configured");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to create SLA");
    },
  });
}

/** Update SLA config */
export function useUpdateSLA(endpointId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: EndpointSLAUpdate) =>
      updateEndpointSLA(endpointId, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["endpoint-sla", endpointId] });
      void qc.invalidateQueries({ queryKey: ["endpoint-uptime", endpointId] });
      void qc.invalidateQueries({ queryKey: ["dashboard-uptime-overview"] });
      toast.success("SLA target updated");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to update SLA");
    },
  });
}

/** Delete SLA config */
export function useDeleteSLA(endpointId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => deleteEndpointSLA(endpointId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["endpoint-sla", endpointId] });
      void qc.invalidateQueries({ queryKey: ["endpoint-uptime", endpointId] });
      void qc.invalidateQueries({ queryKey: ["dashboard-uptime-overview"] });
      toast.success("SLA config removed");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to delete SLA");
    },
  });
}
