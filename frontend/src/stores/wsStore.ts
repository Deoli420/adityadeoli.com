import { create } from "zustand";

export interface WsEvent {
  type: string;
  endpoint_id?: string;
  endpoint_name?: string;
  [key: string]: unknown;
}

interface WsState {
  /** Whether the WebSocket is connected and authenticated */
  connected: boolean;
  /** Last event received from the server */
  lastEvent: WsEvent | null;

  setConnected: (v: boolean) => void;
  setLastEvent: (e: WsEvent) => void;
}

export const useWsStore = create<WsState>((set) => ({
  connected: false,
  lastEvent: null,

  setConnected: (v) => set({ connected: v }),
  setLastEvent: (e) => set({ lastEvent: e }),
}));
