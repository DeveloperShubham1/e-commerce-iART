import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

axios.defaults.withCredentials = true;
axios.defaults.baseURL = import.meta.env.VITE_BACKEND_URL;

const DashboardContext = createContext();

export const DashboardProvider = ({ children }) => {
  const [salesTrend, setSalesTrend] = useState([]);
  const [loading, setLoading] = useState(false);
  const [paymentAnalytics, setPaymentAnalytics] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [totals, setTotals] = useState({});

  const [topProducts, setTopProducts] = useState([]);
  const [topProductsLoading, setTopProductsLoading] = useState(false);

  // Fetch Sales Trend (Last 6 Months)
  const fetchSalesTrend = async (params) => {
    try {
      setLoading(true);

      const { data } = await axios.get("/api/orders/report/sales-trend", {
        params,
      });

      if (data.success) {
        setSalesTrend(data.data);
        setTotals(data.totals);
      } else {
        toast.error(data.message || "Failed to load sales trend");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to load sales trend",
      );
    } finally {
      setLoading(false);
    }
  };

  //   REVENUE BY PAYMENT METHOD
  const fetchPaymentAnalytics = async (params) => {
    try {
      setPaymentLoading(true);

      const { data } = await axios.get("/api/orders/report/payment-analytics", {
        params,
      });

      if (data.success) {
        setPaymentAnalytics(data.data);
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to load payment analytics",
      );
    } finally {
      setPaymentLoading(false);
    }
  };

  //   top saleing products
  const fetchTopProducts = async (params) => {
    try {
      setTopProductsLoading(true);

      const { data } = await axios.get("/api/orders/report/top-products", {
        params,
      });

      if (data.success) {
        setTopProducts(data.data);
      } else {
        toast.error(data.message || "Failed to fetch top products");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to fetch top products",
      );
    } finally {
      setTopProductsLoading(false);
    }
  };

  const value = {
    salesTrend,
    totals,
    loading,
    fetchSalesTrend,
    fetchTopProducts,
    topProducts,
    topProductsLoading,
    paymentLoading,
    paymentAnalytics,
    fetchPaymentAnalytics,
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboardContext = () => {
  return useContext(DashboardContext);
};
