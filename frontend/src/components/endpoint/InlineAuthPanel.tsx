import type React from "react";
import {
  Lock,
  Key,
  User,
  ShieldOff,
  ChevronDown,
} from "lucide-react";
import type {
  AuthConfig,
  AuthType,
  ApiKeyLocation,
} from "@/types/apiTester.ts";
import clsx from "clsx";

const AUTH_TYPES: { value: AuthType; label: string; icon: typeof Lock }[] = [
  { value: "none", label: "No Auth", icon: ShieldOff },
  { value: "bearer", label: "Bearer Token", icon: Lock },
  { value: "basic", label: "Basic Auth", icon: User },
  { value: "api-key", label: "API Key", icon: Key },
];

interface InlineAuthPanelProps {
  auth: AuthConfig;
  setAuth: React.Dispatch<React.SetStateAction<AuthConfig>>;
}

export function InlineAuthPanel({ auth, setAuth }: InlineAuthPanelProps) {
  return (
    <div className="space-y-4 p-4">
      {/* Auth type selector */}
      <div>
        <label className="mb-1.5 block text-[11px] font-medium text-text-tertiary uppercase tracking-wider">
          Authorization Type
        </label>
        <div className="relative">
          <select
            value={auth.type}
            onChange={(e) =>
              setAuth((a) => ({ ...a, type: e.target.value as AuthType }))
            }
            className="input appearance-none pr-8 text-xs"
          >
            {AUTH_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-tertiary" />
        </div>
      </div>

      {auth.type === "none" && (
        <div className="flex items-center gap-2 rounded-lg bg-surface-secondary px-3 py-4 text-xs text-text-tertiary">
          <ShieldOff className="h-4 w-4" />
          <span>This request does not use any authorization.</span>
        </div>
      )}
      {auth.type === "none" && (
        <p className="text-[10px] text-text-tertiary mt-1">Most production APIs require authentication.</p>
      )}

      {auth.type === "bearer" && (
        <div>
          <label className="mb-1.5 block text-[11px] font-medium text-text-tertiary uppercase tracking-wider">
            Token
          </label>
          <input
            type="text"
            value={auth.bearer.token}
            onChange={(e) =>
              setAuth((a) => ({ ...a, bearer: { token: e.target.value } }))
            }
            placeholder="Enter Bearer token..."
            className="input font-mono text-xs"
            spellCheck={false}
          />
          <p className="mt-1.5 text-[10px] text-text-tertiary">
            The token will be sent as{" "}
            <code className="rounded bg-surface-tertiary px-1 py-0.5 font-mono text-text-secondary">
              Authorization: Bearer &lt;token&gt;
            </code>
          </p>
        </div>
      )}

      {auth.type === "basic" && (
        <div className="space-y-3">
          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-text-tertiary uppercase tracking-wider">
              Username
            </label>
            <input
              type="text"
              value={auth.basic.username}
              onChange={(e) =>
                setAuth((a) => ({
                  ...a,
                  basic: { ...a.basic, username: e.target.value },
                }))
              }
              placeholder="Username"
              className="input text-xs"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-text-tertiary uppercase tracking-wider">
              Password
            </label>
            <input
              type="password"
              value={auth.basic.password}
              onChange={(e) =>
                setAuth((a) => ({
                  ...a,
                  basic: { ...a.basic, password: e.target.value },
                }))
              }
              placeholder="Password"
              className="input text-xs"
            />
          </div>
        </div>
      )}

      {auth.type === "api-key" && (
        <div className="space-y-3">
          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-text-tertiary uppercase tracking-wider">
              Key Name
            </label>
            <input
              type="text"
              value={auth.apiKey.key}
              onChange={(e) =>
                setAuth((a) => ({
                  ...a,
                  apiKey: { ...a.apiKey, key: e.target.value },
                }))
              }
              placeholder="X-API-Key"
              className="input font-mono text-xs"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-text-tertiary uppercase tracking-wider">
              Value
            </label>
            <input
              type="text"
              value={auth.apiKey.value}
              onChange={(e) =>
                setAuth((a) => ({
                  ...a,
                  apiKey: { ...a.apiKey, value: e.target.value },
                }))
              }
              placeholder="Enter API key value..."
              className="input font-mono text-xs"
              spellCheck={false}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-text-tertiary uppercase tracking-wider">
              Add to
            </label>
            <div className="inline-flex rounded-lg bg-surface-tertiary p-0.5">
              {(["header", "query"] as ApiKeyLocation[]).map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() =>
                    setAuth((a) => ({
                      ...a,
                      apiKey: { ...a.apiKey, addTo: loc },
                    }))
                  }
                  className={clsx(
                    "rounded-md px-3 py-1.5 text-[11px] font-medium transition-all",
                    auth.apiKey.addTo === loc
                      ? "bg-surface text-text-primary shadow-sm"
                      : "text-text-tertiary hover:text-text-secondary",
                  )}
                >
                  {loc === "header" ? "Header" : "Query Param"}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
