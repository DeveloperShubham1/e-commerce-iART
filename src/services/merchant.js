
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { getInstagramConfig, updateInstagramConfig, verifyInstagramToken } from "../api";


export const useInstagramConfig = () =>
    useQuery({
        queryKey: ["instagram-config"],
        queryFn: getInstagramConfig,
    });

export const useUpdateInstagramConfig = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateInstagramConfig,
        onSuccess: (data) => {
            toast.success(data.message);
            queryClient.invalidateQueries({
                queryKey: ["instagram-config"],
            });
        },
        onError: (err) => {
            toast.error(err?.response?.data?.message || "Something went wrong");
        },
    });
};


export const useVerifyInstagramToken = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: verifyInstagramToken,

        onSuccess: (data) => {
            toast.success(data.message);
            queryClient.invalidateQueries({
                queryKey: ["instagram-config"],
            });
        },
        onError: (err) => {
            toast.error(err?.response?.data?.message || "Something went wrong");
        },
    });
};