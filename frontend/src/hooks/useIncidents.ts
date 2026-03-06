import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  getIncidents,
  getIncident,
  getIncidentTimeline,
  getEndpointIncidents,
  createIncident,
  updateIncidentStatus,
  addIncidentNote,
} from "@/services/endpointsService.ts";
import type {
  IncidentCreate,
  IncidentStatusUpdate,
  IncidentNoteCreate,
} from "@/types/index.ts";
import { useWsStore } from "@/stores/wsStore.ts";

const wsInterval = (fast: number, slow: number) => () =>
  useWsStore.getState().connected ? slow : fast;

// ── Queries ──────────────────────────────────────────────────────────────

export function useIncidents(status?: string) {
  return useQuery({
    queryKey: ["incidents", status],
    queryFn: () => getIncidents(status),
    refetchInterval: wsInterval(30_000, 120_000),
  });
}

export function useIncident(id: string) {
  return useQuery({
    queryKey: ["incident", id],
    queryFn: () => getIncident(id),
    enabled: !!id,
    refetchInterval: wsInterval(15_000, 60_000),
  });
}

export function useIncidentTimeline(id: string) {
  return useQuery({
    queryKey: ["incident-timeline", id],
    queryFn: () => getIncidentTimeline(id),
    enabled: !!id,
    refetchInterval: wsInterval(15_000, 60_000),
  });
}

export function useEndpointIncidents(endpointId: string) {
  return useQuery({
    queryKey: ["endpoint-incidents", endpointId],
    queryFn: () => getEndpointIncidents(endpointId),
    enabled: !!endpointId,
    refetchInterval: wsInterval(30_000, 120_000),
  });
}

// ── Mutations ────────────────────────────────────────────────────────────

export function useCreateIncident() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: IncidentCreate) => createIncident(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["incidents"] });
      toast.success("Incident created");
    },
    onError: () => toast.error("Failed to create incident"),
  });
}

export function useUpdateIncidentStatus(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: IncidentStatusUpdate) => updateIncidentStatus(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["incidents"] });
      qc.invalidateQueries({ queryKey: ["incident", id] });
      qc.invalidateQueries({ queryKey: ["incident-timeline", id] });
      toast.success("Status updated");
    },
    onError: () => toast.error("Failed to update status"),
  });
}

export function useAddIncidentNote(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: IncidentNoteCreate) => addIncidentNote(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["incident", id] });
      qc.invalidateQueries({ queryKey: ["incident-timeline", id] });
      toast.success("Note added");
    },
    onError: () => toast.error("Failed to add note"),
  });
}
