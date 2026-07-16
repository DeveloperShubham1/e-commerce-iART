import http from "../baseUrl";

/**
 * Unwrap axios response and surface backend error message.
 */
const unwrap = (res) => res?.data;

const handleError = (error) => {
  const message =
    error?.response?.data?.message ||
    error?.message ||
    "Something went wrong. Please try again.";
  return Promise.reject(new Error(message));
};

// ============================= AUTH =============================
export const loginApi = async (payload) => {
  try {
    const res = await http.post("/api/superadmin/login", payload);
    return unwrap(res);
  } catch (error) {
    return handleError(error);
  }
};

export const getProfileApi = async () => {
  try {
    const res = await http.get("/api/superadmin/profile");
    return unwrap(res);
  } catch (error) {
    return handleError(error);
  }
};

export const updateProfileApi = async (payload) => {
  try {
    const res = await http.put("/api/superadmin/profile", payload);
    return unwrap(res);
  } catch (error) {
    return handleError(error);
  }
};

export const getDashboardApi = async () => {
  try {
    const res = await http.get("/api/superadmin/dashboard");
    return unwrap(res);
  } catch (error) {
    return handleError(error);
  }
};