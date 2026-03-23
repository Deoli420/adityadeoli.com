import { Check } from "lucide-react";
import clsx from "clsx";

interface Props {
  hasBasicInfo: boolean;
  hasConfig: boolean;
  hasTested: boolean;
}

const STEPS = [
  { key: "basic", label: "Basic Info" },
  { key: "config", label: "Configuration" },
  { key: "tested", label: "Tested" },
] as const;

export function CompletionIndicator({ hasBasicInfo, hasConfig, hasTested }: Props) {
  const completed = [hasBasicInfo, hasConfig, hasTested];

  return (
    <div className="flex items-center gap-1 py-2">
      {STEPS.map((step, i) => (
        <div key={step.key} className="flex items-center gap-1">
          {i > 0 && <div className={clsx("h-px w-4", completed[i] ? "bg-risk-low" : "bg-border")} />}
          <div className="flex items-center gap-1.5">
            {completed[i] ? (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-risk-low">
                <Check className="h-2.5 w-2.5 text-white" />
              </span>
            ) : (
              <span className="h-4 w-4 rounded-full border-2 border-border" />
            )}
            <span className={clsx("text-[10px] font-medium", completed[i] ? "text-risk-low" : "text-text-tertiary")}>{step.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
