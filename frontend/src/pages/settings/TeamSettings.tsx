import { useState } from "react";
import { Crown, Plus, Trash2, Loader2, Clock, Mail } from "lucide-react";
import { useUsers, useChangeRole, useRemoveUser } from "@/hooks/useUsers.ts";
import { useInvites, useRevokeInvite } from "@/hooks/useInvites.ts";
import { useAuthStore } from "@/stores/authStore.ts";
import { useIsOwner } from "@/hooks/useAuth.ts";
import { InviteModal } from "@/components/settings/InviteModal.tsx";
import clsx from "clsx";

const ROLE_OPTIONS = ["OWNER", "ADMIN", "MEMBER", "VIEWER"] as const;

const ROLE_COLORS: Record<string, string> = {
  OWNER: "text-amber-400",
  ADMIN: "text-blue-400",
  MEMBER: "text-emerald-400",
  VIEWER: "text-slate-400",
};

export function TeamSettings() {
  const { data: users, isLoading } = useUsers();
  const { data: invites } = useInvites();
  const changeRole = useChangeRole();
  const removeUser = useRemoveUser();
  const revokeInvite = useRevokeInvite();
  const currentUser = useAuthStore((s) => s.user);
  const isOwner = useIsOwner();
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

  function handleRoleChange(userId: string, role: string) {
    changeRole.mutate({ userId, role });
  }

  function handleRemove(userId: string) {
    removeUser.mutate(userId, { onSuccess: () => setConfirmRemoveId(null) });
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-text-primary">Team Members</h3>
          <p className="mt-1 text-xs text-text-secondary">
            Manage who has access to your organization
          </p>
        </div>
        <button
          onClick={() => setInviteModalOpen(true)}
          className="btn-primary"
        >
          <Plus className="h-3.5 w-3.5" />
          Invite Member
        </button>
      </div>

      {/* Members table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] font-medium uppercase tracking-wider text-text-tertiary">
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Joined</th>
                <th className="px-5 py-3 w-20">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5} className="px-5 py-4">
                      <div className="h-4 w-2/3 rounded bg-surface-tertiary animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : (
                (users ?? []).map((member: any) => {
                  const isSelf = member.id === currentUser?.id;
                  const isOwnerRow = member.role === "OWNER";

                  return (
                    <tr key={member.id} className="transition-colors hover:bg-surface-secondary/50">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-text-primary">
                            {member.display_name || member.email}
                          </span>
                          {isSelf && (
                            <span className="rounded-full bg-accent/10 px-1.5 py-0.5 text-[10px] font-medium text-accent">
                              You
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-text-secondary">
                        {member.email}
                      </td>
                      <td className="px-5 py-3.5">
                        {isOwnerRow ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                            <Crown className="h-3 w-3" />
                            Owner
                          </span>
                        ) : isOwner && !isSelf ? (
                          <select
                            value={member.role}
                            onChange={(e) => handleRoleChange(member.id, e.target.value)}
                            className="input h-7 w-28 py-0 text-xs"
                            disabled={changeRole.isPending}
                          >
                            {ROLE_OPTIONS.filter((r) => r !== "OWNER").map((r) => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className={clsx("text-xs font-medium", ROLE_COLORS[member.role] ?? "text-text-secondary")}>
                            {member.role}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-text-secondary">
                        {member.created_at ? formatDate(member.created_at) : "\u2014"}
                      </td>
                      <td className="px-5 py-3.5">
                        {!isOwnerRow && !isSelf && isOwner && (
                          <>
                            {confirmRemoveId === member.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleRemove(member.id)}
                                  disabled={removeUser.isPending}
                                  className="rounded-md px-2 py-1 text-[11px] font-medium text-risk-critical bg-risk-critical-bg border border-risk-critical-border hover:bg-risk-critical/20 transition-colors"
                                >
                                  {removeUser.isPending ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    "Confirm"
                                  )}
                                </button>
                                <button
                                  onClick={() => setConfirmRemoveId(null)}
                                  className="rounded-md px-2 py-1 text-[11px] font-medium text-text-secondary hover:bg-surface-tertiary transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setConfirmRemoveId(member.id)}
                                className="rounded-md p-1.5 text-text-tertiary hover:bg-risk-critical-bg hover:text-risk-critical transition-colors"
                                title="Remove member"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pending Invites */}
      {invites && invites.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-text-primary">Pending Invites</h3>
          <div className="card divide-y divide-border-subtle">
            {invites.map((invite: any) => (
              <div
                key={invite.id}
                className="flex items-center justify-between px-5 py-3.5"
              >
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-text-tertiary" />
                  <div>
                    <p className="text-sm text-text-primary">{invite.email}</p>
                    <div className="mt-0.5 flex items-center gap-2 text-[11px] text-text-tertiary">
                      <span className={clsx("font-medium", ROLE_COLORS[invite.role] ?? "text-text-secondary")}>
                        {invite.role}
                      </span>
                      {invite.expires_at && (
                        <>
                          <span>|</span>
                          <Clock className="h-3 w-3" />
                          <span>Expires {formatDate(invite.expires_at)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => revokeInvite.mutate(invite.id)}
                  disabled={revokeInvite.isPending}
                  className="rounded-md px-2.5 py-1 text-[11px] font-medium text-text-secondary border border-border hover:bg-surface-tertiary transition-colors"
                >
                  Revoke
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <InviteModal open={inviteModalOpen} onClose={() => setInviteModalOpen(false)} />
    </div>
  );
}
