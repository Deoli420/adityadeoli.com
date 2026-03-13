import { Shield, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useSecurityFindings } from "@/hooks/useSecurity.ts";
import { Skeleton } from "@/components/common/Skeleton.tsx";
import { timeAgo } from "@/utils/formatters.ts";
import clsx from "clsx";

const SEVERITY_STYLES: Record<string, string> = {
  CRITICAL: "bg-red-500/15 text-red-400 border-red-500/30",
  HIGH: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  MEDIUM: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  LOW: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
};

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
 * Table listing all security findings for the org, sorted by recency.
 */
export function SecurityFindingsTable() {
  const { data: findings, isLoading } = useSecurityFindings(100);

  if (isLoading) {
    return (
      <div className="card p-5">
        <Skeleton className="h-4 w-40 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!findings || findings.length === 0) {
    return (
      <div className="card p-5">
        <h3 className="text-sm font-medium text-text-primary mb-4">
          Security Findings
        </h3>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Shield className="mb-3 h-10 w-10 text-text-tertiary/40" />
          <p className="text-sm font-medium text-text-secondary">
            No credential leaks detected
          </p>
          <p className="mt-1 text-xs text-text-tertiary">
            SentinelAI scans every API response for accidentally exposed secrets.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-5">
      <h3 className="text-sm font-medium text-text-primary mb-4">
        Security Findings
        <span className="ml-2 text-xs text-text-tertiary font-normal">
          ({findings.length})
        </span>
      </h3>

      <div className="space-y-2">
        {findings.map((f) => (
          <Link
            key={f.id}
            to={`/endpoints/${f.endpoint_id}`}
            className="flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3 hover:bg-surface-tertiary transition-colors group"
          >
            {/* Severity dot */}
            <div
              className={clsx(
                "h-2 w-2 rounded-full shrink-0",
                f.severity === "CRITICAL" && "bg-red-500",
                f.severity === "HIGH" && "bg-orange-500",
                f.severity === "MEDIUM" && "bg-yellow-500",
                f.severity === "LOW" && "bg-emerald-500",
              )}
            />

            {/* Type badge */}
            <span
              className={clsx(
                "shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase",
                SEVERITY_STYLES[f.severity] ?? SEVERITY_STYLES.MEDIUM,
              )}
            >
              {f.severity}
            </span>

            {/* Pattern name */}
            <span className="flex-1 text-sm text-text-secondary truncate">
              {TYPE_LABELS[f.finding_type] ?? f.finding_type}
              {f.redacted_preview && (
                <span className="ml-2 font-mono text-[11px] text-text-tertiary">
                  {f.redacted_preview}
                </span>
              )}
            </span>

            {/* Time */}
            <span className="shrink-0 text-[11px] text-text-tertiary">
              {timeAgo(f.created_at)}
            </span>

            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        ))}
      </div>
    </div>
  );
}
