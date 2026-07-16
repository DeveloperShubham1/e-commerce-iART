import axios from "axios";

const http = axios.create({
  // baseURL: import.meta.env.VITE_BACKEND_URL,
  baseURL: import.meta.env.VITE_BACKEND_LOCAL_URL,
  withCredentials: true,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

// Attach token dynamically before every request
http.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export default http;
