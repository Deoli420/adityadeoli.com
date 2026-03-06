import { useQuery } from "@tanstack/react-query";
import {
  getResponseTrends,
  getTopFailures,
  getRiskDistribution,
  getUptimeOverview,
} from "@/services/endpointsService.ts";
import { useWsStore } from "@/stores/wsStore.ts";

const wsInterval = (fast: number, slow: number) => () =>
  useWsStore.getState().connected ? slow : fast;

/** Hourly response-time trend — polls at 60s, slows to 180s when WS connected */
export function useResponseTrends(hours = 24) {
  return useQuery({
    queryKey: ["dashboard-trends", hours],
    queryFn: () => getResponseTrends(hours),
    refetchInterval: wsInterval(60_000, 180_000),
    staleTime: 30_000,
  });
}

/** Top endpoints by failure rate */
export function useTopFailures(limit = 5) {
  return useQuery({
    queryKey: ["dashboard-top-failures", limit],
    queryFn: () => getTopFailures(limit),
    refetchInterval: wsInterval(60_000, 180_000),
    staleTime: 30_000,
  });
}

/** Risk distribution across all endpoints */
export function useRiskDistribution() {
  return useQuery({
    queryKey: ["dashboard-risk-distribution"],
    queryFn: getRiskDistribution,
    refetchInterval: wsInterval(60_000, 180_000),
    staleTime: 30_000,
  });
}

/** SLA uptime overview for all endpoints with active SLAs */
export function useUptimeOverview() {
  return useQuery({
    queryKey: ["dashboard-uptime-overview"],
    queryFn: getUptimeOverview,
    refetchInterval: wsInterval(60_000, 180_000),
    staleTime: 30_000,
  });
}
