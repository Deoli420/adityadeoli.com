/**
 * Request execution engine — builds and sends HTTP requests
 * from the API tester configuration.
 *
 * Two modes:
 *   1. `executeRequest()` — direct browser fetch (same-origin only, CORS applies)
 *   2. `proxyRequest()`  — routes through backend proxy, bypasses CORS entirely
 *
 * The proxy mode POSTs to /api/v1/proxy/test-request using the authenticated
 * apiClient, so the backend executes the HTTP call server-side with httpx.
 */
import type {
  RequestConfig,
  ResponseData,
  ResponseTiming,
  KeyValuePair,
} from "@/types/apiTester.ts";
import apiClient from "./apiClient.ts";

/** Build query string from enabled params */
function buildQueryString(params: KeyValuePair[]): string {
  const enabled = params.filter((p) => p.enabled && p.key.trim());
  if (enabled.length === 0) return "";
  const sp = new URLSearchParams();
  enabled.forEach((p) => sp.append(p.key, p.value));
  return "?" + sp.toString();
}

/** Merge URL with query params, preserving any existing params */
function buildFullUrl(url: string, params: KeyValuePair[]): string {
  const qs = buildQueryString(params);
  if (!qs) return url;

  // If url already has query params, append with &
  if (url.includes("?")) {
    return url + "&" + qs.slice(1);
  }
  return url + qs;
}

/** Build headers map from config (params, auth, custom headers) */
function buildHeaders(config: RequestConfig): Record<string, string> {
  const headers: Record<string, string> = {};

  // Custom headers (enabled only)
  config.headers
    .filter((h) => h.enabled && h.key.trim())
    .forEach((h) => {
      headers[h.key] = h.value;
    });

  // Auth headers
  const { auth } = config;
  switch (auth.type) {
    case "bearer":
      if (auth.bearer.token.trim()) {
        headers["Authorization"] = `Bearer ${auth.bearer.token}`;
      }
      break;
    case "basic": {
      if (auth.basic.username.trim()) {
        const encoded = btoa(`${auth.basic.username}:${auth.basic.password}`);
        headers["Authorization"] = `Basic ${encoded}`;
      }
      break;
    }
    case "api-key":
      if (auth.apiKey.addTo === "header" && auth.apiKey.key.trim()) {
        headers[auth.apiKey.key] = auth.apiKey.value;
      }
      break;
  }

  // Content-Type for body (if not already set)
  if (!headers["Content-Type"] && config.body.type !== "none") {
    switch (config.body.type) {
      case "json":
        headers["Content-Type"] = "application/json";
        break;
      case "x-www-form-urlencoded":
        headers["Content-Type"] = "application/x-www-form-urlencoded";
        break;
      // form-data: browser sets it with boundary automatically
    }
  }

  return headers;
}

/** Build the request body */
function buildBody(config: RequestConfig): BodyInit | null {
  const { body, method } = config;

  // GET and HEAD typically have no body
  if (method === "GET" || method === "HEAD") return null;
  if (body.type === "none") return null;

  switch (body.type) {
    case "json":
      return body.raw;

    case "form-data": {
      const formData = new FormData();
      body.formData
        .filter((f) => f.enabled && f.key.trim())
        .forEach((f) => formData.append(f.key, f.value));
      return formData;
    }

    case "x-www-form-urlencoded": {
      const params = new URLSearchParams();
      body.urlEncoded
        .filter((f) => f.enabled && f.key.trim())
        .forEach((f) => params.append(f.key, f.value));
      return params.toString();
    }

    default:
      return null;
  }
}

