import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUsers, updateProfile, changePassword, changeUserRole, removeUser } from "@/services/userService.ts";
import toast from "react-hot-toast";
import { extractApiError } from "@/utils/extractApiError.ts";

export function useUsers() {
  return useQuery({ queryKey: ["users"], queryFn: getUsers });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateProfile,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["users"] }); toast.success("Profile updated"); },
    onError: (err) => toast.error(extractApiError(err, "Failed to update profile")),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: changePassword,
    onSuccess: () => toast.success("Password changed"),
    onError: (err) => toast.error(extractApiError(err, "Failed to change password")),
  });
}

export function useChangeRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) => changeUserRole(userId, role),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["users"] }); toast.success("Role updated"); },
    onError: (err) => toast.error(extractApiError(err, "Failed to update role")),
  });
}

export function useRemoveUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: removeUser,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["users"] }); toast.success("Member removed"); },
    onError: (err) => toast.error(extractApiError(err, "Failed to remove member")),
  });
}
