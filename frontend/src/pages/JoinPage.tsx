import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { joinInvite, validateInvite } from "@/services/userService.ts";
import { useAuthStore } from "@/stores/authStore.ts";

interface InviteInfo {
  email: string;
  org_name: string;
  role: string;
}

/**
 * Join-via-invite page.
 *
 * 1. Validates the invite token on mount.
 * 2. Shows the invite details (org, role, email).
 * 3. Collects display name + password and completes signup.
 */
export function JoinPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [validating, setValidating] = useState(true);
  const [invalid, setInvalid] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setInvalid(true);
      setValidating(false);
      return;
    }

    validateInvite(token)
      .then((data) => {
        setInvite(data);
      })
      .catch(() => {
        setInvalid(true);
      })
      .finally(() => {
        setValidating(false);
      });
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!displayName.trim() || !password.trim()) {
      setError("Display name and password are required.");
      return;
    }

    setLoading(true);
    try {
      const res = await joinInvite(token!, {
        display_name: displayName.trim(),
        password,
      });
      setAuth(res.user, res.access_token);
      navigate("/", { replace: true });
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to join. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  // ── Loading state ────────────────────────────────────────────────────
  if (validating) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-secondary p-4">
        <Loader2 className="h-8 w-8 animate-spin text-text-tertiary" />
      </div>
    );
  }

  // ── Invalid / expired token ──────────────────────────────────────────
  if (invalid || !invite) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-secondary p-4">
        <div className="w-full max-w-sm">
          <div className="card p-6 text-center">
            <h2 className="text-sm font-semibold text-text-primary mb-2">
              Invalid Invite
            </h2>
            <p className="text-xs text-text-secondary mb-4">
              This invite is invalid or has expired.
            </p>
            <Link
              to="/login"
              className="text-accent hover:underline text-xs font-medium"
            >
              Go to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Valid invite — join form ──────────────────────────────────────────
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
            Join {invite.org_name}
          </h1>
          <p className="text-xs text-text-tertiary">
            You've been invited as{" "}
            <span className="font-medium text-text-secondary">
              {invite.role}
            </span>
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
            {/* Email (read-only) */}
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
                value={invite.email}
                readOnly
                className="input opacity-60"
              />
            </div>

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

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-2.5"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Joining\u2026" : "Join Team"}
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
