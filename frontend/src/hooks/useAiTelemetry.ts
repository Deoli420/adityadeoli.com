import { useQuery } from "@tanstack/react-query";
import {
  getAiTelemetryStats,
  getAiDailyBreakdown,
  getAiPerEndpoint,
  getAiHealth,
} from "@/services/endpointsService.ts";

// ── Queries ──────────────────────────────────────────────────────────────

export function useAiTelemetryStats(days = 30) {
  return useQuery({
    queryKey: ["ai-telemetry-stats", days],
    queryFn: () => getAiTelemetryStats(days),
    refetchInterval: 60_000,
  });
}

export function useAiDailyBreakdown(days = 30) {
  return useQuery({
    queryKey: ["ai-telemetry-daily", days],
    queryFn: () => getAiDailyBreakdown(days),
    refetchInterval: 60_000,
  });
}

export function useAiPerEndpoint(days = 30) {
  return useQuery({
    queryKey: ["ai-telemetry-by-endpoint", days],
    queryFn: () => getAiPerEndpoint(days),
    refetchInterval: 60_000,
  });
}

export function useAiHealth() {
  return useQuery({
    queryKey: ["ai-telemetry-health"],
    queryFn: () => getAiHealth(),
    refetchInterval: 30_000,
  });
}
