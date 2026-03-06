import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getSchemaHistory,
  getSchemaSnapshots,
  getSchemaDiff,
  acceptSchema,
} from "@/services/endpointsService.ts";
import toast from "react-hot-toast";

/** Schema drift history (snapshots with diffs) for an endpoint */
export function useSchemaHistory(endpointId: string, limit = 50) {
  return useQuery({
    queryKey: ["schema-history", endpointId, limit],
    queryFn: () => getSchemaHistory(endpointId, limit),
    enabled: !!endpointId,
    refetchInterval: 60_000,
  });
}

/** All schema snapshots for an endpoint */
export function useSchemaSnapshots(endpointId: string, limit = 50) {
  return useQuery({
    queryKey: ["schema-snapshots", endpointId, limit],
    queryFn: () => getSchemaSnapshots(endpointId, limit),
    enabled: !!endpointId,
    refetchInterval: 60_000,
  });
}

/** Diff between two specific snapshots */
export function useSchemaDiff(
  endpointId: string,
  snapA: string | null,
  snapB: string | null,
) {
  return useQuery({
    queryKey: ["schema-diff", endpointId, snapA, snapB],
    queryFn: () => getSchemaDiff(endpointId, snapA!, snapB!),
    enabled: !!endpointId && !!snapA && !!snapB,
  });
}

/** Accept the current schema as expected */
export function useAcceptSchema(endpointId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => acceptSchema(endpointId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["schema-history", endpointId] });
      void qc.invalidateQueries({ queryKey: ["schema-snapshots", endpointId] });
      void qc.invalidateQueries({ queryKey: ["endpoint", endpointId] });
      toast.success("Schema accepted as expected");
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : "Failed to accept schema",
      );
    },
  });
}
