import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createRole, fetchRoles, updateRole } from "../api";

export const ROLES_QUERY_KEY = ["roles"];

export const useRoles = () => {
  return useQuery({
    queryKey: ROLES_QUERY_KEY,
    queryFn: fetchRoles,
    select: (data) => data.data,
  });
};

export const useCreateRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ROLES_QUERY_KEY });
    },
  });
};

export const useUpdateRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ROLES_QUERY_KEY });
    },
  });
};