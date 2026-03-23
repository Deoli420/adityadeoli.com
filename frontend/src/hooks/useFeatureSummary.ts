import { useQuery } from "@tanstack/react-query";
import { getFeatureSummary } from "@/services/endpointsService.ts";
import { useWsStore } from "@/stores/wsStore.ts";

const wsInterval = (fast: number, slow: number) => () =>
  useWsStore.getState().connected ? slow : fast;

/**
 * Aggregated feature counts for the dashboard discovery row.
 * Provides security findings, schema drifts, AI analyses (24h),
 * and high-risk endpoints in a single lightweight query.
 */
export function useFeatureSummary() {
  return useQuery({
    queryKey: ["feature-summary"],
    queryFn: getFeatureSummary,
    refetchInterval: wsInterval(60_000, 180_000),
  });
}
