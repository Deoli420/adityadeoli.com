import { useState } from "react";
import { Loader2, Crown, Shield, UserCircle, Eye } from "lucide-react";
import { useAuthStore } from "@/stores/authStore.ts";
import { useUpdateProfile, useChangePassword } from "@/hooks/useUsers.ts";
import type { UserRole } from "@/types/auth.ts";
import clsx from "clsx";

const ROLE_CONFIG: Record<UserRole, { label: string; color: string; icon: React.ElementType }> = {
  OWNER: { label: "Owner", color: "bg-amber-500/15 text-amber-400 border-amber-500/20", icon: Crown },
  ADMIN: { label: "Admin", color: "bg-blue-500/15 text-blue-400 border-blue-500/20", icon: Shield },
  MEMBER: { label: "Member", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20", icon: UserCircle },
  VIEWER: { label: "Viewer", color: "bg-slate-500/15 text-slate-400 border-slate-500/20", icon: Eye },
};

export function ProfileSettings() {
  const user = useAuthStore((s) => s.user);
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();

  const [displayName, setDisplayName] = useState(user?.display_name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const roleConfig = user?.role ? ROLE_CONFIG[user.role] : null;
  const RoleIcon = roleConfig?.icon ?? UserCircle;

  function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    updateProfile.mutate({ display_name: displayName.trim(), email: email.trim() });
  }

  function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      return;
    }
    changePassword.mutate(
      { current_password: currentPassword, new_password: newPassword },
      {
        onSuccess: () => {
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
        },
      },
    );
  }

  return (
    <div className="space-y-6">
      {/* Role badge + account info */}
      <div className="card p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-text-primary">Account</h3>
            <p className="mt-1 text-xs text-text-secondary">
              Your role and account information
            </p>
          </div>
          {roleConfig && (
            <span
              className={clsx(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold",
                roleConfig.color,
              )}
            >
              <RoleIcon className="h-3 w-3" />
              {roleConfig.label}
            </span>
          )}
        </div>
        {user?.organization && (
          <p className="mt-3 text-xs text-text-tertiary">
            Organization: {user.organization.name}
          </p>
        )}
      </div>

      {/* Profile card */}
      <div className="card p-5">
        <h3 className="text-sm font-medium text-text-primary">Profile</h3>
        <p className="mt-1 text-xs text-text-secondary">
          Update your display name and email address
        </p>
        <form onSubmit={handleProfileSave} className="mt-4 space-y-4">
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
              placeholder="Your name"
            />
          </div>
          <div>
            <label
              htmlFor="profileEmail"
              className="mb-1.5 block text-xs font-medium text-text-secondary"
            >
              Email
            </label>
            <input
              id="profileEmail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="you@example.com"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={updateProfile.isPending}
              className="btn-primary"
            >
              {updateProfile.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Save
            </button>
          </div>
        </form>
      </div>

      {/* Change Password card */}
      <div className="card p-5">
        <h3 className="text-sm font-medium text-text-primary">Change Password</h3>
        <p className="mt-1 text-xs text-text-secondary">
          Update your account password
        </p>
        <form onSubmit={handlePasswordChange} className="mt-4 space-y-4">
          {passwordError && (
            <div className="rounded-lg border border-risk-critical-border bg-risk-critical-bg px-3 py-2">
              <p className="text-xs text-risk-critical">{passwordError}</p>
            </div>
          )}
          <div>
            <label
              htmlFor="currentPassword"
              className="mb-1.5 block text-xs font-medium text-text-secondary"
            >
              Current Password
            </label>
            <input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="input"
              placeholder={"\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"}
              required
            />
          </div>
          <div>
            <label
              htmlFor="newPassword"
              className="mb-1.5 block text-xs font-medium text-text-secondary"
            >
              New Password
            </label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="input"
              placeholder={"\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"}
              required
            />
          </div>
          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-1.5 block text-xs font-medium text-text-secondary"
            >
              Confirm New Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input"
              placeholder={"\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"}
              required
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={changePassword.isPending}
              className="btn-primary"
            >
              {changePassword.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Change Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
