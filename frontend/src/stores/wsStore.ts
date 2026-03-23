import { create } from "zustand";

export interface WsEvent {
  type: string;
  endpoint_id?: string;
  endpoint_name?: string;
  [key: string]: unknown;
}

const MAX_EVENTS = 50;

interface WsState {
  /** Whether the WebSocket is connected and authenticated */
  connected: boolean;
  /** Last event received from the server */
  lastEvent: WsEvent | null;
  /** Rolling buffer of recent events for the activity feed */
  events: WsEvent[];

  setConnected: (v: boolean) => void;
  setLastEvent: (e: WsEvent) => void;
  addEvent: (e: WsEvent) => void;
  clearEvents: () => void;
}

export const useWsStore = create<WsState>((set) => ({
  connected: false,
  lastEvent: null,
  events: [],

  setConnected: (v) => set({ connected: v }),
  setLastEvent: (e) => set({ lastEvent: e }),
  addEvent: (e) =>
    set((state) => ({
      events: [{ ...e, _ts: Date.now() }, ...state.events].slice(0, MAX_EVENTS),
    })),
  clearEvents: () => set({ events: [] }),
}));
