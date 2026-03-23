import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getInvites, createInvite, revokeInvite } from "@/services/userService.ts";
import toast from "react-hot-toast";

export function useInvites() {
  return useQuery({ queryKey: ["invites"], queryFn: getInvites });
}

export function useCreateInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createInvite,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["invites"] }); },
    onError: () => toast.error("Failed to create invite"),
  });
}

export function useRevokeInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: revokeInvite,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["invites"] }); toast.success("Invite revoked"); },
    onError: () => toast.error("Failed to revoke invite"),
  });
}
