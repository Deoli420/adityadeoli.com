import { useState, useEffect } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getOrganization, updateOrganization, transferOwnership } from "@/services/userService.ts";
import { useUsers } from "@/hooks/useUsers.ts";
import { useIsOwner } from "@/hooks/useAuth.ts";
import { useAuthStore } from "@/stores/authStore.ts";
import toast from "react-hot-toast";

export function OrgSettings() {
  const qc = useQueryClient();
  const isOwner = useIsOwner();
  const currentUser = useAuthStore((s) => s.user);
  const { data: org, isLoading } = useQuery({ queryKey: ["organization"], queryFn: getOrganization });
  const { data: users } = useUsers();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [transferUserId, setTransferUserId] = useState("");
  const [showTransferConfirm, setShowTransferConfirm] = useState(false);

  useEffect(() => {
    if (org) {
      setName(org.name ?? "");
      setSlug(org.slug ?? "");
    }
  }, [org]);

  const updateOrg = useMutation({
    mutationFn: () => updateOrganization({ name: name.trim(), slug: slug.trim() }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["organization"] }); toast.success("Organization updated"); },
    onError: () => toast.error("Failed to update organization"),
  });

  const transfer = useMutation({
    mutationFn: () => transferOwnership(transferUserId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["organization"] });
      qc.invalidateQueries({ queryKey: ["users"] });
      toast.success("Ownership transferred");
      setShowTransferConfirm(false);
      setTransferUserId("");
    },
    onError: () => toast.error("Failed to transfer ownership"),
  });

  function handleOrgSave(e: React.FormEvent) {
    e.preventDefault();
    updateOrg.mutate();
  }

  const memberCount = users?.length ?? 0;
  const otherMembers = (users ?? []).filter(
    (u: any) => u.id !== currentUser?.id && u.role !== "OWNER",
  );

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-text-tertiary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Org details card */}
      <div className="card p-5">
        <h3 className="text-sm font-medium text-text-primary">Organization</h3>
        <p className="mt-1 text-xs text-text-secondary">
          Manage your organization details
        </p>
        <form onSubmit={handleOrgSave} className="mt-4 space-y-4">
          <div>
            <label
              htmlFor="orgName"
              className="mb-1.5 block text-xs font-medium text-text-secondary"
            >
              Name
            </label>
            <input
              id="orgName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              placeholder="Organization name"
            />
          </div>
          <div>
            <label
              htmlFor="orgSlug"
              className="mb-1.5 block text-xs font-medium text-text-secondary"
            >
              Slug
            </label>
            <input
              id="orgSlug"
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="input"
              placeholder="organization-slug"
            />
          </div>

          {/* Read-only info */}
          <div className="flex gap-6 text-xs text-text-tertiary pt-2">
            <span>Members: {memberCount}</span>
            {org?.created_at && <span>Created: {formatDate(org.created_at)}</span>}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={updateOrg.isPending}
              className="btn-primary"
            >
              {updateOrg.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Save
            </button>
          </div>
        </form>
      </div>

      {/* Danger zone — OWNER only */}
      {isOwner && (
        <div className="card border-risk-critical-border p-5">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="h-4 w-4 text-risk-critical" />
            <h3 className="text-sm font-medium text-risk-critical">Danger Zone</h3>
          </div>
          <p className="text-xs text-text-secondary mb-4">
            Transfer organization ownership to another member. This action cannot be undone.
          </p>

          <div className="space-y-3">
            <div>
              <label
                htmlFor="transferUser"
                className="mb-1.5 block text-xs font-medium text-text-secondary"
              >
                Transfer Ownership To
              </label>
              <select
                id="transferUser"
                value={transferUserId}
                onChange={(e) => setTransferUserId(e.target.value)}
                className="input"
              >
                <option value="">Select a member...</option>
                {otherMembers.map((u: any) => (
                  <option key={u.id} value={u.id}>
                    {u.display_name || u.email} ({u.role})
                  </option>
                ))}
              </select>
            </div>

            {showTransferConfirm ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => transfer.mutate()}
                  disabled={transfer.isPending || !transferUserId}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-white bg-risk-critical hover:bg-risk-critical/80 transition-colors disabled:opacity-50"
                >
                  {transfer.isPending && <Loader2 className="inline h-3 w-3 animate-spin mr-1" />}
                  Confirm Transfer
                </button>
                <button
                  onClick={() => setShowTransferConfirm(false)}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-surface-tertiary transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowTransferConfirm(true)}
                disabled={!transferUserId}
                className="rounded-lg border border-risk-critical-border px-3 py-1.5 text-xs font-medium text-risk-critical hover:bg-risk-critical-bg transition-colors disabled:opacity-50"
              >
                Transfer Ownership
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
