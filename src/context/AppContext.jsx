import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";

axios.defaults.withCredentials = true;
axios.defaults.baseURL = import.meta.env.VITE_BACKEND_URL;

export const AppContext = createContext();

export const AppContextProvider = ({ children }) => {
  const currency = import.meta.env.VITE_CURRENCY;
  const BUILD_TYPE = import.meta.env.VITE_BUILD_TYPE; // user | merchant

  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isMerchant, setIsMerchant] = useState(false);
  const [showUserLogin, setShowUserLogin] = useState(false);
  const [products, setProducts] = useState([]);
  const [settings, getSettings] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [authLoading, setAuthLoading] = useState(true);
  const [merchantData, setMerchantData] = useState({});
  const [globalLoader, setGlobalLoader] = useState(false);

  // PAGINATION 

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchParams, setSearchParams] = useState("");


  // Get the merchant ID from frontend .env
  const merchantId = import.meta.env.VITE_MERCHANT_ID;

  // Fetch Seller Status

  const fetchMerchant = async () => {
    try {
      const { data } = await axios.get("/api/merchant/is-auth");
      if (data.success) {
        setIsMerchant(true);
        setMerchantData(data?.merchant);
      } else {
        setIsMerchant(false);
      }
    } catch (error) {
      setIsMerchant(false);
    }
    setAuthLoading(false);
  };

  // Update Merchant Password
  const updateMerchantPassword = async (currentPassword, newPassword, confirmPassword) => {
    try {
      const { data } = await axios.put("/api/merchant/update-password", {
        currentPassword,
        newPassword,
        confirmPassword,
      });

      if (data.success) {
        toast.success(data.message || "Password updated successfully");
        // Backend clears the auth cookie on success, so log the merchant out locally too
        setIsMerchant(null);
        navigate("/merchant");
        return { success: true };
      } else {
        toast.error(data.message || "Failed to update password");
        return { success: false, message: data.message };
      }
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || "Failed to update password";
      toast.error(message);
      return { success: false, message };
    }
  };

  // Fetch User Auth Status , User Data and Cart Items
  const fetchUser = async () => {
    try {
      const { data } = await axios.get("/api/user/is-auth");
      if (data.success) {
        setUser(data.user);
        setCartItems(data.user.cartItems);
      }
    } catch (error) {
      setUser(null);
    }
  };

  // Fetch All Products
  const fetchProducts = async () => {
    try {
      const { data } = await axios.get(
        `/api/user/product/list?merchantId=${merchantId}&search=${searchParams}&page=${page}&limit=${limit}`
      );

      if (data.success) {
        setProducts(data.products);
        setTotal(data.total);
        setPage(data.page);
        setTotalPages(data.totalPages);
      } else {
        toast.error(data.message || "Failed to fetch products");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  const fetchSettings = async () => {
    try {
      setGlobalLoader(true);
      const { data } = await axios.get(
        `/api/user/settings?merchantId=${merchantId}`
      );
      if (data.success) {
        getSettings(data?.data || {});
      } else {
        toast.error(data.message || "Failed to fetch products");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);

    } finally {
      setGlobalLoader(false);
    }
  };

  // Add Product to Cart
  // const addToCart = async (productId, variantId, size, quantity = 1) => {
  //   try {
  //     const { data } = await axios.post("/api/cart/add", {
  //       productId,
  //       variantId,
  //       size,
  //       quantity,
  //     });

  //     if (data?.success) {
  //       toast.success(data?.message);
  //       setCartItems(data?.cartItems);
  //     }
  //   } catch (error) {
  //     toast.error(error.response?.data?.message || "Failed to add to cart");
  //   }
  // };

  const addToCart = async (productId, variantId, size, quantity = 1) => {
    try {
      if (user) {
        const { data } = await axios.post("/api/cart/add", {
          productId,
          variantId,
          size,
          quantity,
        });

        if (data?.success) {
          toast.success(data?.message);
          setCartItems(data?.cartItems);
        }

        return;
      }

      const guestId = localStorage.getItem("guestCartId");

      const { data } = await axios.post("/api/cart/guest/add", {
        guestId,
        item: {
          productId,
          variantId,
          merchantId,
          size,
          quantity,
        },
      });

      if (data?.success) {
        toast.success("Item added to cart");
        setCartItems(data?.cartItems);

        // Save guestId first time
        if (!guestId && data?.guestId) {
          localStorage.setItem("guestCartId", data.guestId);
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add to cart");
    }
  };

  // Update Cart Item Quantity
  // const updateCartItem = async (productId, variantId, size, quantity) => {
  //   try {
  //     const { data } = await axios.put("/api/cart/update", {
  //       productId,
  //       variantId,
  //       size,
  //       quantity,
  //     });

  //     if (data.success) {
  //       setCartItems(data.cartItems);
  //       toast.success("Cart updated");
  //     } else {
  //       toast.error(data.message || "Failed to update cart");
  //     }
  //   } catch (error) {
  //     toast.error(error.response?.data?.message || "Failed to update cart");
  //   }
  // };

  const updateCartItem = async (productId, variantId, size, quantity) => {
    try {
      if (user) {
        const { data } = await axios.put("/api/cart/update", {
          productId,
          variantId,
          size,
          quantity,
        });

        if (data.success) {
          setCartItems(data.cartItems);
          toast.success("Cart updated");
        } else {
          toast.error(data.message || "Failed to update cart");
        }

        return;
      }

      const guestId = localStorage.getItem("guestCartId");

      const { data } = await axios.put("/api/cart/guest/update", {
        guestId,
        productId,
        variantId,
        size,
        quantity,
      });

      if (data.success) {
        setCartItems(data.cartItems);
        toast.success("Cart updated");
      } else {
        toast.error(data.message || "Failed to update cart");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update cart");
    }
  };

  // Remove Product from Cart
  // const removeFromCart = async (productId, variantId, size) => {
  //   try {
  //     const { data } = await axios.delete("/api/cart/remove", {
  //       data: {
  //         productId,
  //         variantId,
  //         size,
  //       },
  //     });

  //     if (data.success) {
  //       setCartItems(data.cartItems);
  //       toast.success(data.message || "Item removed from cart");
  //     } else {
  //       toast.error(data.message || "Failed to remove item");
  //     }
  //   } catch (error) {
  //     toast.error(error.response?.data?.message || "Failed to remove item");
  //   }
  // };

  const removeFromCart = async (productId, variantId, size) => {
    try {
      if (user) {
        const { data } = await axios.delete("/api/cart/remove", {
          data: { productId, variantId, size },
        });

        if (data.success) {
          setCartItems(data.cartItems);
          toast.success(data.message || "Item removed from cart");
        } else {
          toast.error(data.message || "Failed to remove item");
        }

        return;
      }

      const guestId = localStorage.getItem("guestCartId");

      const { data } = await axios.delete("/api/cart/guest/remove", {
        data: {
          guestId,
          productId,
          variantId,
          size,
        },
      });

      if (data.success) {
        setCartItems(data.cartItems);
        toast.success("Item removed from cart");
      } else {
        toast.error(data.message || "Failed to remove item");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to remove item");
    }
  };

  // Get Cart Item Count
  const getCartCount = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  // Get Cart Total Amount
  const getCartAmount = () => {
    let total = 0;

    for (const cartItem of cartItems) {
      const product = products.find((p) => p._id === cartItem.productId);
      if (!product) continue;

      const variant = product.variants.find(
        (v) => v._id === cartItem.variantId
      );
      if (!variant) continue;

      const sizeObj = variant.sizes.find((s) => s.size === cartItem.size);
      if (!sizeObj) continue;

      // offerPrice is discount percentage
      const discountedPrice =
        sizeObj.price - (sizeObj.price * sizeObj.offerPrice) / 100;
      total += discountedPrice * cartItem.quantity;
    }

    return Math.round(total * 100) / 100; // 2 decimal places
  };

  const fetchGuestCart = async () => {
    try {
      const guestId = localStorage.getItem("guestCartId");
      if (!guestId) return;

      const { data } = await axios.get(`/api/cart/guest/get/${guestId}`);

      if (data.success) {
        setCartItems(data?.cartItems);
      }
    } catch (error) {
      console.error("Failed to fetch guest cart");
    }
  };

  useEffect(() => {
    const guestId = localStorage.getItem("guestCartId");

    if (user && guestId) {
      axios.post("/api/cart/guest/merge", { guestId }).then((res) => {
        localStorage.removeItem("guestCartId");
        setCartItems(res?.data?.cartItems);
      });
    }
  }, [user]);

  useEffect(() => {
    if (BUILD_TYPE == "user") {
      fetchUser();
      // fetchProducts();
      fetchSettings();
      // ✅ load guest cart ONLY when user not logged in
      if (!user) {
        fetchGuestCart();
      }
    }
    fetchMerchant();
  }, []);

  // Update Database Cart Items
  // useEffect(() => {
  //   const updateCart = async () => {
  //     try {
  //       const { data } = await axios.post("/api/cart/update", { cartItems });
  //       if (!data.success) {
  //         toast.error(data.message);
  //       }
  //     } catch (error) {
  //       toast.error(error.message);
  //     }
  //   };

  //   if (user) {
  //     updateCart();
  //   }
  // }, [cartItems]);

  const value = {
    navigate,
    user,
    setUser,
    setIsMerchant,
    isMerchant,
    showUserLogin,
    setShowUserLogin,
    products,
    currency,
    addToCart,
    updateCartItem,
    removeFromCart,
    cartItems,
    searchQuery,
    authLoading,
    setSearchQuery,
    getCartAmount,
    getCartCount,
    axios,
    fetchProducts,
    setCartItems,
    settings,
    globalLoader,
    merchantData,
    setMerchantData,
    fetchUser,
    updateMerchantPassword
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  return useContext(AppContext);
};
