import { useState } from "react";
import {
  FileCheck2,
  Upload,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getContractViolations,
  uploadOpenApiSpec,
} from "@/services/endpointsService.ts";
import { Skeleton } from "@/components/common/Skeleton.tsx";
import toast from "react-hot-toast";
import clsx from "clsx";

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: "text-red-400",
  HIGH: "text-orange-400",
  MEDIUM: "text-yellow-400",
  LOW: "text-emerald-400",
};

/**
 * Contract violations panel on EndpointDetailPage.
 *
 * Shows:
 *  - Upload button for OpenAPI spec (JSON)
 *  - List of violations from latest run validation
 */
export function ContractViolations({ endpointId }: { endpointId: string }) {
  const qc = useQueryClient();
  const [showUpload, setShowUpload] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["contract-violations", endpointId],
    queryFn: () => getContractViolations(endpointId),
    enabled: !!endpointId,
  });

  const uploadMutation = useMutation({
    mutationFn: (spec: object) => uploadOpenApiSpec(endpointId, spec),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contract-violations", endpointId] });
      toast.success("OpenAPI spec uploaded");
      setShowUpload(false);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Upload failed");
    },
  });

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const spec = JSON.parse(reader.result as string);
        uploadMutation.mutate(spec);
      } catch {
        toast.error("Invalid JSON file");
      }
    };
    reader.readAsText(file);
  }

  if (isLoading) {
    return (
      <div className="card p-5">
        <Skeleton className="h-4 w-40 mb-3" />
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>
    );
  }

  const violations = data?.violations ?? [];
  const hasViolations = data?.has_violations ?? false;

  return (
    <div className="card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10">
            <FileCheck2 className="h-4 w-4 text-blue-400" />
          </div>
          <h3 className="text-sm font-medium text-text-primary">
            API Contract Testing
          </h3>
          {hasViolations && (
            <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-semibold text-red-400">
              {violations.length} violation{violations.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        <button
          onClick={() => setShowUpload(!showUpload)}
          className="flex items-center gap-1.5 rounded-lg bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-400 hover:bg-blue-500/20 transition-all"
        >
          <Upload className="h-3.5 w-3.5" />
          Upload Spec
        </button>
      </div>

      {/* Upload area */}
      {showUpload && (
        <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] p-4 text-center">
          <p className="text-xs text-text-tertiary mb-3">
            Upload an OpenAPI 3.x spec (JSON) to enable contract validation.
          </p>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-500/10 px-4 py-2 text-xs font-medium text-blue-400 hover:bg-blue-500/20 transition-all">
            {uploadMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Upload className="h-3.5 w-3.5" />
            )}
            {uploadMutation.isPending ? "Uploading…" : "Choose JSON File"}
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleFileUpload}
              disabled={uploadMutation.isPending}
            />
          </label>
        </div>
      )}

      {/* Results */}
      {!hasViolations && violations.length === 0 && !showUpload && (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <CheckCircle2 className="mb-2 h-8 w-8 text-risk-low/40" />
          <p className="text-xs text-text-tertiary">
            No contract violations detected. Upload an OpenAPI spec to enable
            validation.
          </p>
        </div>
      )}

      {violations.length > 0 && (
        <div className="space-y-2">
          {violations.map((v, i) => (
            <div
              key={i}
              className="flex items-start gap-3 rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-2.5"
            >
              <AlertCircle
                className={clsx(
                  "h-3.5 w-3.5 mt-0.5 shrink-0",
                  SEVERITY_COLORS[v.severity] ?? "text-yellow-400",
                )}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-text-secondary">
                  {v.message}
                </p>
                <p className="text-[11px] font-mono text-text-tertiary mt-0.5">
                  {v.path}
                </p>
              </div>
              <span
                className={clsx(
                  "shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase",
                  v.severity === "CRITICAL" && "bg-red-500/15 text-red-400",
                  v.severity === "HIGH" && "bg-orange-500/15 text-orange-400",
                  v.severity === "MEDIUM" && "bg-yellow-500/15 text-yellow-400",
                  v.severity === "LOW" && "bg-emerald-500/15 text-emerald-400",
                )}
              >
                {v.severity}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
