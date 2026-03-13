import { Shield, AlertTriangle } from "lucide-react";
import { useEndpointSecurityFindings } from "@/hooks/useSecurity.ts";
import { Skeleton } from "@/components/common/Skeleton.tsx";
import { timeAgo } from "@/utils/formatters.ts";
import clsx from "clsx";

const TYPE_LABELS: Record<string, string> = {
  AWS_KEY: "AWS Key",
  AWS_SECRET: "AWS Secret",
  JWT: "JWT Token",
  PRIVATE_KEY: "Private Key",
  GITHUB_TOKEN: "GitHub Token",
  GITLAB_TOKEN: "GitLab Token",
  SLACK_TOKEN: "Slack Token",
  PASSWORD: "Password",
  GENERIC_SECRET: "Secret/Token",
  CONNECTION_STRING: "Connection String",
  STRIPE_KEY: "Stripe Key",
  SENDGRID_KEY: "SendGrid Key",
};

/**
 * Inline security findings panel shown on the EndpointDetailPage.
 * Displays any credential leaks detected for this endpoint.
 */
export function SecurityFindings({ endpointId }: { endpointId: string }) {
  const { data: findings, isLoading } = useEndpointSecurityFindings(
    endpointId,
    20,
  );

  if (isLoading) {
    return (
      <div className="card p-5">
        <Skeleton className="h-4 w-36 mb-3" />
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>
    );
  }

  // Don't render anything if no findings exist
  if (!findings || findings.length === 0) {
    return null;
  }

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500/10">
          <Shield className="h-4 w-4 text-red-400" />
        </div>
        <h3 className="text-sm font-medium text-text-primary">
          Security Findings
        </h3>
        <span className="ml-auto rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-semibold text-red-400">
          {findings.length} leak{findings.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="space-y-2">
        {findings.map((f) => (
          <div
            key={f.id}
            className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2.5"
          >
            {/* Severity icon */}
            <AlertTriangle
              className={clsx(
                "h-3.5 w-3.5 shrink-0",
                f.severity === "CRITICAL" && "text-red-400",
                f.severity === "HIGH" && "text-orange-400",
                f.severity === "MEDIUM" && "text-yellow-400",
                f.severity === "LOW" && "text-emerald-400",
              )}
            />

            {/* Pattern label + redacted preview */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-text-secondary truncate">
                {TYPE_LABELS[f.finding_type] ?? f.finding_type}
              </p>
              {f.redacted_preview && (
                <p className="text-[11px] font-mono text-text-tertiary truncate">
                  {f.redacted_preview}
                </p>
              )}
            </div>

            {/* Severity badge */}
            <span
              className={clsx(
                "shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase",
                f.severity === "CRITICAL" && "bg-red-500/15 text-red-400",
                f.severity === "HIGH" && "bg-orange-500/15 text-orange-400",
                f.severity === "MEDIUM" && "bg-yellow-500/15 text-yellow-400",
                f.severity === "LOW" && "bg-emerald-500/15 text-emerald-400",
              )}
            >
              {f.severity}
            </span>

            {/* Time */}
            <span className="shrink-0 text-[10px] text-text-tertiary">
              {timeAgo(f.created_at)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
