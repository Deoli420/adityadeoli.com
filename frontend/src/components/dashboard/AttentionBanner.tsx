import { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Shield, TrendingUp, Zap } from "lucide-react";
import clsx from "clsx";
import { useIncidents } from "@/hooks/useIncidents.ts";
import { useClusters } from "@/hooks/useClusters.ts";
import { useFeatureSummary } from "@/hooks/useFeatureSummary.ts";
import { useSecurityStats } from "@/hooks/useSecurity.ts";
import { Skeleton } from "@/components/common/Skeleton.tsx";

// ── Types ────────────────────────────────────────────────────────────────

interface AttentionItem {
  type: "incident" | "risk" | "security" | "cluster";
  label: string;
  link: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM";
}

const SEVERITY_BORDER: Record<AttentionItem["severity"], string> = {
  CRITICAL: "border-risk-critical",
  HIGH: "border-risk-high",
  MEDIUM: "border-risk-medium",
};

const TYPE_ICON = {
  incident: AlertTriangle,
  risk: TrendingUp,
  security: Shield,
  cluster: Zap,
} as const;

// ── Component ────────────────────────────────────────────────────────────

/**
 * Surfaces the most urgent items across incidents, risk, and security.
 * Shows a green "All systems operational" banner when everything is healthy.
 */
export function AttentionBanner() {
  const incidents = useIncidents("OPEN");
  const { data: activeClusters } = useClusters("ACTIVE");
  const features = useFeatureSummary();
  const security = useSecurityStats(1);

  const isLoading =
    incidents.isLoading || features.isLoading || security.isLoading;

  const items = useMemo<AttentionItem[]>(() => {
    const out: AttentionItem[] = [];

    // Critical / High incidents
    for (const inc of incidents.data ?? []) {
      if (inc.severity === "CRITICAL" || inc.severity === "HIGH") {
        out.push({
          type: "incident",
          label: inc.title,
          link: `/incidents/${inc.id}`,
          severity: inc.severity,
        });
      }
    }

    // High-risk endpoints
    for (const ep of features.data?.high_risk_endpoints ?? []) {
      out.push({
        type: "risk",
        label: `${ep.name} \u2014 risk ${ep.score}/100`,
        link: `/endpoints/${ep.id}`,
        severity: "HIGH",
      });
    }

    // Active clusters
    if (activeClusters && activeClusters.length > 0) {
      for (const cluster of activeClusters) {
        out.push({
          type: "cluster",
          label: `Cluster: ${cluster.member_count} endpoints failing simultaneously`,
          link: `/incidents/clusters/${cluster.id}`,
          severity: "HIGH",
        });
      }
    }

    // Security findings in last 24 h
    const count = features.data?.security_findings_24h ?? 0;
    if (count > 0) {
      out.push({
        type: "security",
        label: `${count} security finding${count === 1 ? "" : "s"} in last 24h`,
        link: "/security",
        severity: "MEDIUM",
      });
    }

    return out;
  }, [incidents.data, features.data, activeClusters]);

  // ── Loading skeleton ───────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-56 shrink-0 rounded-xl" />
        ))}
      </div>
    );
  }

  // ── Healthy state ──────────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-risk-low-bg border border-risk-low-border rounded-xl p-4 flex items-center gap-3"
      >
        <CheckCircle2 className="h-5 w-5 text-risk-low shrink-0" />
        <span className="text-sm font-medium text-text-primary">
          All systems operational
        </span>
      </motion.div>
    );
  }

  // ── Attention items ────────────────────────────────────────────────────
  return (
    <div>
      <h3 className="text-xs font-medium uppercase tracking-wider text-text-tertiary mb-2">
        Attention Needed
      </h3>

      <div className="flex gap-3 overflow-x-auto pb-1 -mb-1 scrollbar-thin">
        {items.map((item, idx) => {
          const Icon = TYPE_ICON[item.type];

          return (
            <motion.div
              key={`${item.type}-${item.link}`}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Link
                to={item.link}
                className={clsx(
                  "block shrink-0 rounded-xl border border-border bg-surface p-3 pl-4",
                  "border-l-4 transition-colors hover:bg-surface-secondary/50",
                  SEVERITY_BORDER[item.severity],
                )}
              >
                <div className="flex items-start gap-2">
                  <Icon className="h-3.5 w-3.5 mt-0.5 shrink-0 text-text-secondary" />
                  <div className="min-w-0">
                    <p className="text-xs text-text-primary truncate max-w-[200px]">
                      {item.label}
                    </p>
                    <span className="text-[11px] text-accent">View &rarr;</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
