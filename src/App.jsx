import { Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import AdminLayout from "./components/layout/AdminLayout";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Merchants from "./pages/Merchants";
import Profile from "./pages/Profile";
import Placeholder from "./pages/Placeholder";
import NotFound from "./pages/NotFound";
import { MerchantOrders } from "./pages/MerchantOrders";
import { MerchantCustomers } from "./pages/MerchantCustomers";
import { AllCustomers } from "./pages/AllCustomers";

const App = () => {
  return (
    <>
      <Routes>
        {/* Public — root is the login page; authed users redirect to /dashboard */}
        <Route
          path="/"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route path="/login" element={<Login />} />

        {/* Protected */}
        <Route
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/merchants" element={<Merchants />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/customers/:id" element={<MerchantCustomers />} />
          <Route path="/orders" element={<Placeholder title="Orders" description="Manage all orders across merchants" />} />
          <Route path="/orders/:id" element={<MerchantOrders />} />
          <Route path="/customers" element={<AllCustomers />} />
        </Route>

        {/* Catch-all 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        theme="light"
      />
    </>
  );
};

export default App;