/** Add API key to URL as query param if configured */
function applyApiKeyToUrl(url: string, config: RequestConfig): string {
  const { auth } = config;
  if (
    auth.type === "api-key" &&
    auth.apiKey.addTo === "query" &&
    auth.apiKey.key.trim()
  ) {
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}${encodeURIComponent(auth.apiKey.key)}=${encodeURIComponent(auth.apiKey.value)}`;
  }
  return url;
}

/**
 * Execute a request and return the response data.
 *
 * Uses fetch() instead of Axios to avoid auth interceptors
 * and to get proper timing/size information.
 */
export async function executeRequest(
  config: RequestConfig,
): Promise<ResponseData> {
  // Validate URL
  let url = config.url.trim();
  if (!url) {
    throw new Error("URL is required");
  }
  // Add protocol if missing
  if (!url.match(/^https?:\/\//i)) {
    url = "https://" + url;
  }

  // Build full URL with params
  url = buildFullUrl(url, config.params);
  url = applyApiKeyToUrl(url, config);

  // Build headers
  const headers = buildHeaders(config);

  // Build body
  const body = buildBody(config);

  // If body is FormData, don't set Content-Type (browser does it)
  if (body instanceof FormData) {
    delete headers["Content-Type"];
  }

  const timing: ResponseTiming = {
    start: Date.now(),
    end: 0,
    duration: 0,
  };

  try {
    const response = await fetch(url, {
      method: config.method,
      headers,
      body,
      // Don't follow redirects so we can see the actual status
      redirect: "follow",
    });

    timing.end = Date.now();
    timing.duration = timing.end - timing.start;

    // Read response
    const responseText = await response.text();
    const size = new Blob([responseText]).size;

    // Extract response headers
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    return {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      body: responseText,
      size,
      timing,
    };
  } catch (err) {
    timing.end = Date.now();
    timing.duration = timing.end - timing.start;

    // Network error, CORS, etc.
    const message =
      err instanceof TypeError
        ? `Network error: ${err.message}. This may be a CORS issue.`
        : err instanceof Error
          ? err.message
          : "Request failed";

    return {
      status: 0,
      statusText: "Error",
      headers: {},
      body: "",
      size: 0,
      timing,
      error: message,
    };
  }
}

// ── Proxy-based request execution (bypasses CORS) ─────────────────────

/**
 * Build the proxy-compatible payload from a RequestConfig.
 * Maps frontend types to the backend ProxyRequest schema.
 */
function buildProxyPayload(config: RequestConfig) {
  let url = config.url.trim();
  if (!url) throw new Error("URL is required");
  if (!url.match(/^https?:\/\//i)) url = "https://" + url;

  // Query params — only enabled, non-empty
  const params = config.params
    .filter((p) => p.enabled && p.key.trim())
    .map((p) => ({ key: p.key, value: p.value, enabled: true }));

  // Headers — only enabled, non-empty
  const headers = config.headers
    .filter((h) => h.enabled && h.key.trim())
    .map((h) => ({ key: h.key, value: h.value, enabled: true }));

  // Auth mapping
  const auth: Record<string, unknown> = { type: config.auth.type };
  if (config.auth.type === "bearer") {
    auth.bearer = { token: config.auth.bearer.token };
  } else if (config.auth.type === "basic") {
    auth.basic = {
      username: config.auth.basic.username,
      password: config.auth.basic.password,
    };
  } else if (config.auth.type === "api-key") {
    auth.apiKey = {
      key: config.auth.apiKey.key,
      value: config.auth.apiKey.value,
      addTo: config.auth.apiKey.addTo,
    };
  }

  // Body mapping
  const body: Record<string, unknown> = { type: config.body.type };
  if (config.body.type === "json") {
    body.raw = config.body.raw;
  } else if (config.body.type === "form-data") {
    body.formData = config.body.formData
      .filter((f) => f.enabled && f.key.trim())
      .map((f) => ({ key: f.key, value: f.value, enabled: true }));
  } else if (config.body.type === "x-www-form-urlencoded") {
    body.urlEncoded = config.body.urlEncoded
      .filter((f) => f.enabled && f.key.trim())
      .map((f) => ({ key: f.key, value: f.value, enabled: true }));
  }

  return {
    method: config.method,
    url,
    params: params.length > 0 ? params : undefined,
    headers: headers.length > 0 ? headers : undefined,
    auth: config.auth.type !== "none" ? auth : undefined,
    body: config.body.type !== "none" ? body : undefined,
  };
}

/**
 * Execute a request through the backend proxy (bypasses CORS).
 *
 * Sends POST /api/v1/proxy/test-request with the request config.
 * The backend makes the actual HTTP call server-side using httpx.
 */
export async function proxyRequest(
  config: RequestConfig,
): Promise<ResponseData> {
  try {
    const payload = buildProxyPayload(config);
    const { data } = await apiClient.post(
      "/api/v1/proxy/test-request",
      payload,
    );

    // Map backend ProxyResponse to frontend ResponseData
    return {
      status: data.status,
      statusText: data.statusText,
      headers: data.headers,
      body: data.body,
      size: data.size,
      timing: data.timing,
      error: data.error || undefined,
    };
  } catch (err) {
    // apiClient errors (network, auth, etc.)
    const message =
      err instanceof Error ? err.message : "Proxy request failed";
    return {
      status: 0,
      statusText: "Error",
      headers: {},
      body: "",
      size: 0,
      timing: { start: Date.now(), end: Date.now(), duration: 0 },
      error: message,
    };
  }
}

/** Generate a cURL command from the request config */
export function exportCurl(config: RequestConfig): string {
  let url = config.url.trim();
  if (!url) return "";
  if (!url.match(/^https?:\/\//i)) {
    url = "https://" + url;
  }
  url = buildFullUrl(url, config.params);
  url = applyApiKeyToUrl(url, config);

  const parts = ["curl"];

  // Method (skip if GET)
  if (config.method !== "GET") {
    parts.push(`-X ${config.method}`);
  }

  // URL
  parts.push(`'${url}'`);

  // Headers
  const headers = buildHeaders(config);
  // Remove Content-Type for form-data (browser sets it)
  if (config.body.type === "form-data") {
    delete headers["Content-Type"];
  }
  for (const [key, value] of Object.entries(headers)) {
    parts.push(`-H '${key}: ${value}'`);
  }

  // Body
  const body = buildBody(config);
  if (body && typeof body === "string") {
    parts.push(`-d '${body}'`);
  } else if (body instanceof URLSearchParams) {
    parts.push(`-d '${body.toString()}'`);
  } else if (body instanceof FormData) {
    const entries: string[] = [];
    body.forEach((value, key) => {
      entries.push(`-F '${key}=${value}'`);
    });
    parts.push(...entries);
  }

  return parts.join(" \\\n  ");
}

/** Format bytes to human-readable string */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Format milliseconds to human-readable string */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

/** Get the status color class */
export function statusColor(status: number): string {
  if (status === 0) return "text-risk-critical";
  if (status < 300) return "text-risk-low";
  if (status < 400) return "text-risk-medium";
  if (status < 500) return "text-risk-high";
  return "text-risk-critical";
}
