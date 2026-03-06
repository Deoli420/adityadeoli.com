import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  triggerDebugAnalysis,
  getLatestDebugSuggestion,
} from "@/services/endpointsService.ts";

export function useLatestDebugSuggestion(endpointId: string) {
  return useQuery({
    queryKey: ["debug-suggestion", endpointId],
    queryFn: () => getLatestDebugSuggestion(endpointId),
    enabled: !!endpointId,
  });
}

export function useTriggerDebug(endpointId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => triggerDebugAnalysis(endpointId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["debug-suggestion", endpointId] });
      toast.success("Debug analysis complete");
    },
    onError: (err: Error) => {
      const msg = err.message || "Debug analysis failed";
      toast.error(msg.includes("503") ? "AI not available" : msg);
    },
  });
}
