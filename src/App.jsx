import React, { useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Login from "./components/Login";
import Loading from "./components/Loading";

import Home from "./pages/Home";
import AllProducts from "./pages/AllProducts";
import ProductCategory from "./pages/ProductCategory";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import AddAddress from "./pages/AddAddress";
import MyOrders from "./pages/MyOrders";
import Error404 from "./pages/Error404";

import SellerLogin from "./components/merchant/SellerLogin";
import SellerLayout from "./pages/merchant/SellerLayout";
import AddProduct from "./pages/merchant/AddProduct";
import ProductList from "./pages/merchant/ProductList";
import Orders from "./pages/merchant/Orders";
import CategoryManager from "./pages/merchant/CategoryManager";
import SubcategoryManager from "./pages/merchant/SubCategoryManager";
import MerchantSettingsPage from "./pages/merchant/MerchantSettingsPage";
import BuyNow from "./pages/BuyNow";
import { ToastContainer } from "react-toastify";
import { useAppContext } from "./context/AppContext";
import Loader from "./components/Loader";
import ReportPage from "./components/merchant/ReportPage";
import Instagramproductspage from "./pages/merchant/Instagramproductspage";
import Profile from "./pages/merchant/Profile";
import ProfilePage from "./pages/UserProfile";
import ExistProfile from "./pages/merchant/ExistProfile";
import ScrollToTop from "./components/utils/ScrollToTop";
import Contact from "./pages/Contact";


const BUILD_TYPE = import.meta.env.VITE_BUILD_TYPE; // user | merchant

const isMerchantBuild = BUILD_TYPE === "merchant";
const hexToRgba = (hex, alpha = 0.1) => {
  let c = hex.replace("#", "");

  if (c.length === 3) {
    c = c
      .split("")
      .map((x) => x + x)
      .join("");
  }

  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: false,
      retry: 1,
    },
  },
});

const App = () => {
  const { showUserLogin, isMerchant, authLoading, settings } = useAppContext();

  useEffect(() => {
    if (settings?.theme?.primaryColor) {
      document.documentElement.style.setProperty(
        "--color-primary",
        settings?.theme?.primaryColor,
      );
      document.documentElement.style.setProperty(
        "--color-primary-bg",
        hexToRgba(settings?.theme?.primaryColor, 0.01),
      );
    }

    if (settings?.theme?.darkModeEnabled) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    if (settings?.theme?.fontFamily) {
      document.documentElement.style.setProperty(
        "--font-family",
        settings?.theme?.fontFamily,
      );
    }

    if (settings?.branding?.logo?.url) {
      const favicon =
        document.querySelector("link[rel='icon']") ||
        document.createElement("link");

      favicon.rel = "icon";
      favicon.type = "image/png";
      favicon.href = settings.branding.logo.url;

      if (!document.querySelector("link[rel='icon']")) {
        document.head.appendChild(favicon);
      }
    }

    if (settings?.title) {
      document.title = settings.title;
    }
  }, [settings]);

  if (isMerchantBuild && authLoading) {
    return <Loader />;
  }

  return (

    <QueryClientProvider client={queryClient}>
      <ScrollToTop />
      <div
        className={`text-default min-h-screen text-gray-700 bg-[var(--color-primary-bg)]`}
      >
        {/* USER BUILD UI */}
        {!isMerchantBuild && <Navbar />}
        {!isMerchantBuild && showUserLogin && <Login />}

        <Toaster />
        <ToastContainer position="top-center" autoClose={3000} />

        <div
          className={isMerchantBuild ? "" : "px-6 md:px-16 lg:px-24 xl:px-32 "}
        >
          <Routes>
            {/* ================= USER ROUTES ================= */}
            {!isMerchantBuild && (
              <>
                <Route path="/" element={<Home />} />
                <Route path="/products" element={<AllProducts />} />
                <Route path="/products/:category" element={<ProductCategory />} />

                <Route
                  path="/products/:category/:id"
                  element={<ProductDetails />}
                />
                <Route path="/cart" element={<Cart />} />
                <Route path="/add-address" element={<AddAddress />} />
                <Route path="/my-orders" element={<MyOrders />} />
                <Route path="/user/profile" element={<ProfilePage />} />
                <Route path="/loader" element={<Loading />} />
                <Route path="/buy-now" element={<BuyNow />} />
                <Route path="/login" element={<Login />} />
                <Route path="/contact" element={<Contact />} />

              </>
            )}

            {/* ================= MERCHANT ROUTES ================= */}
            {isMerchantBuild && (
              <Route
                path="/*"
                element={isMerchant ? <SellerLayout /> : <SellerLogin />}
              >
                <Route
                  path="dashboard"
                  element={isMerchant ? <AddProduct /> : null}
                />
                <Route path="manage-categories" element={<CategoryManager />} />
                <Route
                  path="manage-subcategories"
                  element={<SubcategoryManager />}
                />
                <Route path="product-list" element={<ProductList />} />
                <Route path="orders" element={<Orders />} />
                <Route path="settings" element={<MerchantSettingsPage />} />
                <Route path="report" element={<ReportPage />} />
                <Route path="instagram-products" element={<Instagramproductspage />} />
                <Route path="profile" element={<ExistProfile />} />
                {/* <Route path="profile" element={<Profile />} /> */}
              </Route>
            )}

            {/* FALLBACK */}
            <Route path="*" element={<Error404 />} />
          </Routes>
        </div>

        {!isMerchantBuild && <Footer />}
      </div>
    </QueryClientProvider>
  );
};

