import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Rocket,
  CheckCircle2,
  Circle,
  ChevronRight,
  X,
  Sparkles,
} from "lucide-react";
import clsx from "clsx";
import { useOnboarding } from "@/hooks/useOnboarding.ts";

/**
 * Onboarding checklist — appears on the Dashboard when setup is incomplete.
 *
 * - Shows a progress bar with step count
 * - Each step links to the relevant page/action
 * - Dismissible (persisted in localStorage)
 * - Auto-hides when all steps are complete (with celebration state)
 */
export function OnboardingChecklist() {
  const { data: status, isLoading } = useOnboarding();
  const [dismissed, setDismissed] = useState(() =>
    localStorage.getItem("sentinel_onboarding_dismissed") === "true",
  );

  if (isLoading || !status || dismissed) return null;

  // All complete → show celebration briefly, then nothing
  if (status.percent === 100) {
    return <CompletionBanner />;
  }

  function handleDismiss() {
    setDismissed(true);
    localStorage.setItem("sentinel_onboarding_dismissed", "true");
  }

  return (
    <div className="card overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-border px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <Rocket className="h-4.5 w-4.5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">
              Getting Started
            </h3>
            <p className="text-xs text-text-secondary">
              Complete these steps to unlock full monitoring
            </p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="rounded-md p-1 text-text-tertiary hover:text-text-secondary hover:bg-surface-tertiary transition-colors"
          aria-label="Dismiss onboarding"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="px-5 pt-4 pb-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-text-secondary">
            {status.completed_count} of {status.total_count} complete
          </span>
          <span className="text-xs font-semibold text-accent tabular-nums">
            {status.percent}%
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-surface-tertiary overflow-hidden">
          <div
            className="h-full rounded-full bg-accent transition-all duration-700 ease-out"
            style={{ width: `${status.percent}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="px-3 py-3 space-y-1">
        {status.steps.map((step) => (
          <Link
            key={step.key}
            to={step.link}
            className={clsx(
              "group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all",
              step.completed
                ? "opacity-60"
                : "hover:bg-surface-secondary/70",
            )}
          >
            {/* Icon */}
            {step.completed ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-risk-low" />
            ) : (
              <Circle className="h-5 w-5 shrink-0 text-text-tertiary group-hover:text-accent transition-colors" />
            )}

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p
                className={clsx(
                  "text-sm font-medium",
                  step.completed
                    ? "text-text-secondary line-through decoration-text-tertiary/50"
                    : "text-text-primary",
                )}
              >
                {step.title}
              </p>
              {!step.completed && (
                <p className="text-xs text-text-tertiary mt-0.5">
                  {step.description}
                </p>
              )}
            </div>

            {/* Arrow for incomplete */}
            {!step.completed && (
              <ChevronRight className="h-4 w-4 shrink-0 text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}

/** Celebration banner when all steps are complete */
function CompletionBanner() {
  const [hidden, setHidden] = useState(() =>
    localStorage.getItem("sentinel_onboarding_complete_seen") === "true",
  );

  if (hidden) return null;

  function handleClose() {
    setHidden(true);
    localStorage.setItem("sentinel_onboarding_complete_seen", "true");
    localStorage.setItem("sentinel_onboarding_dismissed", "true");
  }

  return (
    <div className="card overflow-hidden animate-fade-in border-accent/20">
      <div className="flex items-center gap-4 px-5 py-4 bg-accent/[0.03]">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-text-primary">
            All set! Your monitoring is fully configured.
          </h3>
          <p className="text-xs text-text-secondary mt-0.5">
            SentinelAI is now watching your endpoints around the clock.
          </p>
        </div>
        <button
          onClick={handleClose}
          className="rounded-md p-1.5 text-text-tertiary hover:text-text-secondary hover:bg-surface-tertiary transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
