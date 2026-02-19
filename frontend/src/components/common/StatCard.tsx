import type { ReactNode } from "react";
import clsx from "clsx";

type AccentType = "success" | "warning" | "danger";

interface StatCardProps {
  label: string;
  value: ReactNode;
  subValue?: ReactNode;
  icon?: ReactNode;
  accent?: AccentType;
  className?: string;
}

const ACCENT_STYLES: Record<AccentType, { icon: string; value: string }> = {
  success: { icon: "text-risk-low", value: "text-risk-low" },
  warning: { icon: "text-risk-medium", value: "text-risk-medium" },
  danger: { icon: "text-risk-critical", value: "text-risk-critical" },
};

/**
 * Minimal stat card — used on the dashboard for KPIs.
 *
 * Design principles:
 * - Value is the hero (large, bold, tabular-nums for alignment)
 * - Label is muted and small (above the value)
 * - Optional icon aligned top-right with accent colouring
 * - Subtle card shadow from the `.card` class
 */
export function StatCard({
  label,
  value,
  subValue,
  icon,
  accent,
  className,
}: StatCardProps) {
  const accentStyle = accent ? ACCENT_STYLES[accent] : undefined;

  return (
    <div className={clsx("card p-5", className)}>
      <div className="flex items-start justify-between">
        <p className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider">
          {label}
        </p>
        {icon && (
          <span className={clsx(accentStyle?.icon ?? "text-text-tertiary")}>
            {icon}
          </span>
        )}
      </div>
      <p
        className={clsx(
          "mt-2 text-2xl font-semibold tabular-nums",
          accentStyle?.value ?? "text-text-primary",
        )}
      >
        {value}
      </p>
      {subValue && (
        <p className="mt-1 text-[11px] text-text-secondary">{subValue}</p>
      )}
    </div>
  );
}
