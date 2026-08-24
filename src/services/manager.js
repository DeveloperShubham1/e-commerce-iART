import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createManager, fetchManagers, updateManager } from "../api";

export const MANAGERS_QUERY_KEY = ["managers"];

export const useManagers = () => {
  return useQuery({
    queryKey: MANAGERS_QUERY_KEY,
    queryFn: fetchManagers,
    select: (data) => data.data,
  });
};

export const useCreateManager = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createManager,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MANAGERS_QUERY_KEY });
    },
  });
};

export const useUpdateManager = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateManager,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MANAGERS_QUERY_KEY });
    },
  });
};