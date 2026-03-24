import { useQuery } from "@tanstack/react-query";
import { getIncidentSimilar } from "@/services/endpointsService.ts";

export function useIncidentSimilar(incidentId: string) {
  return useQuery({
    queryKey: ["incident-similar", incidentId],
    queryFn: () => getIncidentSimilar(incidentId),
    enabled: !!incidentId,
    staleTime: 5 * 60 * 1000,
  });
}
