import { useState } from "react";
import { X, Copy, Check, Loader2, Mail } from "lucide-react";
import { useCreateInvite } from "@/hooks/useInvites.ts";

interface InviteModalProps {
  open: boolean;
  onClose: () => void;
}

export function InviteModal({ open, onClose }: InviteModalProps) {
  const createInvite = useCreateInvite();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("MEMBER");
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    createInvite.mutate(
      { email: email.trim(), role },
      {
        onSuccess: (data: any) => {
          const token = data.token ?? data.id;
          const link = `${window.location.origin}/join/${token}`;
          setInviteLink(link);
        },
      },
    );
  }

  function handleCopy() {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleClose() {
    setEmail("");
    setRole("MEMBER");
    setInviteLink(null);
    setCopied(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-text-primary">Invite Member</h3>
          <button
            onClick={handleClose}
            className="rounded-md p-1 text-text-tertiary hover:bg-surface-tertiary hover:text-text-secondary transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {inviteLink ? (
          <div className="space-y-4">
            <p className="text-xs text-text-secondary">
              Invite created! Share this link with the new member:
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={inviteLink}
                className="input flex-1 text-xs"
              />
              <button
                onClick={handleCopy}
                className="btn-primary shrink-0"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleClose}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-surface-tertiary transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="inviteEmail"
                className="mb-1.5 block text-xs font-medium text-text-secondary"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary" />
                <input
                  id="inviteEmail"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-9"
                  placeholder="teammate@company.com"
                  required
                  autoFocus
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="inviteRole"
                className="mb-1.5 block text-xs font-medium text-text-secondary"
              >
                Role
              </label>
              <select
                id="inviteRole"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="input"
              >
                <option value="ADMIN">Admin</option>
                <option value="MEMBER">Member</option>
                <option value="VIEWER">Viewer</option>
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-surface-tertiary transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createInvite.isPending}
                className="btn-primary"
              >
                {createInvite.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Send Invite
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
