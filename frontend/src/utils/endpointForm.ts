import type { AdvancedConfig } from "@/types/index.ts";
import type {
  KeyValuePair,
  AuthConfig,
  BodyConfig,
} from "@/types/apiTester.ts";

// ── Types ───────────────────────────────────────────────────────────────

export type InputMode = "form" | "curl";

export type ConfigTab =
  | "params"
  | "headers"
  | "auth"
  | "body"
  | "cookies"
  | "advanced";

export const HTTP_METHODS = [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "HEAD",
  "OPTIONS",
] as const;

// ── Helpers ─────────────────────────────────────────────────────────────

let _uid = 0;
export function uid(): string {
  return `ep_${++_uid}_${Date.now()}`;
}

export function emptyKV(): KeyValuePair {
  return { id: uid(), key: "", value: "", enabled: true };
}

export function defaultAuth(): AuthConfig {
  return {
    type: "none",
    bearer: { token: "" },
    basic: { username: "", password: "" },
    apiKey: { key: "X-API-Key", value: "", addTo: "header" },
  };
}

export function defaultBody(): BodyConfig {
  return {
    type: "none",
    raw: '{\n  \n}',
    formData: [emptyKV()],
    urlEncoded: [emptyKV()],
  };
}

export function defaultAdvanced(): AdvancedConfig {
  return {
    timeout_ms: 30000,
    retries: 0,
    retry_delay_ms: 1000,
    follow_redirects: true,
    expected_response_time_ms: null,
  };
}

/** Count non-empty enabled KV pairs */
export function kvCount(pairs: KeyValuePair[]): number {
  return pairs.filter((p) => p.enabled && p.key.trim()).length;
}

// ── KV List Helpers ─────────────────────────────────────────────────────

export function updateKVList(
  list: KeyValuePair[],
  id: string,
  field: "key" | "value",
  val: string,
): KeyValuePair[] {
  return list.map((kv) => (kv.id === id ? { ...kv, [field]: val } : kv));
}

export function toggleKVItem(list: KeyValuePair[], id: string): KeyValuePair[] {
  return list.map((kv) =>
    kv.id === id ? { ...kv, enabled: !kv.enabled } : kv,
  );
}

export function removeKVItem(list: KeyValuePair[], id: string): KeyValuePair[] {
  const filtered = list.filter((kv) => kv.id !== id);
  return filtered.length === 0 ? [emptyKV()] : filtered;
}

/** Hydrate KV pairs from server data, ensuring each has a unique id */
export function hydrateKV(data: KeyValuePair[] | null | undefined): KeyValuePair[] {
  if (!data || data.length === 0) return [emptyKV()];
  return data.map((kv) => ({ ...kv, id: kv.id || uid() }));
}

/** Strip empty KV rows before sending to backend */
export function cleanKV(pairs: KeyValuePair[]): KeyValuePair[] | undefined {
  const clean = pairs.filter((p) => p.key.trim());
  return clean.length > 0 ? clean : undefined;
}
