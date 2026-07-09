import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
// Import from api.js
import {
    getProductList
} from "../api";


export const useProductList = ({
    search = "",
    page = 1,
    limit = 10,
    isActive,
    categoryId,
    subcategoryId,
    size,
} = {}) => {
    return useQuery({
        queryKey: [
            "products",
            search,
            page,
            limit,
            isActive,
            categoryId,
            subcategoryId,
            size,
        ],
        queryFn: () =>
            getProductList({
                search,
                page,
                limit,
                isActive,
                categoryId,
                subcategoryId,
                size,
            }),
        keepPreviousData: true,
    });
};