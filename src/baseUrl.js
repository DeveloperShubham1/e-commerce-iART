import axios from "axios";
import { toast } from "react-toastify";

const http = axios.create({
  // baseURL: import.meta.env.VITE_BACKEND_URL,
  baseURL: import.meta.env.VITE_BACKEND_LOCAL_URL,
  withCredentials: true,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

// Automatically logout when token expires
http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear local storage
      localStorage.removeItem("superAdmin");

      // If you still store JWT in localStorage
      localStorage.removeItem("token");

      // Show toast
      toast.error("Your session has expired. Please login again.");

      // Redirect after toast is visible
      setTimeout(() => {
        window.location.replace("/login");
      }, 2000);
    }

    return Promise.reject(error);
  }
);

export default http;