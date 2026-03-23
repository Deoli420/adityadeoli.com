import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getInvites, createInvite, revokeInvite } from "@/services/userService.ts";
import toast from "react-hot-toast";
import { extractApiError } from "@/utils/extractApiError.ts";

export function useInvites() {
  return useQuery({ queryKey: ["invites"], queryFn: getInvites });
}

export function useCreateInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createInvite,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["invites"] }); },
    onError: (err) => toast.error(extractApiError(err, "Failed to create invite")),
  });
}

export function useRevokeInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: revokeInvite,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["invites"] }); toast.success("Invite revoked"); },
    onError: (err) => toast.error(extractApiError(err, "Failed to revoke invite")),
  });
}
