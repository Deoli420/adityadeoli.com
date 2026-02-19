import { useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  Globe,
  Terminal,
  FormInput,
  AlertCircle,
  Sparkles,
  ChevronDown,
  Zap,
  Play,
  Check,
  Copy,
  AlertTriangle,
  ArrowDownToLine,
  Lock,
  Key,
  User,
  ShieldOff,
  Ban,
  Wand2,
} from "lucide-react";
import { useCreateEndpoint } from "@/hooks/useEndpoints.ts";
import type { ApiEndpointCreate, AdvancedConfig } from "@/types/index.ts";
import type {
  KeyValuePair,
  AuthConfig,
  AuthType,
  ApiKeyLocation,
  BodyConfig,
  BodyType,
  RequestConfig,
  ResponseData,
} from "@/types/apiTester.ts";
import { KeyValueEditor } from "@/components/api-tester/KeyValueEditor.tsx";
import { proxyRequest, formatBytes, formatDuration } from "@/services/requestRunner.ts";
import { parseCurl } from "@/utils/parseCurl.ts";
import toast from "react-hot-toast";
import clsx from "clsx";

type InputMode = "form" | "curl";

type ConfigTab =
  | "params"
  | "headers"
  | "auth"
  | "body"
  | "cookies"
  | "advanced";

const HTTP_METHODS = [
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
function uid(): string {
  return `ep_${++_uid}_${Date.now()}`;
}

function emptyKV(): KeyValuePair {
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
    raw: '{\n  \n}',
    formData: [emptyKV()],
    urlEncoded: [emptyKV()],
  };
}

function defaultAdvanced(): AdvancedConfig {
  return {
    timeout_ms: 30000,
    retries: 0,
    retry_delay_ms: 1000,
    follow_redirects: true,
    expected_response_time_ms: null,
  };
}

/** Count non-empty enabled KV pairs */
function kvCount(pairs: KeyValuePair[]): number {
  return pairs.filter((p) => p.enabled && p.key.trim()).length;
}

// ── KV List Helpers ──────────────────────────────────────────────────────

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

/**
 * Add Endpoint — supports both manual form entry and cURL import.
 *
 * Toggle between "Form" and "cURL" input modes via a segmented control.
 * cURL mode parses the command and populates the form fields, giving
 * the user a chance to review/edit before submitting.
 *
 * V2 Enhancement: Tabbed interface for Params, Headers, Auth, Body,
 * Cookies, Advanced config. Test Request execution panel.
 */
