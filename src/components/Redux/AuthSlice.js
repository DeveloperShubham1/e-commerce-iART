// Components/Redux/AuthSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { toast } from "react-toastify";
import { loginApi, getProfileApi, updateProfileApi, getDashboardApi } from "../../api/auth.api";

const TOKEN_KEY = "token";
const USER_KEY = "superAdmin";

// ----------------------- localStorage helpers -----------------------
// Same try/catch-and-continue behavior as the original context: storage
// failures (quota, private browsing) should never crash the app, the
// session just won't survive a refresh.

const persistSession = (token, user) => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (err) {
    console.error("Failed to persist session:", err);
  }
};

const persistUser = (user) => {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (err) {
    console.error("Failed to persist user:", err);
  }
};

const clearStoredSession = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch (err) {
    console.error("Failed to clear stored session:", err);
  }
};

// Runs once at module load (store creation) — replaces the old
// useEffect-on-mount hydration step. No loading flag needed for this part
// since it's synchronous.
const loadStoredAuth = () => {
  try {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY);
    if (storedToken && storedUser) {
      return { token: storedToken, user: JSON.parse(storedUser) };
    }
  } catch (err) {
    // corrupted storage — don't crash, just start logged out
    clearStoredSession();
  }
  return { token: null, user: null };
};

const { token: storedToken, user: storedUser } = loadStoredAuth();

// ----------------------------- thunks -----------------------------
// auth.api.js already unwraps axios responses and rethrows a plain
// Error(message) on failure, so these just forward err.message.

export const login = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const data = await loginApi(credentials); // { token, admin, message }
      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

export const refreshProfile = createAsyncThunk(
  "auth/refreshProfile",
  async (_, { rejectWithValue }) => {
    try {
      const data = await getProfileApi(); // { superAdmin }
      return data;
    } catch (err) {
      // NOTE: to auto-logout on an expired/invalid token like the old
      // context did, auth.api.js's handleError needs to attach the status
      // to the thrown Error, e.g.:
      //   const e = new Error(message);
      //   e.status = error?.response?.status;
      //   return Promise.reject(e);
      // Then here: rejectWithValue({ message: err.message, status: err.status })
      return rejectWithValue(err.message);
    }
  },
);

export const updateProfile = createAsyncThunk(
  "auth/updateProfile",
  async (payload, { rejectWithValue }) => {
    try {
      const data = await updateProfileApi(payload); // { superAdmin, message }
      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

export const getDashboard = createAsyncThunk(
  "auth/getDashboard",
  async (_, { rejectWithValue }) => {
    try {
      const data = await getDashboardApi(); // { superAdmin }
      return data;
    } catch (err) {
      // NOTE: to auto-logout on an expired/invalid token like the old
      // context did, auth.api.js's handleError needs to attach the status
      // to the thrown Error, e.g.:
      //   const e = new Error(message);
      //   e.status = error?.response?.status;
      //   return Promise.reject(e);
      // Then here: rejectWithValue({ message: err.message, status: err.status })
      return rejectWithValue(err.message);
    }
  },
);

// ----------------------------- slice -----------------------------

const initialState = {
  user: storedUser,
  token: storedToken,
  isAuthenticated: Boolean(storedToken),

  loginLoading: false,
  profileLoading: false,
  updateLoading: false,
  dashboardLoading: false,

  dashboardData: null,

  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      clearStoredSession();
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
    },
    clearAuthError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ------------------------- login -------------------------
      .addCase(login.pending, (state) => {
        state.loginLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        const { token, admin, message } = action.payload;
        persistSession(token, admin);
        state.loginLoading = false;
        state.token = token;
        state.user = admin;
        state.isAuthenticated = true;
        toast.success(message || "Login successful");
      })
      .addCase(login.rejected, (state, action) => {
        state.loginLoading = false;
        state.error = action.payload;
        toast.error(action.payload || "Login failed");
      })

      // ---------------------- refreshProfile ----------------------
      .addCase(refreshProfile.pending, (state) => {
        state.profileLoading = true;
        state.error = null;
      })
      .addCase(refreshProfile.fulfilled, (state, action) => {
        const admin = action.payload.superAdmin;
        persistUser(admin);
        state.profileLoading = false;
        state.user = admin;
      })
      .addCase(refreshProfile.rejected, (state, action) => {
        state.profileLoading = false;
        state.error = action.payload;
        toast.error(action.payload || "Failed to load profile");

        // See NOTE in the refreshProfile thunk above — once auth.api.js
        // forwards the status code, gate this on a 401:
        // if (action.payload?.status === 401) {
        clearStoredSession();
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        // }
      })

      // ---------------------- updateProfile ----------------------
      .addCase(updateProfile.pending, (state) => {
        state.updateLoading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        const admin = action.payload.superAdmin;
        persistUser(admin);
        state.updateLoading = false;
        state.user = admin;
        toast.success(action.payload.message || "Profile updated");
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.updateLoading = false;
        state.error = action.payload;
        toast.error(action.payload || "Failed to update profile");
      })

      // ---------------------- getDashboard ----------------------
      .addCase(getDashboard.pending, (state) => {
        state.dashboardLoading = true;
        state.error = null;
      })
      .addCase(getDashboard.fulfilled, (state, action) => {
        state.dashboardData = action.payload;
        state.dashboardLoading = false;
      })
      .addCase(getDashboard.rejected, (state, action) => {
        state.dashboardLoading = false;
        state.error = action.payload;
        toast.error(action.payload || "Failed to load dashboard");
      });
  },
});

export const { logout, clearAuthError } = authSlice.actions;

// ---------------------------- selectors ----------------------------
export const selectUser = (state) => state.auth.user;
export const selectToken = (state) => state.auth.token;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthError = (state) => state.auth.error;

export default authSlice.reducer;