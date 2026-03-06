import { useQuery } from "@tanstack/react-query";
import { getOnboardingStatus } from "@/services/endpointsService.ts";

/** Fetch onboarding checklist status — refreshes every 60s */
export function useOnboarding() {
  return useQuery({
    queryKey: ["onboarding-status"],
    queryFn: getOnboardingStatus,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}