export function CreateEndpointPage() {
  const navigate = useNavigate();
  const createMutation = useCreateEndpoint();

  const [mode, setMode] = useState<InputMode>("form");
  const [curlInput, setCurlInput] = useState("");
  const [curlError, setCurlError] = useState<string | null>(null);
  const [curlParsed, setCurlParsed] = useState(false);

  // Core form fields
  const [form, setForm] = useState<ApiEndpointCreate>({
    name: "",
    url: "",
    method: "GET",
    expected_status: 200,
  });

  // V2 config state
  const [activeTab, setActiveTab] = useState<ConfigTab>("params");
  const [params, setParams] = useState<KeyValuePair[]>([emptyKV()]);
  const [headers, setHeaders] = useState<KeyValuePair[]>([emptyKV()]);
  const [cookies, setCookies] = useState<KeyValuePair[]>([emptyKV()]);
  const [auth, setAuth] = useState<AuthConfig>(defaultAuth());
  const [body, setBody] = useState<BodyConfig>(defaultBody());
  const [advanced, setAdvanced] = useState<AdvancedConfig>(defaultAdvanced());

  // Monitoring interval (existing "Advanced Options")
  const [showMonitoring, setShowMonitoring] = useState(false);

  // Test request state
  const [testResponse, setTestResponse] = useState<ResponseData | null>(null);
  const [testSending, setTestSending] = useState(false);
  const [showTestResult, setShowTestResult] = useState(false);

  const [error, setError] = useState<string | null>(null);

  function updateField<K extends keyof ApiEndpointCreate>(
    key: K,
    value: ApiEndpointCreate[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  /** Parse the cURL input and populate form fields. */
  const handleParseCurl = useCallback(() => {
    setCurlError(null);
    try {
      const parsed = parseCurl(curlInput);
      setForm({
        name: parsed.suggestedName,
        url: parsed.url,
        method: parsed.method,
        expected_status: 200,
      });

      // Populate headers from cURL
      const parsedHeaders: KeyValuePair[] = Object.entries(parsed.headers).map(
        ([key, value]) => ({ id: uid(), key, value, enabled: true }),
      );
      if (parsedHeaders.length > 0) {
        setHeaders(parsedHeaders);
      }

      // Populate body from cURL
      if (parsed.body) {
        setBody({
          type: "json",
          raw: parsed.body,
          formData: [emptyKV()],
          urlEncoded: [emptyKV()],
        });
      }

      setCurlParsed(true);
      toast.success("cURL parsed — review the fields below");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to parse cURL command";
      setCurlError(msg);
      setCurlParsed(false);
    }
  }, [curlInput]);

  /** Build a RequestConfig for test execution */
  function buildTestRequest(): RequestConfig {
    return {
      method: (form.method as RequestConfig["method"]) || "GET",
      url: form.url,
      params,
      headers,
      auth,
      body,
    };
  }

  /** Run test request */
  async function handleTestRequest() {
    if (!form.url.trim()) {
      toast.error("Enter a URL first");
      return;
    }
    setTestSending(true);
    setShowTestResult(true);
    setTestResponse(null);
    try {
      const result = await proxyRequest(buildTestRequest());
      setTestResponse(result);
    } catch (err) {
      setTestResponse({
        status: 0,
        statusText: "Error",
        headers: {},
        body: "",
        size: 0,
        timing: { start: Date.now(), end: Date.now(), duration: 0 },
        error:
          err instanceof Error ? err.message : "Request failed unexpectedly",
      });
    } finally {
      setTestSending(false);
    }
  }

  /** Strip empty KV rows before sending to backend */
  function cleanKV(pairs: KeyValuePair[]): KeyValuePair[] | undefined {
    const clean = pairs.filter((p) => p.key.trim());
    return clean.length > 0 ? clean : undefined;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.name.trim() || !form.url.trim()) {
      setError("Name and URL are required.");
      return;
    }

    // Build payload with V2 fields
    const payload: ApiEndpointCreate = {
      ...form,
      query_params: cleanKV(params) as ApiEndpointCreate["query_params"],
      request_headers: cleanKV(headers) as ApiEndpointCreate["request_headers"],
      cookies: cleanKV(cookies) as ApiEndpointCreate["cookies"],
      auth_config: auth.type !== "none" ? auth : undefined,
      body_config: body.type !== "none" ? body : undefined,
      advanced_config:
        advanced.timeout_ms !== 30000 ||
        advanced.retries !== 0 ||
        !advanced.follow_redirects ||
        advanced.expected_response_time_ms !== null
          ? advanced
          : undefined,
    };

    try {
      await createMutation.mutateAsync(payload);
      toast.success("Endpoint created successfully");
      navigate("/");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to create endpoint.";
      setError(msg);
      toast.error(msg);
    }
  }

  // ── Tab config with counts ──────────────────────────────────────────

  const tabs: { id: ConfigTab; label: string; count?: number }[] = [
    { id: "params", label: "Params", count: kvCount(params) },
    { id: "headers", label: "Headers", count: kvCount(headers) },
    { id: "auth", label: "Auth" },
    { id: "body", label: "Body" },
    { id: "cookies", label: "Cookies", count: kvCount(cookies) },
    { id: "advanced", label: "Advanced" },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-5 animate-fade-in">
      {/* Back nav */}
      <Link
        to="/"
        className="group inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
        Back to Dashboard
      </Link>

      {/* Main card */}
      <div className="card p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-light">
            <Globe className="h-4 w-4 text-accent" />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-text-primary">
              Add Endpoint
            </h2>
            <p className="text-[11px] text-text-tertiary">
              Register an API endpoint for monitoring, risk scoring, and anomaly
              detection.
            </p>
          </div>
        </div>

        {/* ── Mode Toggle (Segmented Control) ──────────────────────── */}
        <div className="mt-5 mb-5">
          <div className="inline-flex rounded-lg bg-surface-tertiary p-0.5">
            <button
              type="button"
              onClick={() => {
                setMode("form");
                setCurlParsed(false);
              }}
              className={clsx(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-150",
                mode === "form"
                  ? "bg-surface text-text-primary shadow-sm"
                  : "text-text-tertiary hover:text-text-secondary",
              )}
            >
              <FormInput className="h-3.5 w-3.5" />
              Form
            </button>
            <button
              type="button"
              onClick={() => setMode("curl")}
              className={clsx(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-150",
                mode === "curl"
                  ? "bg-surface text-text-primary shadow-sm"
                  : "text-text-tertiary hover:text-text-secondary",
              )}
            >
              <Terminal className="h-3.5 w-3.5" />
              cURL Import
            </button>
          </div>
        </div>

        {/* ── cURL Input Area ──────────────────────────────────────── */}
        {mode === "curl" && (
          <div className="mb-5 space-y-3">
            <div>
              <label
                htmlFor="curl"
                className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-text-secondary"
              >
                <Terminal className="h-3 w-3" />
                Paste cURL Command
              </label>
              <textarea
                id="curl"
                rows={5}
                value={curlInput}
                onChange={(e) => {
                  setCurlInput(e.target.value);
                  setCurlParsed(false);
                  setCurlError(null);
                }}
                placeholder={`curl -X GET 'https://api.example.com/v1/users' \\
  -H 'Authorization: Bearer token' \\
  -H 'Accept: application/json'`}
                className="input font-mono text-[12px] leading-relaxed resize-none"
                spellCheck={false}
                autoFocus
              />
              <p className="mt-1 text-[10px] text-text-tertiary">
                Supports -X, -H, -d, --data-raw, --url and most common flags.
                Copy from browser DevTools (Network tab &rarr; Copy as cURL).
              </p>
            </div>

            {/* cURL Error */}
            {curlError && (
              <div className="flex items-start gap-2 rounded-lg border border-risk-critical-border bg-risk-critical-bg px-3 py-2">
                <AlertCircle className="mt-0.5 h-3 w-3 shrink-0 text-risk-critical" />
                <p className="text-xs text-risk-critical">{curlError}</p>
              </div>
            )}

            {/* Parse Button */}
            <button
              type="button"
              onClick={handleParseCurl}
              disabled={!curlInput.trim()}
              className={clsx(
                "btn-secondary w-full justify-center gap-2 py-2",
                curlParsed &&
                  "!border-risk-low/30 !bg-risk-low-bg !text-risk-low",
              )}
            >
              {curlParsed ? (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  Parsed &mdash; Review fields below
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  Parse cURL
                </>
              )}
            </button>

            {/* Divider */}
            {curlParsed && (
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border-subtle" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-surface px-2 text-[10px] text-text-tertiary">
                    Review & edit the parsed fields
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Form Fields ──────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <FieldGroup label="Name" htmlFor="name">
            <input
              id="name"
              type="text"
              placeholder={"e.g., User Service \u2014 GET /users"}
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              className="input"
              autoFocus={mode === "form"}
            />
          </FieldGroup>

          {/* URL */}
          <FieldGroup label="Endpoint URL" htmlFor="url">
            <input
              id="url"
              type="url"
              placeholder="https://api.example.com/v1/users"
              value={form.url}
              onChange={(e) => updateField("url", e.target.value)}
              className="input font-mono text-[13px]"
            />
          </FieldGroup>

          {/* Method + Expected Status */}
          <div className="grid grid-cols-2 gap-4">
            <FieldGroup label="HTTP Method" htmlFor="method">
              <div className="relative">
                <select
                  id="method"
                  value={form.method}
                  onChange={(e) => updateField("method", e.target.value)}
                  className="input appearance-none pr-8 font-mono text-[13px]"
                >
                  {HTTP_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-tertiary" />
              </div>
            </FieldGroup>

            <FieldGroup label="Expected Status" htmlFor="status">
              <input
                id="status"
                type="number"
                min={100}
                max={599}
                value={form.expected_status}
                onChange={(e) =>
                  updateField(
                    "expected_status",
                    parseInt(e.target.value, 10) || 200,
                  )
                }
                className="input font-mono text-[13px] tabular-nums"
              />
            </FieldGroup>
          </div>

          {/* ── V2 Config Tabs ─────────────────────────────────────── */}
          <div className="rounded-lg border border-border overflow-hidden">
            {/* Tab bar */}
            <div className="flex items-center border-b border-border bg-surface-secondary/50 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={clsx(
                    "relative flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium whitespace-nowrap transition-colors",
                    activeTab === tab.id
                      ? "text-text-primary"
                      : "text-text-tertiary hover:text-text-secondary",
                  )}
                >
                  {tab.label}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span
                      className={clsx(
                        "flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-semibold",
                        activeTab === tab.id
                          ? "bg-accent text-white"
                          : "bg-surface-tertiary text-text-tertiary",
                      )}
                    >
                      {tab.count}
                    </span>
                  )}
                  {activeTab === tab.id && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
                  )}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="bg-surface">
              {activeTab === "params" && (
                <div className="p-3">
                  <KeyValueEditor
                    pairs={params}
                    onUpdate={(id, field, val) =>
                      setParams((p) => updateKVList(p, id, field, val))
                    }
                    onToggle={(id) => setParams((p) => toggleKVItem(p, id))}
                    onRemove={(id) => setParams((p) => removeKVItem(p, id))}
                    onAdd={() => setParams((p) => [...p, emptyKV()])}
                    keyPlaceholder="Parameter"
                    valuePlaceholder="Value"
                  />
                </div>
              )}

              {activeTab === "headers" && (
                <div className="p-3">
                  <KeyValueEditor
                    pairs={headers}
                    onUpdate={(id, field, val) =>
                      setHeaders((p) => updateKVList(p, id, field, val))
                    }
                    onToggle={(id) => setHeaders((p) => toggleKVItem(p, id))}
                    onRemove={(id) => setHeaders((p) => removeKVItem(p, id))}
                    onAdd={() => setHeaders((p) => [...p, emptyKV()])}
                    keyPlaceholder="Header"
                    valuePlaceholder="Value"
                  />
                </div>
              )}

              {activeTab === "auth" && (
                <InlineAuthPanel auth={auth} setAuth={setAuth} />
              )}

              {activeTab === "body" && (
                <InlineBodyPanel body={body} setBody={setBody} />
              )}

              {activeTab === "cookies" && (
                <div className="p-3">
                  <KeyValueEditor
                    pairs={cookies}
                    onUpdate={(id, field, val) =>
                      setCookies((p) => updateKVList(p, id, field, val))
                    }
                    onToggle={(id) => setCookies((p) => toggleKVItem(p, id))}
                    onRemove={(id) => setCookies((p) => removeKVItem(p, id))}
                    onAdd={() => setCookies((p) => [...p, emptyKV()])}
                    keyPlaceholder="Cookie name"
                    valuePlaceholder="Value"
                  />
                </div>
              )}

              {activeTab === "advanced" && (
                <InlineAdvancedPanel
                  config={advanced}
                  setConfig={setAdvanced}
                />
              )}
            </div>
          </div>

          {/* ── Test Request Button ─────────────────────────────────── */}
          <button
            type="button"
            onClick={handleTestRequest}
            disabled={testSending || !form.url.trim()}
            className="btn-secondary w-full justify-center gap-2 py-2"
          >
            {testSending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" />
                Test Request
              </>
            )}
          </button>

          {/* ── Test Result Panel ───────────────────────────────────── */}
          {showTestResult && (
            <TestResultPanel
              response={testResponse}
              sending={testSending}
              onClose={() => {
                setShowTestResult(false);
                setTestResponse(null);
              }}
            />
          )}

          {/* Monitoring Interval Toggle */}
          <button
            type="button"
            onClick={() => setShowMonitoring(!showMonitoring)}
            className="flex items-center gap-1 text-[11px] text-text-tertiary hover:text-text-secondary transition-colors"
          >
            <ChevronDown
              className={clsx(
                "h-3 w-3 transition-transform",
                showMonitoring && "rotate-180",
              )}
            />
            Monitoring settings
          </button>

          {showMonitoring && (
            <div className="space-y-4 rounded-lg border border-border-subtle bg-surface-secondary/50 p-4">
              <FieldGroup
                label="Monitoring Interval (seconds)"
                htmlFor="interval"
              >
                <input
                  id="interval"
                  type="number"
                  min={10}
                  max={86400}
                  value={form.monitoring_interval_seconds ?? 300}
                  onChange={(e) =>
                    updateField(
                      "monitoring_interval_seconds",
                      parseInt(e.target.value, 10) || 300,
                    )
                  }
                  className="input font-mono text-[13px] tabular-nums"
                />
                <p className="mt-1 text-[10px] text-text-tertiary">
                  How often to check this endpoint. Default: 300s (5 minutes).
                </p>
              </FieldGroup>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-risk-critical-border bg-risk-critical-bg px-3 py-2">
              <AlertCircle className="mt-0.5 h-3 w-3 shrink-0 text-risk-critical" />
              <p className="text-xs text-risk-critical">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="btn-primary w-full justify-center py-2.5"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Endpoint"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Inline Auth Panel (self-contained, no store dependency) ────────────

const AUTH_TYPES: { value: AuthType; label: string; icon: typeof Lock }[] = [
  { value: "none", label: "No Auth", icon: ShieldOff },
  { value: "bearer", label: "Bearer Token", icon: Lock },
  { value: "basic", label: "Basic Auth", icon: User },
  { value: "api-key", label: "API Key", icon: Key },
];

function InlineAuthPanel({
  auth,
  setAuth,
}: {
  auth: AuthConfig;
  setAuth: React.Dispatch<React.SetStateAction<AuthConfig>>;
}) {
  return (
    <div className="space-y-4 p-4">
      {/* Auth type selector */}
      <div>
        <label className="mb-1.5 block text-[11px] font-medium text-text-tertiary uppercase tracking-wider">
          Authorization Type
        </label>
        <div className="relative">
          <select
            value={auth.type}
            onChange={(e) =>
              setAuth((a) => ({ ...a, type: e.target.value as AuthType }))
            }
            className="input appearance-none pr-8 text-xs"
          >
            {AUTH_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-tertiary" />
        </div>
      </div>

      {auth.type === "none" && (
        <div className="flex items-center gap-2 rounded-lg bg-surface-secondary px-3 py-4 text-xs text-text-tertiary">
          <ShieldOff className="h-4 w-4" />
          <span>This request does not use any authorization.</span>
        </div>
      )}

      {auth.type === "bearer" && (
        <div>
          <label className="mb-1.5 block text-[11px] font-medium text-text-tertiary uppercase tracking-wider">
            Token
          </label>
          <input
            type="text"
            value={auth.bearer.token}
            onChange={(e) =>
              setAuth((a) => ({ ...a, bearer: { token: e.target.value } }))
            }
            placeholder="Enter Bearer token..."
            className="input font-mono text-xs"
            spellCheck={false}
          />
          <p className="mt-1.5 text-[10px] text-text-tertiary">
            The token will be sent as{" "}
            <code className="rounded bg-surface-tertiary px-1 py-0.5 font-mono text-text-secondary">
              Authorization: Bearer &lt;token&gt;
            </code>
          </p>
        </div>
      )}

      {auth.type === "basic" && (
        <div className="space-y-3">
          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-text-tertiary uppercase tracking-wider">
              Username
            </label>
            <input
              type="text"
              value={auth.basic.username}
              onChange={(e) =>
                setAuth((a) => ({
                  ...a,
                  basic: { ...a.basic, username: e.target.value },
                }))
              }
              placeholder="Username"
              className="input text-xs"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-text-tertiary uppercase tracking-wider">
              Password
            </label>
            <input
              type="password"
              value={auth.basic.password}
              onChange={(e) =>
                setAuth((a) => ({
                  ...a,
                  basic: { ...a.basic, password: e.target.value },
                }))
              }
              placeholder="Password"
              className="input text-xs"
            />
          </div>
        </div>
      )}

      {auth.type === "api-key" && (
        <div className="space-y-3">
          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-text-tertiary uppercase tracking-wider">
              Key Name
            </label>
            <input
              type="text"
              value={auth.apiKey.key}
              onChange={(e) =>
                setAuth((a) => ({
                  ...a,
                  apiKey: { ...a.apiKey, key: e.target.value },
                }))
              }
              placeholder="X-API-Key"
              className="input font-mono text-xs"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-text-tertiary uppercase tracking-wider">
              Value
            </label>
            <input
              type="text"
              value={auth.apiKey.value}
              onChange={(e) =>
                setAuth((a) => ({
                  ...a,
                  apiKey: { ...a.apiKey, value: e.target.value },
                }))
              }
              placeholder="Enter API key value..."
              className="input font-mono text-xs"
              spellCheck={false}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-text-tertiary uppercase tracking-wider">
              Add to
            </label>
            <div className="inline-flex rounded-lg bg-surface-tertiary p-0.5">
              {(["header", "query"] as ApiKeyLocation[]).map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() =>
                    setAuth((a) => ({
                      ...a,
                      apiKey: { ...a.apiKey, addTo: loc },
                    }))
                  }
                  className={clsx(
                    "rounded-md px-3 py-1.5 text-[11px] font-medium transition-all",
                    auth.apiKey.addTo === loc
                      ? "bg-surface text-text-primary shadow-sm"
                      : "text-text-tertiary hover:text-text-secondary",
                  )}
                >
                  {loc === "header" ? "Header" : "Query Param"}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Inline Body Panel ──────────────────────────────────────────────────

const BODY_TYPES: { value: BodyType; label: string }[] = [
  { value: "none", label: "none" },
  { value: "json", label: "raw (JSON)" },
  { value: "form-data", label: "form-data" },
  { value: "x-www-form-urlencoded", label: "x-www-form-urlencoded" },
];

function InlineBodyPanel({
  body,
  setBody,
}: {
  body: BodyConfig;
  setBody: React.Dispatch<React.SetStateAction<BodyConfig>>;
}) {
  function handleFormatJson() {
    try {
      const parsed = JSON.parse(body.raw);
      setBody((b) => ({ ...b, raw: JSON.stringify(parsed, null, 2) }));
    } catch {
      // Invalid JSON — leave as-is
    }
  }

  return (
    <div className="space-y-3 p-4">
      {/* Body type selector */}
      <div className="flex items-center gap-1">
        {BODY_TYPES.map((bt) => (
          <button
            key={bt.value}
            type="button"
            onClick={() => setBody((b) => ({ ...b, type: bt.value }))}
            className={clsx(
              "rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-all",
              body.type === bt.value
                ? "bg-accent-light text-accent"
                : "text-text-tertiary hover:text-text-secondary hover:bg-surface-tertiary",
            )}
          >
            {bt.label}
          </button>
        ))}
      </div>

      {body.type === "none" && (
        <div className="flex items-center gap-2 rounded-lg bg-surface-secondary px-3 py-4 text-xs text-text-tertiary">
          <Ban className="h-4 w-4" />
          <span>This request does not have a body.</span>
        </div>
      )}

      {body.type === "json" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium text-text-tertiary uppercase tracking-wider">
              JSON
            </span>
            <button
              type="button"
              onClick={handleFormatJson}
              className="flex items-center gap-1 text-[10px] text-text-tertiary hover:text-accent transition-colors"
            >
              <Wand2 className="h-3 w-3" />
              Format
            </button>
          </div>
          <textarea
            value={body.raw}
            onChange={(e) => setBody((b) => ({ ...b, raw: e.target.value }))}
            className="input font-mono text-xs leading-relaxed resize-y"
            rows={8}
            placeholder={'{\n  "key": "value"\n}'}
            spellCheck={false}
          />
        </div>
      )}

      {body.type === "form-data" && (
        <KeyValueEditor
          pairs={body.formData}
          onUpdate={(id, field, val) =>
            setBody((b) => ({
              ...b,
              formData: updateKVList(b.formData, id, field, val),
            }))
          }
          onToggle={(id) =>
            setBody((b) => ({
              ...b,
              formData: toggleKVItem(b.formData, id),
            }))
          }
          onRemove={(id) =>
            setBody((b) => ({
              ...b,
              formData: removeKVItem(b.formData, id),
            }))
          }
          onAdd={() =>
            setBody((b) => ({
              ...b,
              formData: [...b.formData, emptyKV()],
            }))
          }
          keyPlaceholder="Field name"
          valuePlaceholder="Value"
        />
      )}

      {body.type === "x-www-form-urlencoded" && (
        <KeyValueEditor
          pairs={body.urlEncoded}
          onUpdate={(id, field, val) =>
            setBody((b) => ({
              ...b,
              urlEncoded: updateKVList(b.urlEncoded, id, field, val),
            }))
          }
          onToggle={(id) =>
            setBody((b) => ({
              ...b,
              urlEncoded: toggleKVItem(b.urlEncoded, id),
            }))
          }
          onRemove={(id) =>
            setBody((b) => ({
              ...b,
              urlEncoded: removeKVItem(b.urlEncoded, id),
            }))
          }
          onAdd={() =>
            setBody((b) => ({
              ...b,
              urlEncoded: [...b.urlEncoded, emptyKV()],
            }))
          }
          keyPlaceholder="Key"
          valuePlaceholder="Value"
        />
      )}
    </div>
  );
}

// ── Inline Advanced Panel ──────────────────────────────────────────────

function InlineAdvancedPanel({
  config,
  setConfig,
}: {
  config: AdvancedConfig;
  setConfig: React.Dispatch<React.SetStateAction<AdvancedConfig>>;
}) {
  return (
    <div className="space-y-4 p-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-[11px] font-medium text-text-tertiary uppercase tracking-wider">
            Timeout (ms)
          </label>
          <input
            type="number"
            min={1000}
            max={120000}
            value={config.timeout_ms}
            onChange={(e) =>
              setConfig((c) => ({
                ...c,
                timeout_ms: parseInt(e.target.value, 10) || 30000,
              }))
            }
            className="input font-mono text-xs tabular-nums"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[11px] font-medium text-text-tertiary uppercase tracking-wider">
            Retries
          </label>
          <input
            type="number"
            min={0}
            max={5}
            value={config.retries}
            onChange={(e) =>
              setConfig((c) => ({
                ...c,
                retries: parseInt(e.target.value, 10) || 0,
              }))
            }
            className="input font-mono text-xs tabular-nums"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-[11px] font-medium text-text-tertiary uppercase tracking-wider">
            Retry Delay (ms)
          </label>
          <input
            type="number"
            min={0}
            max={30000}
            value={config.retry_delay_ms}
            onChange={(e) =>
              setConfig((c) => ({
                ...c,
                retry_delay_ms: parseInt(e.target.value, 10) || 1000,
              }))
            }
            className="input font-mono text-xs tabular-nums"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[11px] font-medium text-text-tertiary uppercase tracking-wider">
            Expected Response (ms)
          </label>
          <input
            type="number"
            min={0}
            max={120000}
            value={config.expected_response_time_ms ?? ""}
            onChange={(e) => {
              const val = e.target.value;
              setConfig((c) => ({
                ...c,
                expected_response_time_ms: val ? parseInt(val, 10) : null,
              }));
            }}
            placeholder="Optional"
            className="input font-mono text-xs tabular-nums"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="follow-redirects"
          checked={config.follow_redirects}
          onChange={(e) =>
            setConfig((c) => ({
              ...c,
              follow_redirects: e.target.checked,
            }))
          }
          className="h-3.5 w-3.5 rounded border-border text-accent focus:ring-accent/30 cursor-pointer"
        />
        <label
          htmlFor="follow-redirects"
          className="text-xs text-text-secondary cursor-pointer"
        >
          Follow redirects automatically
        </label>
      </div>
    </div>
  );
}

// ── Test Result Panel ──────────────────────────────────────────────────

function TestResultPanel({
  response,
  sending,
  onClose,
}: {
  response: ResponseData | null;
  sending: boolean;
  onClose: () => void;
}) {
  const [responseTab, setResponseTab] = useState<"body" | "headers">("body");
  const [copied, setCopied] = useState(false);

  if (sending) {
    return (
      <div className="rounded-lg border border-border bg-surface overflow-hidden">
        <div className="flex items-center justify-center py-10">
          <div className="flex flex-col items-center gap-2">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            <p className="text-xs text-text-tertiary">Sending request...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!response) return null;

  // Error state
  if (response.error) {
    return (
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="flex items-center justify-between gap-2 border-b border-border bg-risk-critical-bg px-4 py-2.5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5 text-risk-critical" />
            <span className="text-xs font-medium text-risk-critical">
              Request Failed
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[10px] text-text-tertiary hover:text-text-secondary"
          >
            Dismiss
          </button>
        </div>
        <div className="p-4">
          <p className="text-xs text-risk-critical">{response.error}</p>
        </div>
      </div>
    );
  }

  const headerCount = Object.keys(response.headers).length;

  function handleCopy() {
    navigator.clipboard.writeText(response!.body);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      {/* Status bar */}
      <div className="flex items-center gap-3 border-b border-border bg-surface px-4 py-2.5">
        <span
          className={clsx(
            "rounded-md px-2 py-0.5 text-xs font-bold tabular-nums",
            response.status < 300
              ? "bg-risk-low-bg text-risk-low"
              : response.status < 400
                ? "bg-risk-medium-bg text-risk-medium"
                : response.status < 500
                  ? "bg-risk-high-bg text-risk-high"
                  : "bg-risk-critical-bg text-risk-critical",
          )}
        >
          {response.status} {response.statusText}
        </span>

        <div className="flex items-center gap-3 ml-auto text-[10px] text-text-tertiary tabular-nums">
          <span className="flex items-center gap-1">
            <Zap className="h-3 w-3" />
            {formatDuration(response.timing.duration)}
          </span>
          <span className="flex items-center gap-1">
            <ArrowDownToLine className="h-3 w-3" />
            {formatBytes(response.size)}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-text-tertiary hover:text-text-secondary ml-1"
          >
            Dismiss
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-border-subtle bg-surface">
        <button
          type="button"
          onClick={() => setResponseTab("body")}
          className={clsx(
            "relative px-4 py-2 text-xs font-medium transition-colors",
            responseTab === "body"
              ? "text-text-primary"
              : "text-text-tertiary hover:text-text-secondary",
          )}
        >
          Body
          {responseTab === "body" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
          )}
        </button>
        <button
          type="button"
          onClick={() => setResponseTab("headers")}
          className={clsx(
            "relative flex items-center gap-1.5 px-4 py-2 text-xs font-medium transition-colors",
            responseTab === "headers"
              ? "text-text-primary"
              : "text-text-tertiary hover:text-text-secondary",
          )}
        >
          Headers
          {headerCount > 0 && (
            <span
              className={clsx(
                "flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-semibold",
                responseTab === "headers"
                  ? "bg-accent text-white"
                  : "bg-surface-tertiary text-text-tertiary",
              )}
            >
              {headerCount}
            </span>
          )}
          {responseTab === "headers" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
          )}
        </button>
      </div>

      {/* Content */}
      <div className="max-h-[350px] overflow-auto">
        {responseTab === "body" && (
          <div>
            <div className="flex items-center justify-end border-b border-border-subtle bg-surface-secondary/50 px-3 py-1.5">
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1 text-[10px] text-text-tertiary hover:text-text-secondary transition-colors"
              >
                {copied ? (
                  <Check className="h-3 w-3 text-risk-low" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <div className="p-3">
              <pre className="whitespace-pre-wrap break-all font-mono text-xs text-text-primary leading-relaxed">
                {response.body || "(empty response)"}
              </pre>
            </div>
          </div>
        )}
        {responseTab === "headers" && (
          <div className="divide-y divide-border-subtle">
            {Object.entries(response.headers).map(([key, value]) => (
              <div
                key={key}
                className="grid grid-cols-[180px_1fr] gap-2 px-4 py-2"
              >
                <span className="text-xs font-medium text-text-secondary truncate font-mono">
                  {key}
                </span>
                <span className="text-xs text-text-primary break-all font-mono">
                  {value}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Reusable form field wrapper ────────────────────────────────────────

function FieldGroup({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-xs font-medium text-text-secondary"
      >
        {label}
      </label>
      {children}
    </div>
  );
}
