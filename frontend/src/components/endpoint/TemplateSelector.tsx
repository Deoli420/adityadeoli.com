import { useState } from "react";
import { Heart, Server, Webhook, Code2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { uid } from "@/utils/endpointForm.ts";
import type { AuthConfig, BodyConfig, KeyValuePair } from "@/types/apiTester.ts";

export interface EndpointTemplate {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  values: {
    name?: string;
    method?: string;
    expected_status?: number;
    monitoring_interval_seconds?: number;
    headers?: KeyValuePair[];
    auth?: Partial<AuthConfig>;
    body?: Partial<BodyConfig>;
  };
}

const TEMPLATES: EndpointTemplate[] = [
  {
    id: "health",
    label: "Health Check",
    icon: Heart,
    description: "Simple uptime monitor",
    values: { method: "GET", expected_status: 200, monitoring_interval_seconds: 30 },
  },
  {
    id: "rest",
    label: "REST API",
    icon: Server,
    description: "Authenticated API endpoint",
    values: {
      method: "GET", expected_status: 200, monitoring_interval_seconds: 300,
      headers: [{ id: uid(), key: "Accept", value: "application/json", enabled: true }],
      auth: { type: "bearer" as const, bearer: { token: "" } },
    },
  },
  {
    id: "webhook",
    label: "Webhook",
    icon: Webhook,
    description: "POST endpoint with body",
    values: {
      method: "POST", expected_status: 200, monitoring_interval_seconds: 300,
      headers: [{ id: uid(), key: "Content-Type", value: "application/json", enabled: true }],
      body: { type: "json" as const, raw: '{\n  "event": "test",\n  "timestamp": "2024-01-01T00:00:00Z"\n}' },
    },
  },
  {
    id: "graphql",
    label: "GraphQL",
    icon: Code2,
    description: "GraphQL query endpoint",
    values: {
      method: "POST", expected_status: 200, monitoring_interval_seconds: 300,
      headers: [{ id: uid(), key: "Content-Type", value: "application/json", enabled: true }],
      body: { type: "json" as const, raw: '{\n  "query": "{ __typename }"\n}' },
    },
  },
];

interface Props {
  onApply: (template: EndpointTemplate) => void;
  onReset: () => void;
  activeTemplateId?: string | null;
}

export function TemplateSelector({ onApply, onReset, activeTemplateId }: Props) {
  const [visible, setVisible] = useState(true);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-text-secondary">
                {activeTemplateId ? "Template applied — pick another or start fresh" : "Start from a template"}
              </p>
              <div className="flex items-center gap-2">
                {activeTemplateId && (
                  <button type="button" onClick={onReset} className="text-[10px] font-medium text-risk-critical hover:underline">
                    Reset form
                  </button>
                )}
                <button type="button" onClick={() => setVisible(false)} className="text-text-tertiary hover:text-text-secondary">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {TEMPLATES.map(t => (
                <button key={t.id} type="button" onClick={() => onApply(t)}
                  className={clsx(
                    "flex items-center gap-3 rounded-lg border p-3 text-left transition-all",
                    activeTemplateId === t.id
                      ? "border-accent bg-accent-light/50 ring-1 ring-accent/20"
                      : "border-border bg-surface hover:border-accent/30 hover:bg-accent-light/30",
                  )}
                >
                  <t.icon className="h-4 w-4 text-accent shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-text-primary">{t.label}</p>
                    <p className="text-[10px] text-text-tertiary">{t.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
