// Components/Redux/MerchantSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { toast } from "react-toastify";
import {
  getMerchantListApi,
  createMerchantApi,
  updateMerchantApi,
  getMerchantDetailApi,
  toggleMerchantSubscriptionApi,
  getMerchantsRevenueApi,
  getSalesSummaryApi,
  getOrdersListApi,
  getCustomersListApi,
  getCustomerDetailApi,
  getAllCustomers,
  getAllOrders,
  getProductListApi,
} from "../../api/merchant.api"; // adjust filename/path to match yours

// ----------------------------- thunks -----------------------------
// NOTE: response shapes below (data / pagination / message) are a
// reasonable guess matching the rest of your API. Check what each
// endpoint actually returns and adjust the extraReducers field access
// if the keys differ (e.g. `list` instead of `data`, `meta` instead of
// `pagination`, etc.).

export const fetchMerchantList = createAsyncThunk(
  "merchant/fetchMerchantList",
  async (params, { rejectWithValue }) => {
    try {
      return await getMerchantListApi(params);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

export const createMerchant = createAsyncThunk(
  "merchant/createMerchant",
  async (payload, { rejectWithValue }) => {
    try {
      return await createMerchantApi(payload);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

export const updateMerchant = createAsyncThunk(
  "merchant/updateMerchant",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      return await updateMerchantApi(id, payload);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

export const fetchMerchantDetail = createAsyncThunk(
  "merchant/fetchMerchantDetail",
  async (id, { rejectWithValue }) => {
    try {
      return await getMerchantDetailApi(id);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

export const toggleMerchantSubscription = createAsyncThunk(
  "merchant/toggleMerchantSubscription",
  async (id, { rejectWithValue }) => {
    try {
      const response = await toggleMerchantSubscriptionApi(id);

      return {
        id,
        merchant: response.merchant,
        message: response.message,
      };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchMerchantsRevenue = createAsyncThunk(
  "merchant/fetchMerchantsRevenue",
  async (params, { rejectWithValue }) => {
    try {
      return await getMerchantsRevenueApi(params);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

export const fetchSalesSummary = createAsyncThunk(
  "merchant/fetchSalesSummary",
  async (_, { rejectWithValue }) => {
    try {
      return await getSalesSummaryApi();
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

export const fetchOrdersList = createAsyncThunk(
  "merchant/fetchOrdersList",
  async (params, { rejectWithValue }) => {
    try {
      return await getOrdersListApi(params);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

export const fetchCustomersList = createAsyncThunk(
  "merchant/fetchCustomersList",
  async (params, { rejectWithValue }) => {
    try {
      return await getCustomersListApi(params);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

export const fetchProductList = createAsyncThunk(
  "merchant/fetchProductList",
  async (params, { rejectWithValue }) => {
    try {
      return await getProductListApi(params);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

export const fetchCustomerDetail = createAsyncThunk(
  "merchant/fetchCustomerDetail",
  async (id, { rejectWithValue }) => {
    try {
      return await getCustomerDetailApi(id);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

export const fetchAllCustomers = createAsyncThunk(
  "merchant/fetchAllCustomers",
  async (params, { rejectWithValue }) => {
    try {
      return await getAllCustomers(params);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
)

export const fetchAllOrders = createAsyncThunk(
  "merchant/fetchAllOrders",
  async (params, { rejectWithValue }) => {
    try {
      return await getAllOrders(params);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
)

// ----------------------------- slice -----------------------------

const initialState = {
  // merchants list (paginated)
  merchants: { data: [], pagination: null, loading: false, error: null },

  // single merchant being viewed
  merchantDetail: { data: null, loading: false, error: null },

  // mutation loading states, kept separate from list loading
  createMerchantLoading: false,
  updateMerchantLoading: false,
  toggleSubscriptionLoading: false,

  merchantsRevenue: { data: [], loading: false, error: null },
  salesSummary: { data: null, loading: false, error: null },

  orders: { data: [], pagination: null, loading: false, error: null },

  products: { data: [], pagination: null, loading: false, error: null },

  customers: { data: [], pagination: null, loading: false, error: null },
  customerDetail: { data: null, loading: false, error: null },

  allCustomers: { data: [], pagination: null, loading: false, error: null },

  allOrders: { data: [], pagination: null, loading: false, error: null },
};

const merchantSlice = createSlice({
  name: "merchant",
  initialState,
  reducers: {
    clearMerchantDetail: (state) => {
      state.merchantDetail = { data: null, loading: false, error: null };
    },
    clearCustomerDetail: (state) => {
      state.customerDetail = { data: null, loading: false, error: null };
    },
  },
  extraReducers: (builder) => {
    builder
      // ------------------------- merchant list -------------------------
      .addCase(fetchMerchantList.pending, (state) => {
        state.merchants.loading = true;
        state.merchants.error = null;
      })
      .addCase(fetchMerchantList.fulfilled, (state, action) => {
        state.merchants.loading = false;
        state.merchants.data = action.payload?.merchants ?? [];
        state.merchants.pagination = action.payload?.pagination ?? null;
      })
      .addCase(fetchMerchantList.rejected, (state, action) => {
        state.merchants.loading = false;
        state.merchants.error = action.payload;
        toast.error(action.payload?.message || "Failed to load merchants");
      })

      // -------------------------- create --------------------------
      .addCase(createMerchant.pending, (state) => {
        state.createMerchantLoading = true;
      })
      .addCase(createMerchant.fulfilled, (state, action) => {
        state.createMerchantLoading = false;
        const created = action.payload?.data;
        if (created) state.merchants.data.unshift(created);
        toast.success(action.payload?.message || "Merchant created");
      })
      .addCase(createMerchant.rejected, (state, action) => {
        state.createMerchantLoading = false;
        toast.error(action.payload || "Failed to create merchant");
      })

      // -------------------------- update --------------------------
      .addCase(updateMerchant.pending, (state) => {
        state.updateMerchantLoading = true;
      })
      .addCase(updateMerchant.fulfilled, (state, action) => {
        state.updateMerchantLoading = false;
        const updated = action.payload?.data;
        if (updated) {
          const idx = state.merchants.data.findIndex((m) => m.id === updated.id);
          if (idx !== -1) state.merchants.data[idx] = updated;
          if (state.merchantDetail.data?.id === updated.id) {
            state.merchantDetail.data = updated;
          }
        }
        toast.success(action.payload?.message || "Merchant updated");
      })
      .addCase(updateMerchant.rejected, (state, action) => {
        state.updateMerchantLoading = false;
        toast.error(action.payload || "Failed to update merchant");
      })

      // ------------------------- detail -------------------------
      .addCase(fetchMerchantDetail.pending, (state) => {
        state.merchantDetail.loading = true;
        state.merchantDetail.error = null;
      })
      .addCase(fetchMerchantDetail.fulfilled, (state, action) => {
        state.merchantDetail.loading = false;
        state.merchantDetail.data = action.payload?.data ?? action.payload ?? null;
      })
      .addCase(fetchMerchantDetail.rejected, (state, action) => {
        state.merchantDetail.loading = false;
        state.merchantDetail.error = action.payload;
        toast.error(action.payload || "Failed to load merchant");
      })

      // --------------------- toggle subscription ---------------------
      .addCase(toggleMerchantSubscription.pending, (state) => {
        state.toggleSubscriptionLoading = true;
      })
      .addCase(toggleMerchantSubscription.fulfilled, (state, action) => {
        state.toggleSubscriptionLoading = false;

        const { id, merchant, message } = action.payload;

        const idx = state.merchants.data.findIndex(
          (m) => m._id === id
        );

        if (idx !== -1) {
          state.merchants.data[idx].isSubscribed =
            merchant.isSubscribed;
        }

        if (state.merchantDetail.data?._id === id) {
          state.merchantDetail.data.isSubscribed =
            merchant.isSubscribed;
        }

        toast.success(message || "Subscription updated");
      })
      .addCase(toggleMerchantSubscription.rejected, (state, action) => {
        state.toggleSubscriptionLoading = false;
        toast.error(action.payload || "Failed to toggle subscription");
      })

      // ------------------------ top revenue ------------------------
      .addCase(fetchMerchantsRevenue.pending, (state) => {
        state.merchantsRevenue.loading = true;
        state.merchantsRevenue.error = null;
      })
      .addCase(fetchMerchantsRevenue.fulfilled, (state, action) => {
        state.merchantsRevenue.loading = false;
        state.merchantsRevenue.data = action.payload?.data ?? [];
      })
      .addCase(fetchMerchantsRevenue.rejected, (state, action) => {
        state.merchantsRevenue.loading = false;
        state.merchantsRevenue.error = action.payload;
        toast.error(action.payload || "Failed to load top merchants");
      })

      // ------------------------ sales summary ------------------------
      .addCase(fetchSalesSummary.pending, (state) => {
        state.salesSummary.loading = true;
        state.salesSummary.error = null;
      })
      .addCase(fetchSalesSummary.fulfilled, (state, action) => {
        state.salesSummary.loading = false;
        state.salesSummary.data = action.payload?.data ?? action.payload ?? null;
      })
      .addCase(fetchSalesSummary.rejected, (state, action) => {
        state.salesSummary.loading = false;
        state.salesSummary.error = action.payload;
        toast.error(action.payload || "Failed to load sales summary");
      })

      // ---------------------------- orders ----------------------------
      .addCase(fetchOrdersList.pending, (state) => {
        state.orders.loading = true;
        state.orders.error = null;
      })
      .addCase(fetchOrdersList.fulfilled, (state, action) => {
        state.orders.loading = false;
        state.orders.orders = action.payload?.orders ?? [];
        state.orders.pagination = action.payload?.pagination ?? null;
      })
      .addCase(fetchOrdersList.rejected, (state, action) => {
        state.orders.loading = false;
        state.orders.error = action.payload;
        toast.error(action.payload || "Failed to load orders");
      })

      // ---------------------------- products ----------------------------
      .addCase(fetchProductList.pending, (state) => {
        state.products.loading = true;
        state.products.error = null;
      })
      .addCase(fetchProductList.fulfilled, (state, action) => {
        state.products.loading = false;
        state.products.products = action.payload?.products ?? [];
        state.products.pagination = action.payload?.pagination ?? null;
      })
      .addCase(fetchProductList.rejected, (state, action) => {
        state.products.loading = false;
        state.products.error = action.payload;
        toast.error(action.payload || "Failed to load products");
      })

      // --------------------------- customers ---------------------------
      .addCase(fetchCustomersList.pending, (state) => {
        state.customers.loading = true;
        state.customers.error = null;
      })
      .addCase(fetchCustomersList.fulfilled, (state, action) => {
        state.customers.loading = false;
        state.customers.customers = action.payload?.customers ?? [];
        state.customers.pagination = action.payload?.pagination ?? null;
      })
      .addCase(fetchCustomersList.rejected, (state, action) => {
        state.customers.loading = false;
        state.customers.error = action.payload;
        toast.error(action.payload || "Failed to load customers");
      })

      // ------------------------ customer detail ------------------------
      .addCase(fetchCustomerDetail.pending, (state) => {
        state.customerDetail.loading = true;
        state.customerDetail.error = null;
      })
      .addCase(fetchCustomerDetail.fulfilled, (state, action) => {
        state.customerDetail.loading = false;
        state.customerDetail.data = action.payload?.data ?? action.payload ?? null;
      })
      .addCase(fetchCustomerDetail.rejected, (state, action) => {
        state.customerDetail.loading = false;
        state.customerDetail.error = action.payload;
        toast.error(action.payload || "Failed to load customer");
      })

      // ------------------------- all customers -------------------------
      .addCase(fetchAllCustomers.pending, (state) => {
        state.allCustomers.loading = true;
        state.allCustomers.error = null;
      })
      .addCase(fetchAllCustomers.fulfilled, (state, action) => {
        state.allCustomers.loading = false;
        state.allCustomers.data = action.payload?.customers ?? [];
        state.allCustomers.pagination = action.payload?.pagination ?? null;
      })
      .addCase(fetchAllCustomers.rejected, (state, action) => {
        state.allCustomers.loading = false;
        state.allCustomers.error = action.payload;
        toast.error(action.payload || "Failed to load customers");
      })

      // ------------------------- all orders -------------------------
      .addCase(fetchAllOrders.pending, (state) => {
        state.allOrders.loading = true;
        state.allOrders.error = null;
      })
      .addCase(fetchAllOrders.fulfilled, (state, action) => {
        state.allOrders.loading = false;
        state.allOrders.data = action.payload?.orders ?? [];
        state.allOrders.pagination = action.payload?.pagination ?? null;
      })
      .addCase(fetchAllOrders.rejected, (state, action) => {
        state.allOrders.loading = false;
        state.allOrders.error = action.payload;
        toast.error(action.payload || "Failed to load orders");
      })
  },
});

export const { clearMerchantDetail, clearCustomerDetail } = merchantSlice.actions;

// ---------------------------- selectors ----------------------------
export const selectMerchants = (state) => state.merchant.merchants;
export const selectMerchantDetail = (state) => state.merchant.merchantDetail;
export const selectMerchantsRevenue = (state) => state.merchant.merchantsRevenue;
export const selectSalesSummary = (state) => state.merchant.salesSummary;
export const selectOrders = (state) => state.merchant.orders;
export const selectCustomers = (state) => state.merchant.customers;
export const selectCustomerDetail = (state) => state.merchant.customerDetail;
export const selectAllCustomers = (state) => state.merchant.allCustomers;
export const selectAllOrders = (state) => state.merchant.allOrders;
export const selectProducts = (state) => state.merchant.products;

export default merchantSlice.reducer;