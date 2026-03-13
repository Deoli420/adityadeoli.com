import { useState } from "react";
import {
  Download,
  FileSpreadsheet,
  AlertTriangle,
  Shield,
  Activity,
  Loader2,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import clsx from "clsx";
import toast from "react-hot-toast";
import { useEndpoints } from "@/hooks/useEndpoints.ts";
import {
  exportRuns,
  exportIncidents,
  exportRiskScores,
  exportSLA,
  type ExportParams,
} from "@/services/endpointsService.ts";

// ── Export type definitions ──────────────────────────────────────────────────

interface ExportType {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  exportFn: (params: ExportParams) => Promise<void>;
  supportsDateRange: boolean;
}

const EXPORT_TYPES: ExportType[] = [
  {
    id: "runs",
    label: "Monitoring Runs",
    description:
      "Status codes, response times, success/failure for every probe.",
    icon: Activity,
    color: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    exportFn: exportRuns,
    supportsDateRange: true,
  },
  {
    id: "incidents",
    label: "Incidents",
    description:
      "Lifecycle data: status, severity, timestamps, duration.",
    icon: AlertTriangle,
    color: "text-orange-400 bg-orange-500/10 border-orange-500/20",
    exportFn: exportIncidents,
    supportsDateRange: true,
  },
  {
    id: "risk",
    label: "Risk Scores",
    description:
      "Score history with anomaly details and risk levels.",
    icon: Shield,
    color: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    exportFn: exportRiskScores,
    supportsDateRange: true,
  },
  {
    id: "sla",
    label: "SLA Compliance",
    description:
      "Current uptime vs targets for all endpoints with active SLAs.",
    icon: FileSpreadsheet,
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    exportFn: exportSLA,
    supportsDateRange: false,
  },
];

// ── Date presets ─────────────────────────────────────────────────────────────

const DATE_PRESETS = [
  { label: "Last 24h", days: 1 },
  { label: "Last 7d", days: 7 },
  { label: "Last 30d", days: 30 },
  { label: "Last 90d", days: 90 },
  { label: "All time", days: 0 },
] as const;

function getPresetDates(days: number): { from: string; to: string } | null {
  if (days === 0) return null;
  const to = new Date();
  const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
  return {
    from: from.toISOString(),
    to: to.toISOString(),
  };
}

// ── Main component ──────────────────────────────────────────────────────────

export function ExportPage() {
  const { data: endpoints } = useEndpoints();
  const [selectedType, setSelectedType] = useState<string>("runs");
  const [selectedPreset, setSelectedPreset] = useState<number>(7);
  const [selectedEndpoints, setSelectedEndpoints] = useState<string[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [lastExport, setLastExport] = useState<string | null>(null);

  const activeType = EXPORT_TYPES.find((t) => t.id === selectedType)!;

  function toggleEndpoint(id: string) {
    setSelectedEndpoints((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id],
    );
  }

  async function handleExport() {
    setLoading(activeType.id);
    setLastExport(null);

    const params: ExportParams = {};
    if (selectedEndpoints.length > 0) {
      params.endpointIds = selectedEndpoints;
    }
    if (activeType.supportsDateRange) {
      const dates = getPresetDates(selectedPreset);
      if (dates) {
        params.dateFrom = dates.from;
        params.dateTo = dates.to;
      }
    }

    try {
      await activeType.exportFn(params);
      setLastExport(activeType.id);
      toast.success(`${activeType.label} exported successfully`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Export failed",
      );
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-2 py-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <Download className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-text-primary">
              Export &amp; Reports
            </h1>
            <p className="text-sm text-text-secondary">
              Download monitoring data as CSV files
            </p>
          </div>
        </div>
      </div>

      {/* Export type selector */}
      <div>
        <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-text-tertiary">
          Report Type
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {EXPORT_TYPES.map((type) => {
            const Icon = type.icon;
            const active = selectedType === type.id;
            return (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={clsx(
                  "flex flex-col items-center gap-2 rounded-xl border p-4 transition-all",
                  active
                    ? "border-accent/40 bg-accent/5 ring-1 ring-accent/20"
                    : "border-border bg-surface hover:bg-surface-tertiary hover:border-text-tertiary",
                )}
              >
                <div
                  className={clsx(
                    "flex h-9 w-9 items-center justify-center rounded-lg border",
                    active ? "bg-accent/15 text-accent border-accent/25" : type.color,
                  )}
                >
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <span
                  className={clsx(
                    "text-xs font-medium",
                    active ? "text-text-primary" : "text-text-secondary",
                  )}
                >
                  {type.label}
                </span>
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-text-tertiary">{activeType.description}</p>
      </div>

      {/* Date range (only for types that support it) */}
      {activeType.supportsDateRange && (
        <div>
          <h2 className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-text-tertiary">
            <Calendar className="h-3.5 w-3.5" />
            Date Range
          </h2>
          <div className="flex flex-wrap gap-2">
            {DATE_PRESETS.map((preset) => (
              <button
                key={preset.days}
                onClick={() => setSelectedPreset(preset.days)}
                className={clsx(
                  "rounded-lg border px-3.5 py-1.5 text-xs font-medium transition-all",
                  selectedPreset === preset.days
                    ? "border-accent/40 bg-accent/10 text-accent"
                    : "border-border bg-surface text-text-secondary hover:bg-surface-tertiary hover:text-text-primary",
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Endpoint filter */}
      <div>
        <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-text-tertiary">
          Filter by Endpoints{" "}
          <span className="text-text-tertiary">
            ({selectedEndpoints.length === 0
              ? "all"
              : `${selectedEndpoints.length} selected`})
          </span>
        </h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {endpoints?.map((ep) => {
            const active = selectedEndpoints.includes(ep.id);
            return (
              <button
                key={ep.id}
                onClick={() => toggleEndpoint(ep.id)}
                className={clsx(
                  "flex items-center gap-3 rounded-lg border px-4 py-2.5 text-left transition-all",
                  active
                    ? "border-accent/30 bg-accent/5"
                    : "border-border bg-surface hover:bg-surface-tertiary",
                )}
              >
                <div
                  className={clsx(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-all",
                    active
                      ? "border-accent bg-accent text-white"
                      : "border-border bg-surface-tertiary",
                  )}
                >
                  {active && <CheckCircle2 className="h-3 w-3" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className={clsx(
                      "truncate text-sm font-medium",
                      active ? "text-text-primary" : "text-text-primary",
                    )}
                  >
                    {ep.name}
                  </p>
                  <p className="truncate text-xs text-text-secondary">
                    {ep.method} {ep.url}
                  </p>
                </div>
              </button>
            );
          })}
          {(!endpoints || endpoints.length === 0) && (
            <p className="col-span-2 py-4 text-center text-sm text-text-tertiary">
              No endpoints found
            </p>
          )}
        </div>
      </div>

      {/* Export button */}
      <div className="flex items-center gap-4 rounded-xl border border-border bg-surface px-6 py-5">
        <button
          onClick={handleExport}
          disabled={loading !== null}
          className={clsx(
            "flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-all",
            loading
              ? "cursor-not-allowed bg-accent/50 text-white/70"
              : "bg-accent text-white hover:bg-accent/90 shadow-lg shadow-accent/20",
          )}
        >
          {loading === activeType.id ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {loading === activeType.id ? "Exporting…" : `Export ${activeType.label}`}
        </button>

        {lastExport === activeType.id && (
          <span className="flex items-center gap-1.5 text-xs text-success">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Downloaded
          </span>
        )}

        <span className="ml-auto text-xs text-text-tertiary">
          CSV format · max 10,000 rows
        </span>
      </div>
    </div>
  );
}
