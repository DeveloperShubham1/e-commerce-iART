import http from "../baseUrl";

const unwrap = (res) => res?.data;

const handleError = (error) => {
  const message =
    error?.response?.data?.message ||
    error?.message ||
    "Something went wrong. Please try again.";
  return Promise.reject(new Error(message));
};

// ============================= MERCHANTS =============================
export const getMerchantListApi = async ({
  page = 1,
  limit = 10,
  search = "",
} = {}) => {
  try {
    const res = await http.get("/api/superadmin/merchants", {
      params: {
        page,
        limit,
        search,
      },
    });

    return unwrap(res);
  } catch (error) {
    return handleError(error);
  }
};

export const createMerchantApi = async (payload) => {
  try {
    const res = await http.post("/api/superadmin/merchants", payload);
    return unwrap(res);
  } catch (error) {
    return handleError(error);
  }
};

export const updateMerchantApi = async (merchantId, payload) => {
  try {
    const res = await http.put(
      `/api/superadmin/merchants/${merchantId}`,
      payload,
    );
    return unwrap(res);
  } catch (error) {
    return handleError(error);
  }
};
