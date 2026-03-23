import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  Globe,
  Terminal,
  FormInput,
  AlertCircle,
  Sparkles,
  ChevronDown,
  Play,
  RotateCcw,
  Lightbulb,
} from "lucide-react";
import type {
  ApiEndpoint,
  ApiEndpointCreate,
  ApiEndpointUpdate,
  AdvancedConfig,
} from "@/types/index.ts";
import type {
  KeyValuePair,
  AuthConfig,
  BodyConfig,
  RequestConfig,
  ResponseData,
} from "@/types/apiTester.ts";
import { KeyValueEditor } from "@/components/api-tester/KeyValueEditor.tsx";
import { proxyRequest } from "@/services/requestRunner.ts";
import { parseCurl } from "@/utils/parseCurl.ts";
import {
  uid,
  emptyKV,
  defaultAuth,
  defaultBody,
  defaultAdvanced,
  kvCount,
  updateKVList,
  toggleKVItem,
  removeKVItem,
  cleanKV,
  hydrateKV,
  HTTP_METHODS,
} from "@/utils/endpointForm.ts";
import type { InputMode, ConfigTab } from "@/utils/endpointForm.ts";
import { FieldGroup } from "@/components/endpoint/FieldGroup.tsx";
import { InlineAuthPanel } from "@/components/endpoint/InlineAuthPanel.tsx";
import { InlineBodyPanel } from "@/components/endpoint/InlineBodyPanel.tsx";
import { InlineAdvancedPanel } from "@/components/endpoint/InlineAdvancedPanel.tsx";
import { TestResultPanel } from "@/components/endpoint/TestResultPanel.tsx";
import { TemplateSelector } from "@/components/endpoint/TemplateSelector.tsx";
import type { EndpointTemplate } from "@/components/endpoint/TemplateSelector.tsx";
import { CompletionIndicator } from "@/components/endpoint/CompletionIndicator.tsx";
import { useFormDraft } from "@/hooks/useFormDraft.ts";
import { useEndpoints } from "@/hooks/useEndpoints.ts";
import toast from "react-hot-toast";
import clsx from "clsx";

// ── Types ───────────────────────────────────────────────────────────────

type FormFields = {
  name: string;
  url: string;
  method: string;
  expected_status: number;
  monitoring_interval_seconds?: number;
};

export interface EndpointFormProps {
  mode: "create" | "edit";
  initialData?: ApiEndpoint;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSubmit: (payload: any) => Promise<void>;
  isSubmitting: boolean;
  submitLabel: string;
  backLink: { to: string; label: string };
  headerTitle: string;
}

// ── Constants ────────────────────────────────────────────────────────────

const METHOD_COLORS: Record<string, string> = {
  GET: "text-risk-low", POST: "text-risk-medium", PUT: "text-drift-new",
  PATCH: "text-ai-purple", DELETE: "text-risk-critical", HEAD: "text-text-secondary", OPTIONS: "text-text-secondary",
};

const INTERVAL_PRESETS = [
  { label: "30s", value: 30 },
  { label: "1m", value: 60 },
  { label: "5m", value: 300 },
  { label: "15m", value: 900 },
  { label: "1h", value: 3600 },
];

// ── Helpers ──────────────────────────────────────────────────────────────

function isValidUrl(url: string): boolean {
  try { new URL(url); return true; } catch { return false; }
}

function humanizeInterval(s: number): string {
  if (s < 60) return `${s} seconds`;
  if (s < 3600) return s === 60 ? "1 minute" : `${Math.round(s / 60)} minutes`;
  return s === 3600 ? "1 hour" : `${(s / 3600).toFixed(1)} hours`;
}

// ── Component ───────────────────────────────────────────────────────────

