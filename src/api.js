import axios from "axios";

axios.defaults.withCredentials = true;
axios.defaults.baseURL = import.meta.env.VITE_BACKEND_URL;


// Create Instagram Product Mapping
export const createInstagramProduct = async (payload) => {
    const { data } = await axios.post("/api/mappings", payload, {
        headers: {
            "Content-Type": "application/json",
        },
    });

    return data;
};

// Get All Instagram Product Mappings
export const getInstagramProducts = async (page = 1, limit = 10) => {
    const { data } = await axios.get("/api/instagram-products", {
        params: {
            page,
            limit,
        },
    });

    return data;
};

// Get Single Instagram Product Mapping
export const getInstagramProduct = async (mediaId) => {
    const { data } = await axios.get(`/api/instagram-products/${mediaId}`);

    return data;
};


// Delete Instagram Product Mapping
export const deleteInstagramProduct = async (mediaId) => {
    const { data } = await axios.delete(`/api/mappings/${mediaId}`);

    return data;
};


export const getInstagramPosts = async () => {
    try {
        const { data } = await axios.get("/api/ig/posts");
        return data;
    } catch (err) {
        throw err;
    }
};

// Get Product List
export const getProductList = async ({
    search = "",
    page = 1,
    limit = 10,
    isActive,
    categoryId,
    subcategoryId,
    size,
} = {}) => {
    const { data } = await axios.get("/api/products/list", {
        params: {
            search,
            page,
            limit,
            isActive,
            categoryId,
            subcategoryId,
            size,
        },
    });

    return data;
};

export const getInstagramConfig = async () => {
    const { data } = await axios.get("/api/merchant/instagram");
    return data;
};

export const updateInstagramConfig = async (payload) => {
    const { data } = await axios.put("/api/merchant/instagram", payload);
    return data;
};

export const verifyInstagramToken = async () => {
    const { data } = await axios.post("/api/merchant/instagram/verify-token");
    return data;
};

export const exchangeInstagramToken = async (token) => {
    const { data } = await axios.get("/api/user/ig-exchange", {
        params: { token },
        withCredentials: true,
    });
    return data;
};

export const syncInstagramComments = async (mediaId) => {
    const { data } = await axios.post(`/api/posts/${mediaId}/sync-comments`);
    return data;
};

export const syncInstagramAllComments = async () => {
    const { data } = await axios.post(`/api/posts/sync-comments`);
    return data;
};

export const updateProfile = async (payload) => {
    const { data } = await axios.patch("/api/user/profile", payload);
    return data;
};

export const connectInstagramSDK = async ({ accessToken, userID }) => {
    const { data } = await axios.put(`/api/merchant/instagram/connect-sdk`,
        { accessToken, userID }
    );
    return data;
};

export const updatePaymentConfig = async (formData) => {
    const { data } = await axios.put("/api/merchant/payment-config", formData, {
        headers: {
            "Content-Type": "application/json",
        },
    });

    return data;
};

export const uploadToS3 = async (formData) => {
    const { data } = await axios.post("/api/s3/upload", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });

    return data;
};

export const getPaymentConfig = async () => {
    const { data } = await axios.get("/api/merchant/payment-config");
    return data;
};

export const getPaymentConfigForUser = async (merchantId) => {
    const { data } = await axios.get(`/api/user/payment-config?merchantId=${merchantId}`);
    return data;
};

export const getProductById = async (id) => {
    const { data } = await axios.get(`/api/products?id=${id}`);
    return data;
};

export const getProductsByCategory = async (categoryId, productId) => {
    const { data } = await axios.get(
        `/api/categories/by-category?categoryId=${categoryId}&productId=${productId}`
    );
    return data;
};

export const getProducts = async ({
    merchantId,
    search = "",
    page = 1,
    limit = 10,
    categoryId,
    subcategoryId,
    size,
}) => {
    const { data } = await axios.get("/api/user/product/list", {
        params: {
            merchantId,
            search,
            page,
            limit,
            categoryId,
            subcategoryId,
            size,
        },
    });

    return data;
};

export const getUserOrders = async ({ page = 1, limit = 10 }) => {
    const { data } = await axios.get("/api/user/orders", {
        params: {
            page,
            limit,
        },
    });

    return data;
};

const BASE = "/api/collection";

export const getCollections = async ({
    page = 1,
    limit = 10,
}) => {
    const { data } = await axios.get(BASE, {
        params: {
            page,
            limit,
        },
    });

    return data;
};

export const getCollectionById = async (id) => {
    const { data } = await axios.get(`${BASE}/${id}`);
    return data;
};

export const createCollection = async (payload) => {
    const { data } = await axios.post(BASE, payload);
    return data;
};

export const updateCollection = async ({ id, ...payload }) => {
    const { data } = await axios.put(`${BASE}/${id}`, payload);
    return data;
};

export const deleteCollection = async (id) => {
    const { data } = await axios.delete(`${BASE}/${id}`);
    return data;
};

export const addProductsToCollection = async ({ id, productIds }) => {
    const { data } = await axios.post(`${BASE}/${id}/products`, { productIds });
    return data;
};

export const removeProductFromCollection = async ({ id, productId }) => {
    const { data } = await axios.delete(`${BASE}/${id}/products/${productId}`);
    return data;
};

export const getProductsForCollection = async () => {
    const { data } = await axios.get(`${BASE}/products/all`);
    return data;
};


