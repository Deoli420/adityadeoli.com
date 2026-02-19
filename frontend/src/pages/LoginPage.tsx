import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { authService } from "@/services/authService.ts";
import { useAuthStore } from "@/stores/authStore.ts";

/**
 * Full-screen login page — clean, centered, no sidebar.
 *
 * Uses the shared `.input` / `.btn-primary` design tokens for consistency.
 * Shield icon as the brand mark with a subtle accent tint.
 */
export function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orgSlug, setOrgSlug] = useState("sentinelai");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim() || !orgSlug.trim()) {
      setError("All fields are required.");
      return;
    }

    setLoading(true);
    try {
      const res = await authService.login({
        email: email.trim(),
        password,
        organization_slug: orgSlug.trim(),
      });
      setAuth(res.user, res.access_token);
      navigate("/", { replace: true });
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Login failed. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-secondary p-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="mb-8 flex flex-col items-center gap-2">
          <img
            src="/logo-icon.png"
            alt="SentinelAI"
            className="h-10 w-10"
          />
          <h1 className="text-lg font-semibold text-text-primary tracking-tight">
            SentinelAI
          </h1>
          <p className="text-xs text-text-tertiary">
            Sign in to your monitoring dashboard
          </p>
        </div>

        {/* Card */}
        <div className="card p-6">
          {/* Error */}
          {error && (
            <div className="mb-4 rounded-lg border border-risk-critical-border bg-risk-critical-bg px-3 py-2">
              <p className="text-xs text-risk-critical">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Organization slug */}
            <div>
              <label
                htmlFor="org"
                className="mb-1.5 block text-xs font-medium text-text-secondary"
              >
                Organization
              </label>
              <input
                id="org"
                type="text"
                value={orgSlug}
                onChange={(e) => setOrgSlug(e.target.value)}
                className="input"
                placeholder="sentinelai"
                autoComplete="organization"
              />
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-xs font-medium text-text-secondary"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="admin@sentinelai.com"
                autoComplete="email"
                autoFocus
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-xs font-medium text-text-secondary"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder={"\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"}
                autoComplete="current-password"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-2.5"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Signing in\u2026" : "Sign in"}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="mt-4 text-center text-[10px] text-text-tertiary">
          Protected by SentinelAI &middot; Multi-tenant monitoring
        </p>
      </div>
    </div>
  );
}
