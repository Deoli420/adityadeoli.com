import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { signup } from "@/services/userService.ts";
import { useAuthStore } from "@/stores/authStore.ts";

/**
 * Full-screen signup page — mirrors the LoginPage layout exactly.
 *
 * Creates a new account + organization, then logs the user in automatically.
 */
export function SignupPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orgName, setOrgName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!displayName.trim() || !email.trim() || !password.trim()) {
      setError("Display name, email, and password are required.");
      return;
    }

    setLoading(true);
    try {
      const res = await signup({
        display_name: displayName.trim(),
        email: email.trim(),
        password,
        org_name: orgName.trim() || undefined,
      });
      setAuth(res.user, res.access_token);
      navigate("/", { replace: true });
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Signup failed. Please try again.";
      setError(msg);
      toast.error(msg);
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
            Create your account
          </h1>
          <p className="text-xs text-text-tertiary">
            Start monitoring your APIs in seconds
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
            {/* Display Name */}
            <div>
              <label
                htmlFor="displayName"
                className="mb-1.5 block text-xs font-medium text-text-secondary"
              >
                Display Name
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="input"
                placeholder="Jane Doe"
                autoComplete="name"
                autoFocus
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
                placeholder="you@example.com"
                autoComplete="email"
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
                autoComplete="new-password"
              />
            </div>

            {/* Organization Name (optional) */}
            <div>
              <label
                htmlFor="orgName"
                className="mb-1.5 block text-xs font-medium text-text-secondary"
              >
                Organization Name{" "}
                <span className="text-text-tertiary font-normal">(optional)</span>
              </label>
              <input
                id="orgName"
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="input"
                placeholder="My Company"
                autoComplete="organization"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-2.5"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Creating account\u2026" : "Create Account"}
            </button>
          </form>
        </div>

        {/* Footer link */}
        <p className="text-center text-xs text-text-tertiary mt-4">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-accent hover:underline font-medium"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
