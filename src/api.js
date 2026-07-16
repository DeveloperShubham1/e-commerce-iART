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
    const { data } = await axios.get("/api/ig/posts");
    return data;
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
    const { data } = await axios.put("/api/user/update-profile", payload);
    return data;
};

export const connectInstagramSDK = async ({ accessToken, userID }) => {
    const { data } = await axios.put(`/api/merchant/instagram/connect-sdk`,
        { accessToken, userID }
    );
    return data;
};