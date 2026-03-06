import { useQuery } from "@tanstack/react-query";
import {
  getSecurityFindings,
  getEndpointSecurityFindings,
  getSecurityStats,
} from "@/services/endpointsService.ts";

/** All findings for the org. */
export function useSecurityFindings(limit = 100, findingType?: string) {
  return useQuery({
    queryKey: ["security-findings", limit, findingType],
    queryFn: () => getSecurityFindings(limit, findingType),
  });
}

/** Findings scoped to a single endpoint. */
export function useEndpointSecurityFindings(
  endpointId: string,
  limit = 50,
) {
  return useQuery({
    queryKey: ["security-findings", endpointId, limit],
    queryFn: () => getEndpointSecurityFindings(endpointId, limit),
    enabled: !!endpointId,
  });
}

/** Aggregate security stats (by type, by severity, affected count). */
export function useSecurityStats(days = 30) {
  return useQuery({
    queryKey: ["security-stats", days],
    queryFn: () => getSecurityStats(days),
  });
}
