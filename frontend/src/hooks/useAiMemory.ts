import { useQuery } from "@tanstack/react-query";
import { getIncidentSuggestedFixes } from "@/services/endpointsService.ts";

export function useSuggestedFixes(incidentId: string) {
  return useQuery({
    queryKey: ["incident-suggested-fixes", incidentId],
    queryFn: () => getIncidentSuggestedFixes(incidentId),
    enabled: !!incidentId,
    staleTime: 5 * 60 * 1000,
  });
}
