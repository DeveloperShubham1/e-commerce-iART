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
  per_page = 10,
  search = "",
} = {}) => {
  try {
    const res = await http.get("/api/superadmin/merchants", {
      params: {
        page,
        per_page,
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

export const updateMerchantApi = async (id, payload) => {
  try {
    const res = await http.put(`/api/superadmin/merchants/${id}`, payload);
    return unwrap(res);
  } catch (error) {
    return handleError(error);
  }
};

// ============================= SALES SUMMARY =============================
export const getSalesSummaryApi = async () => {
  try {
    const res = await http.get("/api/superadmin/sales/summary");
    return unwrap(res);
  } catch (error) {
    return handleError(error);
  }
};

// ============================= ORDERS =============================
export const getOrdersListApi = async ({
  page = 1,
  per_page = 10,
  search = "",
  status,
  merchantId,
} = {}) => {
  try {
    const res = await http.get("/api/superadmin/orders", {
      params: {
        page,
        per_page,
        search,
        status,
        merchantId,
      },
    });
    return unwrap(res);
  } catch (error) {
    return handleError(error);
  }
};

// ============================= CUSTOMERS =============================
export const getCustomersListApi = async ({
  page = 1,
  per_page = 10,
  search = "",
  includeGuests = true,
  merchantId
} = {}) => {
  try {
    const res = await http.get("/api/superadmin/customers", {
      params: {
        page,
        per_page,
        search,
        includeGuests: includeGuests ? "true" : "false",
        merchantId
      },
    });
    return unwrap(res);
  } catch (error) {
    return handleError(error);
  }
};

export const getMerchantDetailApi = async (id) => {
  try {
    const res = await http.get(`/api/superadmin/merchants/${id}`);
    return unwrap(res);
  } catch (error) {
    return handleError(error);
  }
};

export const getMerchantsRevenueApi = async ({ top = 10 } = {}) => {
  try {
    const res = await http.get(`/api/superadmin/merchants/revenue/top`, {
      params: { top },
    });
    return unwrap(res);
  } catch (error) {
    return handleError(error);
  }
};

export const getCustomerDetailApi = async (id) => {
  try {
    const res = await http.get(`/api/superadmin/customers/${id}`);
    return unwrap(res);
  } catch (error) {
    return handleError(error);
  }
};

export const toggleMerchantSubscriptionApi = async (id) => {
  try {
    const res = await http.patch(`/api/superadmin/merchants/${id}/toggle-subscription`);
    return unwrap(res);
  } catch (error) {
    return handleError(error);
  }
};
