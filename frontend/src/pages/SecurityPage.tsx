import { Shield } from "lucide-react";
import { SecurityStatsCards } from "@/components/security/SecurityStatsCards.tsx";
import { SecurityFindingsTable } from "@/components/security/SecurityFindingsTable.tsx";

/**
 * Top-level Security page — credential leak findings + stats.
 *
 * Layout:
 *   1. Page header with Shield icon
 *   2. KPI stat cards (total, affected endpoints, critical, types)
 *   3. Findings table (full-width, sorted by recency)
 */
export function SecurityPage() {
  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/10">
          <Shield className="h-5 w-5 text-red-400" />
        </div>
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-text-primary">
            Security
          </h1>
          <p className="text-xs text-text-tertiary">
            Credential leak detection across monitored API responses
          </p>
        </div>
      </div>

      {/* Stats cards */}
      <SecurityStatsCards />

      {/* Findings table */}
      <SecurityFindingsTable />
    </div>
  );
}
