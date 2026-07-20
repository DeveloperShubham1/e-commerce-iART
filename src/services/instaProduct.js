import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Import from api.js
import {
    createInstagramProduct,
    getInstagramProducts,
    getInstagramProduct,
    deleteInstagramProduct,
    getInstagramPosts
} from "../api";
import { useEffect } from "react";
import { toast } from "react-toastify";


// Create Mapping
export const useCreateInstagramProduct = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createInstagramProduct,

        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["instagram-products"],
            });
        },
    });
};

// Get All Products
export const useInstagramProducts = (page = 1, limit = 10) => {
    return useQuery({
        queryKey: ["instagram-products", page, limit],
        queryFn: () => getInstagramProducts(page, limit),
        keepPreviousData: true,
        refetchInterval: 5 * 60 * 1000,
    });
};

// Get Single Product
export const useInstagramProduct = (mediaId) => {
    return useQuery({
        queryKey: ["instagram-product", mediaId],
        queryFn: () => getInstagramProduct(mediaId),
        enabled: !!mediaId,
        refetchInterval: 5 * 60 * 1000,
    });
};

// Delete Instagram Product
export const useDeleteInstagramProduct = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteInstagramProduct,

        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["instagram-products"],
            });
        },
    });
};

export const useInstagramPosts = () => {
    const query = useQuery({
        queryKey: ["instagram-posts"],
        queryFn: getInstagramPosts,
        refetchInterval: 5 * 60 * 1000,
    });

    useEffect(() => {
        if (query.isSuccess) {
            console.log("Data: ", query.data);
            toast.success(query.data?.message);
        }
    }, [query.isSuccess, query.data]);

    useEffect(() => {
        if (query.isError) {
            console.log("Error: ", query.error);
            toast.error(
                query.error?.response?.data?.message ||
                "Failed to load Instagram posts."
            );
        }
    }, [query.isError, query.error]);

    return query;
};