export default App;

// import React from "react";
// import Navbar from "./components/Navbar";
// import { Route, Routes, useLocation } from "react-router-dom";
// import Home from "./pages/Home";
// import { Toaster } from "react-hot-toast";
// import Footer from "./components/Footer";
// import { useAppContext } from "./context/AppContext";
// import Login from "./components/Login";
// import AllProducts from "./pages/AllProducts";
// import ProductCategory from "./pages/ProductCategory";
// import ProductDetails from "./pages/ProductDetails";
// import Cart from "./pages/Cart";
// import AddAddress from "./pages/AddAddress";
// import MyOrders from "./pages/MyOrders";
// import SellerLogin from "./components/merchant/SellerLogin";
// import SellerLayout from "./pages/merchant/SellerLayout";
// import AddProduct from "./pages/merchant/AddProduct";
// import ProductList from "./pages/merchant/ProductList";
// import Orders from "./pages/merchant/Orders";
// import Loading from "./components/Loading";
// import Categories from "./components/Categories";
// import CategoryManager from "./pages/merchant/CategoryManager";
// import SubcategoryManager from "./pages/merchant/SubCategoryManager";
// import MerchantSettingsPage from "./pages/merchant/MerchantSettingsPage";
// import Error404 from "./pages/Error404";

// const App = () => {
//   const isSellerPath = useLocation().pathname.includes("merchant");
//   const { showUserLogin, isMerchant } = useAppContext();

//   return (
//     <div className="text-default min-h-screen text-gray-700 bg-white">
//       {isSellerPath ? null : <Navbar />}
//       {showUserLogin ? <Login /> : null}

//       <Toaster />

//       <div
//         className={`${isSellerPath ? "" : "px-6 md:px-16 lg:px-24 xl:px-32"}`}
//       >
//         <Routes>
//           <Route path="/" element={<Home />} />
//           <Route path="/products" element={<AllProducts />} />
//           <Route path="/products/:category" element={<ProductCategory />} />
//           <Route path="/products/:category/:id" element={<ProductDetails />} />
//           <Route path="/cart" element={<Cart />} />
//           <Route path="/add-address" element={<AddAddress />} />
//           <Route path="/my-orders" element={<MyOrders />} />
//           <Route path="/loader" element={<Loading />} />
//           <Route path="*" element={<Error404 />} />
//           <Route
//             path="/merchant"
//             element={isMerchant ? <SellerLayout /> : <SellerLogin />}
//           >
//             <Route index element={isMerchant ? <AddProduct /> : null} />
//             <Route
//               path="manage-categories"
//               element={isMerchant ? <CategoryManager /> : null}
//             />
//             <Route
//               path="manage-subcategories"
//               element={isMerchant ? <SubcategoryManager /> : null}
//             />
//             <Route path="product-list" element={<ProductList />} />
//             <Route path="orders" element={<Orders />} />
//             <Route path="settings" element={<MerchantSettingsPage />} />
//           </Route>
//         </Routes>
//       </div>
//       {!isSellerPath && <Footer />}
//     </div>
//   );
// };

// export default App;
