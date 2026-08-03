import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
// Import from api.js
import {
    updateProfile,
    getPaymentConfigForUser,
    getProductById,
    getProductsByCategory,
    getProducts,
    getUserOrders,
    getDashboardData
} from "../api";
import { toast } from "react-toastify";


export const useUpdateProfile = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateProfile,

        onSuccess: (data) => {

            queryClient.invalidateQueries({
                queryKey: ["profile"],
            });

        },

        onError: (err) => {
            toast.error(
                err?.response?.data?.message || "Something went wrong"
            );
        },
    });
};

export const usePaymentConfigForUser = (merchantId) => {
    return useQuery({
        queryKey: ["payment-config", merchantId],
        queryFn: () => getPaymentConfigForUser(merchantId),
    });
};

// Get a single product
export const useProductById = (id) => {
    return useQuery({
        queryKey: ["product", id],
        queryFn: () => getProductById(id),
        enabled: !!id,
    });
};

// Get products by category
export const useProductsByCategory = (categoryId, productId) => {
    return useQuery({
        queryKey: ["products-by-category", categoryId],
        queryFn: () => getProductsByCategory(categoryId, productId),
        enabled: !!categoryId && !!productId,
    });
};

export const useUserOrders = (page = 1, limit = 10) => {
    return useQuery({
        queryKey: ["user-orders", page, limit],
        queryFn: () => getUserOrders({ page, limit }),
        gcTime: 0,
        staleTime: 0,
        refetchOnMount: "always",
    });
};

export const useDashboardData = () => {
    return useQuery({
        queryKey: ["dashboard-data"],
        queryFn: getDashboardData,
    });
};


