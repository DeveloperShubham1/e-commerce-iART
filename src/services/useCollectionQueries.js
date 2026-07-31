import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getCollections,
  getCollectionById,
  createCollection,
  updateCollection,
  deleteCollection,
  addProductsToCollection,
  removeProductFromCollection,
  getProductsForCollection,
} from "../api";

export const useCollections = (page, limit) =>
  useQuery({
    queryKey: ["collections", page, limit],
    queryFn: () => getCollections({ page, limit }),
    keepPreviousData: true,
  });

export const useCollection = (id) =>
  useQuery({
    queryKey: ["collection", id],
    queryFn: () => getCollectionById(id),
    enabled: !!id,
  });

export const useProductsForCollection = () =>
  useQuery({
    queryKey: ["collection-products"],
    queryFn: getProductsForCollection,
  });

export const useCreateCollection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCollection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
    },
  });
};

export const useUpdateCollection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateCollection,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      queryClient.invalidateQueries({ queryKey: ["collection", variables.id] });
    },
  });
};

export const useDeleteCollection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCollection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
    },
  });
};

export const useAddProductsToCollection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addProductsToCollection,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["collection", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["collections"] });
    },
  });
};

export const useRemoveProductFromCollection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeProductFromCollection,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["collection", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["collections"] });
    },
  });
};