export function EndpointForm({
  mode,
  initialData,
  onSubmit,
  isSubmitting,
  submitLabel,
  backLink,
  headerTitle,
}: EndpointFormProps) {
  const initialized = useRef(false);

  const [inputMode, setInputMode] = useState<InputMode>("form");
  const [curlInput, setCurlInput] = useState("");
  const [curlError, setCurlError] = useState<string | null>(null);
  const [curlParsed, setCurlParsed] = useState(false);

  // Core form fields
  const [form, setForm] = useState<FormFields>({
    name: "",
    url: "",
    method: "GET",
    expected_status: 200,
    monitoring_interval_seconds: 300,
  });

  // Inline validation
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // V2 config state
  const [activeTab, setActiveTab] = useState<ConfigTab>("params");
  const [params, setParams] = useState<KeyValuePair[]>([emptyKV()]);
  const [headers, setHeaders] = useState<KeyValuePair[]>([emptyKV()]);
  const [cookies, setCookies] = useState<KeyValuePair[]>([emptyKV()]);
  const [auth, setAuth] = useState<AuthConfig>(defaultAuth());
  const [body, setBody] = useState<BodyConfig>(defaultBody());
  const [advanced, setAdvanced] = useState<AdvancedConfig>(defaultAdvanced());

  // Monitoring interval
  const [customInterval, setCustomInterval] = useState(false);

  // Schema capture
  const [expectedSchema, setExpectedSchema] = useState<Record<string, unknown> | null>(null);
  const [validateSchema, setValidateSchema] = useState(true);

  // Test request state
  const [testResponse, setTestResponse] = useState<ResponseData | null>(null);
  const [testSending, setTestSending] = useState(false);
  const [showTestResult, setShowTestResult] = useState(false);
  const [hasTestedOk, setHasTestedOk] = useState(false);

  const [error, setError] = useState<string | null>(null);

  // Onboarding: check if first endpoint
  const { data: endpoints } = useEndpoints();
  const isFirstEndpoint = !endpoints || endpoints.length === 0;

  // ── Validation ────────────────────────────────────────────────────────

  const nameError = touched.name && !form.name.trim()
    ? "Name is required"
    : touched.name && form.name.length > 100
      ? "Max 100 characters"
      : null;

  const urlError = touched.url && !form.url.trim()
    ? "URL is required"
    : touched.url && form.url.trim() && !isValidUrl(form.url)
      ? "Enter a valid URL (https://...)"
      : null;

  // ── Completion indicator ──────────────────────────────────────────────

  const hasBasicInfo = Boolean(form.name.trim() && form.url.trim() && isValidUrl(form.url));
  const hasConfig = auth.type !== "none" || kvCount(headers) > 0 || body.type !== "none" || kvCount(params) > 0;

  // ── Draft saving ──────────────────────────────────────────────────────

  const draftSnapshot = {
    form, params, headers, cookies, auth, body, advanced,
    expectedSchema, validateSchema,
  };

  const draftKey = mode === "edit"
    ? `sentinelai:endpoint-draft:edit:${initialData?.id}`
    : "sentinelai:endpoint-draft:create";

  const draft = useFormDraft(draftKey, draftSnapshot);

  function handleRestoreDraft() {
    const restored = draft.restoreDraft();
    if (restored) {
      setForm(restored.form);
      setParams(restored.params);
      setHeaders(restored.headers);
      setCookies(restored.cookies);
      setAuth(restored.auth);
      setBody(restored.body);
      setAdvanced(restored.advanced);
      if (restored.expectedSchema) setExpectedSchema(restored.expectedSchema);
      if (restored.validateSchema !== undefined) setValidateSchema(restored.validateSchema);
      toast.success("Draft restored");
    }
  }

  // ── Edit mode hydration ─────────────────────────────────────────────

  useEffect(() => {
    if (mode === "edit" && initialData && !initialized.current) {
      setForm({
        name: initialData.name,
        url: initialData.url,
        method: initialData.method,
        expected_status: initialData.expected_status,
        monitoring_interval_seconds: initialData.monitoring_interval_seconds ?? 300,
      });
      setParams(hydrateKV(initialData.query_params));
      setHeaders(hydrateKV(initialData.request_headers));
      setCookies(hydrateKV(initialData.cookies));

      // Check if monitoring interval matches a preset
      const interval = initialData.monitoring_interval_seconds ?? 300;
      if (!INTERVAL_PRESETS.some(p => p.value === interval)) {
        setCustomInterval(true);
      }

      if (initialData.auth_config) {
        setAuth({
          ...defaultAuth(),
          ...initialData.auth_config,
        });
      }
      if (initialData.body_config) {
        setBody({
          ...defaultBody(),
          ...initialData.body_config,
          formData: initialData.body_config.formData
            ? hydrateKV(initialData.body_config.formData as unknown as KeyValuePair[])
            : [emptyKV()],
          urlEncoded: initialData.body_config.urlEncoded
            ? hydrateKV(initialData.body_config.urlEncoded as unknown as KeyValuePair[])
            : [emptyKV()],
        });
      }
      if (initialData.advanced_config) {
        setAdvanced({ ...defaultAdvanced(), ...initialData.advanced_config });
      }
      if (initialData.expected_schema) {
        setExpectedSchema(initialData.expected_schema);
      }
      initialized.current = true;
    }
  }, [mode, initialData]);

  function updateField<K extends keyof FormFields>(
    key: K,
    value: FormFields[K],
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
        monitoring_interval_seconds: form.monitoring_interval_seconds,
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
      toast.success("cURL parsed \u2014 review the fields below");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to parse cURL command";
      setCurlError(msg);
      setCurlParsed(false);
    }
  }, [curlInput, form.monitoring_interval_seconds]);

  /** Apply a quick template */
  function handleApplyTemplate(template: EndpointTemplate) {
    const v = template.values;
    setForm(f => ({
      ...f,
      method: v.method ?? f.method,
      expected_status: v.expected_status ?? f.expected_status,
      monitoring_interval_seconds: v.monitoring_interval_seconds ?? f.monitoring_interval_seconds,
    }));
    if (v.headers) setHeaders(v.headers);
    if (v.auth) setAuth(a => ({ ...a, ...v.auth } as AuthConfig));
    if (v.body) setBody(b => ({ ...b, ...v.body } as BodyConfig));

    // Check if interval matches preset
    if (v.monitoring_interval_seconds && !INTERVAL_PRESETS.some(p => p.value === v.monitoring_interval_seconds)) {
      setCustomInterval(true);
    } else {
      setCustomInterval(false);
    }

    toast.success(`${template.label} template applied`);
  }

  /** Build a RequestConfig for test execution */
  function buildTestRequest(): RequestConfig {
    return {
      method: (form.method as RequestConfig["method"]) || "GET",
      url: form.url || "",
      params,
      headers,
      auth,
      body,
    };
  }

  /** Run test request */
  async function handleTestRequest() {
    if (!form.url?.trim()) {
      toast.error("Enter a URL first");
      return;
    }
    setTestSending(true);
    setShowTestResult(true);
    setTestResponse(null);
    try {
      const result = await proxyRequest(buildTestRequest());
      setTestResponse(result);
      if (result.status >= 200 && result.status < 500 && !result.error) {
        setHasTestedOk(true);
      }
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.name?.trim() || !form.url?.trim()) {
      setError("Name and URL are required.");
      return;
    }

    // Build payload with V2 fields
    const payload: ApiEndpointCreate | ApiEndpointUpdate = {
      ...form,
      monitoring_interval_seconds: form.monitoring_interval_seconds ?? 300,
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
      ...(expectedSchema && validateSchema ? { expected_schema: expectedSchema } : {}),
    };

    try {
      await onSubmit(payload);
      draft.clearDraft();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : `Failed to ${mode} endpoint.`;
      setError(msg);
      toast.error(msg);
    }
  }

  // ── Tab config with counts ──────────────────────────────────────────

  const isBodyNotTypical = form.method === "GET" || form.method === "HEAD";

  const tabs: { id: ConfigTab; label: string; count?: number; dimmed?: boolean }[] = [
    { id: "params", label: "Params", count: kvCount(params) },
    { id: "headers", label: "Headers", count: kvCount(headers) },
    { id: "auth", label: "Auth" },
    { id: "body", label: isBodyNotTypical ? "Body (not typical)" : "Body", dimmed: isBodyNotTypical },
    { id: "cookies", label: "Cookies", count: kvCount(cookies) },
    { id: "advanced", label: "Advanced" },
  ];

  // ── Header subtitle ──────────────────────────────────────────────────

  const subtitle =
    mode === "edit" && initialData ? (
      <>
        Update configuration for{" "}
        <span className="font-medium text-text-secondary">
          {initialData.name}
        </span>
      </>
    ) : (
      "Register an API endpoint for monitoring, risk scoring, and anomaly detection."
    );

  return (
    <div className="mx-auto max-w-2xl space-y-5 animate-fade-in">
      {/* Back nav */}
      <Link
        to={backLink.to}
        className="group inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
        {backLink.label}
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
              {headerTitle}
            </h2>
            <p className="text-[11px] text-text-tertiary">{subtitle}</p>
          </div>
        </div>

        {/* Completion Indicator */}
        <CompletionIndicator hasBasicInfo={hasBasicInfo} hasConfig={hasConfig} hasTested={hasTestedOk} />

        {/* Mode Toggle (Segmented Control) */}
        <div className="mt-3 mb-5">
          <div className="inline-flex rounded-lg bg-surface-tertiary p-0.5">
            <button
              type="button"
              onClick={() => {
                setInputMode("form");
                setCurlParsed(false);
              }}
              className={clsx(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-150",
                inputMode === "form"
                  ? "bg-surface text-text-primary shadow-sm"
                  : "text-text-tertiary hover:text-text-secondary",
              )}
            >
              <FormInput className="h-3.5 w-3.5" />
              Form
            </button>
            <button
              type="button"
              onClick={() => setInputMode("curl")}
              className={clsx(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-150",
                inputMode === "curl"
                  ? "bg-surface text-text-primary shadow-sm"
                  : "text-text-tertiary hover:text-text-secondary",
              )}
            >
              <Terminal className="h-3.5 w-3.5" />
              cURL Import
            </button>
          </div>
        </div>

        {/* Draft restore banner */}
        {draft.hasDraft && mode === "create" && (
          <div className="flex items-center gap-3 rounded-lg border border-accent/20 bg-accent-light px-4 py-3 mb-4">
            <RotateCcw className="h-4 w-4 text-accent shrink-0" />
            <p className="text-xs text-text-secondary flex-1">You have an unsaved draft from {draft.draftAge}.</p>
            <button type="button" onClick={handleRestoreDraft} className="text-xs font-medium text-accent hover:underline">Restore</button>
            <button type="button" onClick={draft.dismissDraft} className="text-xs text-text-tertiary hover:text-text-secondary">Dismiss</button>
          </div>
        )}

        {/* First endpoint onboarding hint */}
        {isFirstEndpoint && mode === "create" && (
          <div className="flex items-center gap-3 rounded-lg border border-accent/20 bg-accent-light/50 px-4 py-3 mb-4">
            <Lightbulb className="h-4 w-4 text-accent shrink-0" />
            <p className="text-xs text-text-secondary">Start by entering your API's URL and running a test to verify connectivity.</p>
          </div>
        )}

        {/* Template Selector (create mode only) */}
        {mode === "create" && (
          <TemplateSelector onApply={handleApplyTemplate} />
        )}

        {/* cURL Input Area */}
        {inputMode === "curl" && (
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
                autoFocus={mode === "create"}
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

        {/* Form Fields */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <FieldGroup label="Name" htmlFor="name" required>
            <input
              id="name"
              type="text"
              placeholder={"e.g., User Service \u2014 GET /users"}
              value={form.name ?? ""}
              onChange={(e) => updateField("name", e.target.value)}
              onBlur={() => setTouched(t => ({...t, name: true}))}
              className={clsx("input", nameError && "border-risk-critical")}
              autoFocus={mode === "create" && inputMode === "form"}
              maxLength={100}
            />
            <div className="flex items-center justify-between mt-1">
              {nameError && <p className="text-[10px] text-risk-critical">{nameError}</p>}
              <span className="text-[10px] text-text-tertiary ml-auto">{form.name.length}/100</span>
            </div>
          </FieldGroup>

          {/* Postman-style URL Bar */}
          <FieldGroup label="Endpoint URL" htmlFor="url" required>
            <div className="flex items-stretch rounded-lg border border-border overflow-hidden focus-within:border-accent focus-within:ring-2 focus-within:ring-accent-light transition-all">
              <div className="relative flex items-center border-r border-border bg-surface-secondary">
                <select value={form.method} onChange={e => updateField("method", e.target.value)}
                  className={clsx("appearance-none bg-transparent pl-3 pr-7 py-2.5 text-xs font-bold font-mono cursor-pointer outline-none", METHOD_COLORS[form.method] || "text-text-primary")}
                >
                  {HTTP_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-text-tertiary" />
              </div>
              <input type="url" placeholder="https://api.example.com/v1/users" value={form.url}
                onChange={e => updateField("url", e.target.value)}
                onBlur={() => setTouched(t => ({...t, url: true}))}
                className={clsx("flex-1 bg-transparent px-3 py-2.5 text-sm font-mono outline-none placeholder:text-text-tertiary")}
              />
            </div>
            {urlError && <p className="text-[10px] text-risk-critical mt-1">{urlError}</p>}
          </FieldGroup>

          {/* Expected Status */}
          <FieldGroup label="Expected Status" htmlFor="status">
            <input
              id="status"
              type="number"
              min={100}
              max={599}
              value={form.expected_status ?? 200}
              onChange={(e) =>
                updateField(
                  "expected_status",
                  parseInt(e.target.value, 10) || 200,
                )
              }
              className="input font-mono text-[13px] tabular-nums w-32"
            />
          </FieldGroup>

          {/* Schema capture display */}
          {expectedSchema && (
            <div className="space-y-2 rounded-lg border border-border bg-surface-secondary/50 p-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs">
                  <input type="checkbox" checked={validateSchema} onChange={e => setValidateSchema(e.target.checked)}
                    className="rounded border-border text-accent focus:ring-accent h-3.5 w-3.5" />
                  <span className="font-medium text-text-secondary">Validate response schema</span>
                </label>
                <button type="button" onClick={() => setExpectedSchema(null)} className="text-[10px] text-text-tertiary hover:text-risk-critical">Clear</button>
              </div>
              <pre className="max-h-32 overflow-auto rounded bg-surface-tertiary p-2 text-[10px] font-mono text-text-secondary">
                {JSON.stringify(expectedSchema, null, 2)}
              </pre>
            </div>
          )}

          {/* V2 Config Tabs */}
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
                    tab.dimmed && "opacity-50",
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
                  {kvCount(params) === 0 && (
                    <p className="px-3 pb-2 text-[10px] text-text-tertiary">Query parameters are appended to the URL, e.g. ?page=1&limit=10</p>
                  )}
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
                  {kvCount(headers) === 0 && (
                    <p className="px-3 pb-2 text-[10px] text-text-tertiary">Custom HTTP headers like Accept, Content-Type, or X-API-Key.</p>
                  )}
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

          {/* Monitoring Interval */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-text-secondary">Monitoring Interval</label>
            <div className="flex items-center gap-1 rounded-lg bg-surface-tertiary p-0.5">
              {INTERVAL_PRESETS.map(preset => (
                <button key={preset.value} type="button" onClick={() => { updateField("monitoring_interval_seconds", preset.value); setCustomInterval(false); }}
                  className={clsx("px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                    !customInterval && (form.monitoring_interval_seconds ?? 300) === preset.value
                      ? "bg-surface text-text-primary shadow-sm"
                      : "text-text-tertiary hover:text-text-secondary"
                  )}
                >{preset.label}</button>
              ))}
              <button type="button" onClick={() => setCustomInterval(true)}
                className={clsx("px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                  customInterval ? "bg-surface text-text-primary shadow-sm" : "text-text-tertiary hover:text-text-secondary"
                )}
              >Custom</button>
            </div>
            {customInterval && (
              <input type="number" min={10} max={86400} value={form.monitoring_interval_seconds ?? 300}
                onChange={e => updateField("monitoring_interval_seconds", parseInt(e.target.value, 10) || 300)}
                className="input w-32 font-mono text-xs tabular-nums" placeholder="seconds"
              />
            )}
            <p className="text-[10px] text-text-tertiary">
              Check every {humanizeInterval(form.monitoring_interval_seconds ?? 300)}
            </p>
          </div>

          {/* Test Request Button */}
          <button
            type="button"
            onClick={handleTestRequest}
            disabled={testSending || !form.url?.trim()}
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

          {/* Test Result Panel */}
          {showTestResult && (
            <TestResultPanel
              response={testResponse}
              sending={testSending}
              onClose={() => {
                setShowTestResult(false);
                setTestResponse(null);
              }}
              onApplyStatus={(status) => {
                updateField("expected_status", status);
                toast.success("Expected status updated");
              }}
              onCaptureSchema={(schema) => {
                setExpectedSchema(schema);
                toast.success("Response schema captured");
              }}
            />
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
            disabled={isSubmitting}
            className="btn-primary w-full justify-center py-2.5"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {mode === "edit" ? "Saving..." : "Creating..."}
              </>
            ) : (
              submitLabel
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
