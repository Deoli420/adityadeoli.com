import { create } from "zustand";
import type {
  HttpMethod,
  RequestConfig,
  ResponseData,
  HistoryEntry,
  KeyValuePair,
  AuthConfig,
  BodyConfig,
  AuthType,
  BodyType,
  ApiKeyLocation,
} from "@/types/apiTester.ts";

// ── Helpers ──────────────────────────────────────────────────────────────

let _uid = 0;
export function uid(): string {
  return `kv_${++_uid}_${Date.now()}`;
}

export function emptyKV(): KeyValuePair {
  return { id: uid(), key: "", value: "", enabled: true };
}

function defaultAuth(): AuthConfig {
  return {
    type: "none",
    bearer: { token: "" },
    basic: { username: "", password: "" },
    apiKey: { key: "X-API-Key", value: "", addTo: "header" },
  };
}

function defaultBody(): BodyConfig {
  return {
    type: "none",
    raw: "{\n  \n}",
    formData: [emptyKV()],
    urlEncoded: [emptyKV()],
  };
}

export function defaultRequest(): RequestConfig {
  return {
    method: "GET",
    url: "",
    params: [emptyKV()],
    headers: [emptyKV()],
    auth: defaultAuth(),
    body: defaultBody(),
  };
}

// ── Store ────────────────────────────────────────────────────────────────

interface ApiTesterState {
  /** Current request being edited */
  request: RequestConfig;

  /** Latest response after sending */
  response: ResponseData | null;

  /** Is a request in flight? */
  sending: boolean;

  /** Active tab in the request config panel */
  activeTab: "params" | "auth" | "headers" | "body";

  /** Active tab in the response panel */
  responseTab: "body" | "headers";

  /** Request history (most recent first, max 50) */
  history: HistoryEntry[];

  /** ID of loaded saved request (null if new) */
  loadedRequestId: string | null;

  // ── Actions ────────────────────────────────────────────────
  setMethod: (method: HttpMethod) => void;
  setUrl: (url: string) => void;
  setActiveTab: (tab: ApiTesterState["activeTab"]) => void;
  setResponseTab: (tab: ApiTesterState["responseTab"]) => void;

  // Params
  setParams: (params: KeyValuePair[]) => void;
  addParam: () => void;
  updateParam: (id: string, field: "key" | "value", val: string) => void;
  toggleParam: (id: string) => void;
  removeParam: (id: string) => void;

  // Headers
  setHeaders: (headers: KeyValuePair[]) => void;
  addHeader: () => void;
  updateHeader: (id: string, field: "key" | "value", val: string) => void;
  toggleHeader: (id: string) => void;
  removeHeader: (id: string) => void;

  // Auth
  setAuthType: (type: AuthType) => void;
  setBearerToken: (token: string) => void;
  setBasicAuth: (field: "username" | "password", val: string) => void;
  setApiKey: (field: "key" | "value", val: string) => void;
  setApiKeyLocation: (loc: ApiKeyLocation) => void;

  // Body
  setBodyType: (type: BodyType) => void;
  setRawBody: (raw: string) => void;
  setFormData: (data: KeyValuePair[]) => void;
  addFormData: () => void;
  updateFormData: (id: string, field: "key" | "value", val: string) => void;
  toggleFormData: (id: string) => void;
  removeFormData: (id: string) => void;
  setUrlEncoded: (data: KeyValuePair[]) => void;
  addUrlEncoded: () => void;
  updateUrlEncoded: (id: string, field: "key" | "value", val: string) => void;
  toggleUrlEncoded: (id: string) => void;
  removeUrlEncoded: (id: string) => void;

  // Request lifecycle
  setSending: (sending: boolean) => void;
  setResponse: (response: ResponseData | null) => void;
  addHistory: (entry: HistoryEntry) => void;
  clearHistory: () => void;

  // Load / Reset
  loadRequest: (request: RequestConfig, id?: string | null) => void;
  resetRequest: () => void;
}

// Generic KV helpers
function updateKVList(
  list: KeyValuePair[],
  id: string,
  field: "key" | "value",
  val: string,
): KeyValuePair[] {
  return list.map((kv) => (kv.id === id ? { ...kv, [field]: val } : kv));
}

function toggleKVItem(list: KeyValuePair[], id: string): KeyValuePair[] {
  return list.map((kv) =>
    kv.id === id ? { ...kv, enabled: !kv.enabled } : kv,
  );
}

function removeKVItem(list: KeyValuePair[], id: string): KeyValuePair[] {
  const filtered = list.filter((kv) => kv.id !== id);
  return filtered.length === 0 ? [emptyKV()] : filtered;
}

