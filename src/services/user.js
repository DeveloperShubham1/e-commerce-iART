import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
// Import from api.js
import {
    updateProfile
} from "../api";
import { toast } from "react-toastify";


export const useUpdateProfile = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateProfile,

        onSuccess: (data) => {
            toast.success(data.message);

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