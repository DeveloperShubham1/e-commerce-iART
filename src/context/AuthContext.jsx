import { createContext, useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { loginApi, getProfileApi, updateProfileApi } from "../api/auth.api";

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

const TOKEN_KEY = "token";
const USER_KEY = "superAdmin";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      const storedUser = localStorage.getItem(USER_KEY);
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (err) {
      // corrupted storage — don't crash, just start logged out
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  const persistSession = (newToken, admin) => {
    try {
      localStorage.setItem(TOKEN_KEY, newToken);
      localStorage.setItem(USER_KEY, JSON.stringify(admin));
    } catch (err) {
      // storage write failed (quota, private mode) — session still
      // works in-memory for this tab, just won't survive a refresh
      console.error("Failed to persist session:", err);
    }
    setToken(newToken);
    setUser(admin);
  };

  const clearSession = () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch (err) {
      console.error("Failed to clear stored session:", err);
    }
    setToken(null);
    setUser(null);
  };

  const login = async (credentials) => {
    try {
      const data = await loginApi(credentials);
      persistSession(data.token, data.admin);
      toast.success(data.message || "Login successful");
      return data;
    } catch (err) {
      toast.error(err?.message || "Login failed");
      throw err; // let the login form know it failed too, e.g. to stop a spinner
    }
  };

  const logout = () => {
    clearSession();
    toast.info("You have been logged out");
  };

  const refreshProfile = async () => {
    try {
      const data = await getProfileApi();
      const admin = data.superAdmin;
      localStorage.setItem(USER_KEY, JSON.stringify(admin));
      setUser(admin);
      return admin;
    } catch (err) {
      // token likely expired or invalid — don't leave stale auth state around
      if (err?.status === 401 || err?.response?.status === 401) {
        clearSession();
      }
      toast.error(err?.message || "Failed to load profile");
      throw err;
    }
  };

  const updateProfile = async (payload) => {
    try {
      const data = await updateProfileApi(payload);
      localStorage.setItem(USER_KEY, JSON.stringify(data.superAdmin));
      setUser(data.superAdmin);
      toast.success(data.message || "Profile updated");
      return data;
    } catch (err) {
      toast.error(err?.message || "Failed to update profile");
      throw err;
    }
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: Boolean(token),
    login,
    logout,
    refreshProfile,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;