export const useApiTesterStore = create<ApiTesterState>((set) => ({
  request: defaultRequest(),
  response: null,
  sending: false,
  activeTab: "params",
  responseTab: "body",
  history: [],
  loadedRequestId: null,

  // Method + URL
  setMethod: (method) =>
    set((s) => ({ request: { ...s.request, method } })),
  setUrl: (url) =>
    set((s) => ({ request: { ...s.request, url } })),
  setActiveTab: (activeTab) => set({ activeTab }),
  setResponseTab: (responseTab) => set({ responseTab }),

  // Params
  setParams: (params) =>
    set((s) => ({ request: { ...s.request, params } })),
  addParam: () =>
    set((s) => ({
      request: { ...s.request, params: [...s.request.params, emptyKV()] },
    })),
  updateParam: (id, field, val) =>
    set((s) => ({
      request: {
        ...s.request,
        params: updateKVList(s.request.params, id, field, val),
      },
    })),
  toggleParam: (id) =>
    set((s) => ({
      request: { ...s.request, params: toggleKVItem(s.request.params, id) },
    })),
  removeParam: (id) =>
    set((s) => ({
      request: { ...s.request, params: removeKVItem(s.request.params, id) },
    })),

  // Headers
  setHeaders: (headers) =>
    set((s) => ({ request: { ...s.request, headers } })),
  addHeader: () =>
    set((s) => ({
      request: { ...s.request, headers: [...s.request.headers, emptyKV()] },
    })),
  updateHeader: (id, field, val) =>
    set((s) => ({
      request: {
        ...s.request,
        headers: updateKVList(s.request.headers, id, field, val),
      },
    })),
  toggleHeader: (id) =>
    set((s) => ({
      request: { ...s.request, headers: toggleKVItem(s.request.headers, id) },
    })),
  removeHeader: (id) =>
    set((s) => ({
      request: { ...s.request, headers: removeKVItem(s.request.headers, id) },
    })),

  // Auth
  setAuthType: (type) =>
    set((s) => ({
      request: { ...s.request, auth: { ...s.request.auth, type } },
    })),
  setBearerToken: (token) =>
    set((s) => ({
      request: {
        ...s.request,
        auth: { ...s.request.auth, bearer: { token } },
      },
    })),
  setBasicAuth: (field, val) =>
    set((s) => ({
      request: {
        ...s.request,
        auth: {
          ...s.request.auth,
          basic: { ...s.request.auth.basic, [field]: val },
        },
      },
    })),
  setApiKey: (field, val) =>
    set((s) => ({
      request: {
        ...s.request,
        auth: {
          ...s.request.auth,
          apiKey: { ...s.request.auth.apiKey, [field]: val },
        },
      },
    })),
  setApiKeyLocation: (loc) =>
    set((s) => ({
      request: {
        ...s.request,
        auth: {
          ...s.request.auth,
          apiKey: { ...s.request.auth.apiKey, addTo: loc },
        },
      },
    })),

  // Body
  setBodyType: (type) =>
    set((s) => ({
      request: {
        ...s.request,
        body: { ...s.request.body, type },
      },
    })),
  setRawBody: (raw) =>
    set((s) => ({
      request: {
        ...s.request,
        body: { ...s.request.body, raw },
      },
    })),
  setFormData: (formData) =>
    set((s) => ({
      request: { ...s.request, body: { ...s.request.body, formData } },
    })),
  addFormData: () =>
    set((s) => ({
      request: {
        ...s.request,
        body: {
          ...s.request.body,
          formData: [...s.request.body.formData, emptyKV()],
        },
      },
    })),
  updateFormData: (id, field, val) =>
    set((s) => ({
      request: {
        ...s.request,
        body: {
          ...s.request.body,
          formData: updateKVList(s.request.body.formData, id, field, val),
        },
      },
    })),
  toggleFormData: (id) =>
    set((s) => ({
      request: {
        ...s.request,
        body: {
          ...s.request.body,
          formData: toggleKVItem(s.request.body.formData, id),
        },
      },
    })),
  removeFormData: (id) =>
    set((s) => ({
      request: {
        ...s.request,
        body: {
          ...s.request.body,
          formData: removeKVItem(s.request.body.formData, id),
        },
      },
    })),
  setUrlEncoded: (urlEncoded) =>
    set((s) => ({
      request: { ...s.request, body: { ...s.request.body, urlEncoded } },
    })),
  addUrlEncoded: () =>
    set((s) => ({
      request: {
        ...s.request,
        body: {
          ...s.request.body,
          urlEncoded: [...s.request.body.urlEncoded, emptyKV()],
        },
      },
    })),
  updateUrlEncoded: (id, field, val) =>
    set((s) => ({
      request: {
        ...s.request,
        body: {
          ...s.request.body,
          urlEncoded: updateKVList(s.request.body.urlEncoded, id, field, val),
        },
      },
    })),
  toggleUrlEncoded: (id) =>
    set((s) => ({
      request: {
        ...s.request,
        body: {
          ...s.request.body,
          urlEncoded: toggleKVItem(s.request.body.urlEncoded, id),
        },
      },
    })),
  removeUrlEncoded: (id) =>
    set((s) => ({
      request: {
        ...s.request,
        body: {
          ...s.request.body,
          urlEncoded: removeKVItem(s.request.body.urlEncoded, id),
        },
      },
    })),

  // Request lifecycle
  setSending: (sending) => set({ sending }),
  setResponse: (response) => set({ response }),
  addHistory: (entry) =>
    set((s) => ({
      history: [entry, ...s.history].slice(0, 50),
    })),
  clearHistory: () => set({ history: [] }),

  // Load / Reset
  loadRequest: (request, id = null) =>
    set({ request, response: null, loadedRequestId: id }),
  resetRequest: () =>
    set({
      request: defaultRequest(),
      response: null,
      loadedRequestId: null,
    }),
}));
