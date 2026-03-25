import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { getClusters, getCluster, updateCluster } from "@/services/endpointsService.ts";
import { extractApiError } from "@/utils/extractApiError.ts";
import { useWsStore } from "@/stores/wsStore.ts";

const wsInterval = (fast: number, slow: number) => () =>
  useWsStore.getState().connected ? slow : fast;

export function useClusters(status?: string) {
  return useQuery({
    queryKey: ["clusters", status],
    queryFn: () => getClusters(status),
    refetchInterval: wsInterval(30_000, 120_000),
  });
}

export function useCluster(id: string) {
  return useQuery({
    queryKey: ["cluster", id],
    queryFn: () => getCluster(id),
    enabled: !!id,
    refetchInterval: wsInterval(15_000, 60_000),
  });
}

export function useUpdateCluster(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { title?: string; root_cause_summary?: string }) => updateCluster(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cluster", id] });
      qc.invalidateQueries({ queryKey: ["clusters"] });
      toast.success("Cluster updated");
    },
    onError: (err) => toast.error(extractApiError(err, "Failed to update cluster")),
  });
}
