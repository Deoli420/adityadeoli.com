import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getEndpoint,
  getEndpointRuns,
  getEndpointAnomalies,
  getLatestRiskScore,
  getPerformance,
  triggerMonitorRun,
} from "@/services/endpointsService.ts";
import type { MonitorRunResult } from "@/types/index.ts";
import toast from "react-hot-toast";

/** Single endpoint by ID */
export function useEndpoint(id: string) {
  return useQuery({
    queryKey: ["endpoint", id],
    queryFn: () => getEndpoint(id),
    enabled: !!id,
  });
}

/** Recent runs for an endpoint */
export function useEndpointRuns(endpointId: string, limit = 50) {
  return useQuery({
    queryKey: ["endpoint-runs", endpointId, limit],
    queryFn: () => getEndpointRuns(endpointId, limit),
    enabled: !!endpointId,
    refetchInterval: 30_000,
  });
}

/** Anomalies for an endpoint */
export function useEndpointAnomalies(endpointId: string, limit = 50) {
  return useQuery({
    queryKey: ["endpoint-anomalies", endpointId, limit],
    queryFn: () => getEndpointAnomalies(endpointId, limit),
    enabled: !!endpointId,
    refetchInterval: 30_000,
  });
}

/** Latest risk score for an endpoint */
export function useLatestRisk(endpointId: string) {
  return useQuery({
    queryKey: ["endpoint-risk", endpointId],
    queryFn: () => getLatestRiskScore(endpointId),
    enabled: !!endpointId,
    refetchInterval: 30_000,
  });
}

/** Performance readout (rolling stats) */
export function usePerformance(endpointId: string, window = 20) {
  return useQuery({
    queryKey: ["endpoint-performance", endpointId, window],
    queryFn: () => getPerformance(endpointId, window),
    enabled: !!endpointId,
    refetchInterval: 30_000,
  });
}

/**
 * Trigger a monitor run — invalidates runs, risk, anomalies, and performance.
 *
 * Returns the full MonitorRunResult which includes transient schema_drift
 * and anomaly readouts. We cache the result so detail page can display it.
 */
export function useTriggerMonitorRun(endpointId: string) {
  const qc = useQueryClient();
  return useMutation<MonitorRunResult>({
    mutationFn: () => triggerMonitorRun(endpointId),
    onSuccess: (result) => {
      // Cache the last run result for schema drift + anomaly cards
      qc.setQueryData(["last-run-result", endpointId], result);

      // Invalidate all related queries
      qc.invalidateQueries({ queryKey: ["endpoint-runs", endpointId] });
      qc.invalidateQueries({ queryKey: ["endpoint-risk", endpointId] });
      qc.invalidateQueries({ queryKey: ["endpoint-anomalies", endpointId] });
      qc.invalidateQueries({ queryKey: ["endpoint-performance", endpointId] });
      qc.invalidateQueries({ queryKey: ["endpoints"] });

      // Toast notification
      const risk = result.risk;
      const statusCode = result.run.status_code ?? 0;
      const latency = result.run.response_time_ms?.toFixed(0) ?? "?";
      const isOk = statusCode >= 200 && statusCode < 400;

      if (isOk && (!risk || risk.calculated_score < 25)) {
        toast.success(`Run complete \u2014 ${statusCode} \u00b7 ${latency}ms`, {
          duration: 3000,
        });
      } else if (risk && risk.calculated_score >= 50) {
        toast.error(`Risk elevated \u2014 score ${risk.calculated_score}/100`, {
          duration: 4000,
        });
      } else {
        toast(`Run complete \u2014 ${statusCode}`, {
          duration: 3000,
        });
      }
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Monitor run failed",
        { duration: 4000 },
      );
    },
  });
}

/** Access the cached last run result (for schema drift / anomaly readouts) */
export function useLastRunResult(endpointId: string) {
  return useQuery<MonitorRunResult | null>({
    queryKey: ["last-run-result", endpointId],
    queryFn: () => null,
    enabled: false,
    staleTime: Infinity,
  });
}
