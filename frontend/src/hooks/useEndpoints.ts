import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getEndpoints,
  createEndpoint,
  updateEndpoint,
  deleteEndpoint,
  getDashboardStats,
} from "@/services/endpointsService.ts";
import type { ApiEndpointCreate, ApiEndpointUpdate } from "@/types/index.ts";
import { useWsStore } from "@/stores/wsStore.ts";

const wsInterval = (fast: number, slow: number) => () =>
  useWsStore.getState().connected ? slow : fast;

export const ENDPOINTS_KEY = ["endpoints"] as const;

/** Fetch all endpoints — polls at 30s, slows to 120s when WS is connected */
export function useEndpoints() {
  return useQuery({
    queryKey: ENDPOINTS_KEY,
    queryFn: getEndpoints,
    refetchInterval: wsInterval(30_000, 120_000),
    staleTime: 10_000,
  });
}

/** Create a new endpoint */
export function useCreateEndpoint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ApiEndpointCreate) => createEndpoint(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ENDPOINTS_KEY });
    },
  });
}

/** Update an endpoint */
export function useUpdateEndpoint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ApiEndpointUpdate }) =>
      updateEndpoint(id, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ENDPOINTS_KEY });
    },
  });
}

/** Aggregate dashboard stats — polls at 30s, slows to 120s when WS is connected */
export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: getDashboardStats,
    refetchInterval: wsInterval(30_000, 120_000),
    staleTime: 10_000,
  });
}

/** Delete an endpoint */
export function useDeleteEndpoint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteEndpoint(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ENDPOINTS_KEY });
    },
  });
}
