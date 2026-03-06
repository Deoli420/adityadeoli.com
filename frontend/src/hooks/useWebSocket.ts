import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore.ts";
import { useWsStore } from "@/stores/wsStore.ts";
import type { WsEvent } from "@/stores/wsStore.ts";
import toast from "react-hot-toast";

const WS_RECONNECT_DELAY = 3000;
const WS_MAX_RECONNECT_DELAY = 30000;

/**
 * Connects to the WebSocket server for real-time monitoring events.
 *
 * - Authenticates with the JWT access token
 * - Invalidates React Query caches on relevant events
 * - Shows toast notifications for anomalies and incidents
 * - Auto-reconnects with exponential backoff
 *
 * Mount this once at the layout level.
 */
export function useWebSocket() {
  const qc = useQueryClient();
  const accessToken = useAuthStore((s) => s.accessToken);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setConnected = useWsStore((s) => s.setConnected);
  const setLastEvent = useWsStore((s) => s.setLastEvent);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectDelay = useRef(WS_RECONNECT_DELAY);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const intentionalClose = useRef(false);

  const handleEvent = useCallback(
    (event: WsEvent) => {
      setLastEvent(event);

      switch (event.type) {
        case "new_run":
          // Invalidate run-related queries
          qc.invalidateQueries({ queryKey: ["endpoints"] });
          qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
          qc.invalidateQueries({ queryKey: ["dashboard-trends"] });
          qc.invalidateQueries({ queryKey: ["dashboard-top-failures"] });
          if (event.endpoint_id) {
            qc.invalidateQueries({ queryKey: ["endpoint-runs", event.endpoint_id] });
            qc.invalidateQueries({ queryKey: ["endpoint-performance", event.endpoint_id] });
          }
          break;

        case "risk_update":
          qc.invalidateQueries({ queryKey: ["dashboard-risk-distribution"] });
          qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
          if (event.endpoint_id) {
            qc.invalidateQueries({ queryKey: ["endpoint-risk", event.endpoint_id] });
          }
          break;

        case "anomaly_detected":
          qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
          qc.invalidateQueries({ queryKey: ["incidents"] });
          if (event.endpoint_id) {
            qc.invalidateQueries({ queryKey: ["endpoint-anomalies", event.endpoint_id] });
            qc.invalidateQueries({ queryKey: ["endpoint-incidents", event.endpoint_id] });
          }
          toast(`Anomaly detected on ${event.endpoint_name || "endpoint"}`, {
            icon: "\u26a0\ufe0f",
            duration: 4000,
          });
          break;

        case "incident_created":
          qc.invalidateQueries({ queryKey: ["incidents"] });
          if (event.endpoint_id) {
            qc.invalidateQueries({ queryKey: ["endpoint-incidents", event.endpoint_id] });
          }
          toast.error(`New incident: ${event.endpoint_name || "endpoint"}`, {
            duration: 5000,
          });
          break;

        case "sla_breach":
          qc.invalidateQueries({ queryKey: ["dashboard-uptime-overview"] });
          if (event.endpoint_id) {
            qc.invalidateQueries({ queryKey: ["endpoint-sla", event.endpoint_id] });
          }
          toast.error(`SLA breach: ${event.endpoint_name || "endpoint"}`, {
            duration: 5000,
          });
          break;
      }
    },
    [qc, setLastEvent],
  );

  const connect = useCallback(() => {
    if (!accessToken || !isAuthenticated) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    // Determine WS URL from current location
    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    const wsUrl = `${proto}//${host}/api/v1/ws/monitor`;

    intentionalClose.current = false;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      // Send auth message
      ws.send(JSON.stringify({ token: accessToken }));
      reconnectDelay.current = WS_RECONNECT_DELAY;
    };

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data) as WsEvent;
        if (data.type === "connected") {
          setConnected(true);
          return;
        }
        handleEvent(data);
      } catch {
        // Ignore malformed messages
      }
    };

    ws.onclose = () => {
      setConnected(false);
      wsRef.current = null;

      // Auto-reconnect unless intentionally closed
      if (!intentionalClose.current && isAuthenticated) {
        reconnectTimer.current = setTimeout(() => {
          reconnectDelay.current = Math.min(
            reconnectDelay.current * 1.5,
            WS_MAX_RECONNECT_DELAY,
          );
          connect();
        }, reconnectDelay.current);
      }
    };

    ws.onerror = () => {
      // onclose will fire next, triggering reconnect
    };
  }, [accessToken, isAuthenticated, setConnected, handleEvent]);

  useEffect(() => {
    connect();

    return () => {
      intentionalClose.current = true;
      clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
      setConnected(false);
    };
  }, [connect, setConnected]);
}
