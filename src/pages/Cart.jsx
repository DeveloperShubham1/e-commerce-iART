import { useEffect, useState } from "react";
import { useAppContext } from "../context/AppContext";
import { assets } from "../assets/assets";
import { toast } from "react-toastify";
import PayNowButton from "../components/PayNowButton";
import PaymentQrModal from "../components/merchant/PaymentQrModal";
import { usePaymentConfig } from "../services/merchant";
import {
  loadCheckoutState,
  saveCheckoutState,
  clearCheckoutState,
} from "../utils/checkoutPersistence";

const ADVANCE_AMOUNT = 200;

const Cart = () => {
  const merchantId = import.meta.env.VITE_MERCHANT_ID;
  const {
    products,
    currency,
    cartItems = [], // cartItems is now an array of objects
    removeFromCart,
    updateCartItem, // assumed to accept cartItem _id and new quantity
    navigate,
    getCartAmount,
    setShowUserLogin, // you'll need to adjust this in context if necessary
    axios,
    user,
    setCartItems,
  } = useAppContext();

  const { data: paymentConfigData } = usePaymentConfig();
  const paymentConfig = paymentConfigData?.data;

  const [cartArray, setCartArray] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [showAddress, setShowAddress] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [paymentOption, setPaymentOption] = useState(""); // "" | "COD" | "Online" | "UPI"

  /* ---------------- QR/UPI AVAILABILITY ---------------- */
  const upiAvailable = Boolean(paymentConfig?.upi?.enabled);
  const codAvailable = Boolean(paymentConfig?.upi?.codEnabled);
  const razpayAvailable = Boolean(paymentConfig?.isRazorpayenabled);


  const codAdvanceRequired = upiAvailable; // COD still needs the small advance
  const [modalMode, setModalMode] = useState(null); // "cod" | "upi" | null
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const [codPaymentImage, setCodPaymentImage] = useState(null); // ₹200 advance screenshot
  const [upiPaymentImage, setUpiPaymentImage] = useState(null); // full-amount screenshot

  // Cart isn't tied to one product like BuyNow, so key persistence off the
  // logged-in user instead of productId/variantId/size.
  const storageKey = user?._id ? `cartCheckoutState:${user._id}` : null;
  const [hasRestored, setHasRestored] = useState(false);

  const openPaymentModal = (mode) => {
    setModalMode(mode);
    setShowPaymentModal(true);
  };

  const handlePaymentOptionChange = (value) => {
    setPaymentOption(value);

    if (value === "COD") {
      // Only require/open the advance modal if the merchant has UPI enabled,
      // and only if the customer hasn't already confirmed a screenshot.
      if (codAdvanceRequired && !codPaymentImage) {
        openPaymentModal("cod");
      }
    } else if (value === "UPI") {
      // Full-amount UPI payment always needs a fresh screenshot for this order.
      if (!upiPaymentImage) {
        openPaymentModal("upi");
      }
    }

    // Clear whichever screenshot no longer applies when switching away
    if (value !== "COD") setCodPaymentImage(null);
    if (value !== "UPI") setUpiPaymentImage(null);
  };

  const handlePaymentConfirm = (url) => {
    if (modalMode === "cod") {
      setCodPaymentImage(url);
    } else if (modalMode === "upi") {
      setUpiPaymentImage(url);
    }
    setShowPaymentModal(false);
    toast.success("Payment screenshot uploaded");
  };

  // Restore paymentOption/screenshots/selected address after coming back
  // from /add-address (or any other remount) — runs once per storageKey.
  useEffect(() => {
    if (hasRestored || !storageKey) return;
    const saved = loadCheckoutState(storageKey);
    if (saved) {
      if (saved.paymentOption) setPaymentOption(saved.paymentOption);
      if (saved.codPaymentImage) setCodPaymentImage(saved.codPaymentImage);
      if (saved.upiPaymentImage) setUpiPaymentImage(saved.upiPaymentImage);
    }
    setHasRestored(true);
  }, [storageKey, hasRestored]);

  // Persist the ephemeral selections any time they change.
  useEffect(() => {
    if (!hasRestored || !storageKey) return;
    saveCheckoutState(storageKey, {
      paymentOption,
      codPaymentImage,
      upiPaymentImage,
      selectedAddressId: selectedAddress?._id || null,
    });
  }, [
    hasRestored,
    storageKey,
    paymentOption,
    codPaymentImage,
    upiPaymentImage,
    selectedAddress,
  ]);

  useEffect(() => {
    (async () => {
      try {
        if (!user) {
          return;
        }
        const { data } = await axios.get("/api/cart");
        if (data.success) setCartItems(data.cartItems || []);
      } catch (err) {
        toast.error("Failed to load cartItems");
      }
    })();
  }, [axios]);

  // Build enriched cart array with full product + variant details
  const getCart = () => {
    const temp = cartItems
      .map((cartItem) => {
        const product = products.find((p) => p._id === cartItem.productId);
        if (!product) return null;

        const variant = product.variants.find(
          (v) => v._id === cartItem.variantId,
        );
        if (!variant) return null;

        const sizeObj = variant.sizes.find((s) => s.size === cartItem.size);
        if (!sizeObj) return null;

        // Calculate discounted price: offerPrice is % discount
        const discountedPrice =
          cartItem.price - (cartItem.price * cartItem.offerPrice) / 100;

        return {
          ...product,
          cartId: cartItem._id,
          variant,
          selectedSize: cartItem.size,
          quantity: cartItem.quantity,
          originalPrice: cartItem.price,
          offerPercentage: cartItem.offerPrice,
          discountedPrice, // price after discount
          itemTotal: discountedPrice * cartItem.quantity,
          displayImage: variant.images[0], // first image of the variant
        };
      })
      .filter(Boolean);

    setCartArray(temp);
  };

  const getUserAddress = async () => {
    try {
      const { data } = await axios.get("/api/address/get");
      if (data.success) {
        setAddresses(data.addresses);
        if (data.addresses.length > 0) {
          const saved = loadCheckoutState(storageKey);
          const restored =
            saved?.selectedAddressId &&
            data.addresses.find((a) => a._id === saved.selectedAddressId);
          setSelectedAddress(restored || data.addresses[0]);
        }
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message || "Failed to fetch addresses");
    }
  };

  const addressFun = () => {
    if (!user) {
      toast.info("Please Login to add address");
      setShowUserLogin(true);
      return;
    }
    navigate("/add-address");
  };

  // Recalculate cart when products or cartItems change
  useEffect(() => {
    if (products.length > 0 && cartItems.length > 0) {
      getCart();
    } else {
      setCartArray([]);
    }
  }, [products, cartItems]);

  // Clear any saved payment method/screenshots if the cart becomes empty —
  // e.g. the user removed every item. Otherwise a stale "UPI screenshot
  // confirmed" state could carry over to an unrelated future cart.
  useEffect(() => {
    if (hasRestored && storageKey && cartItems.length === 0) {
      clearCheckoutState(storageKey);
    }
  }, [cartItems, hasRestored, storageKey]);

  useEffect(() => {
    if (user) {
      getUserAddress();
    }
  }, [user]);

  // Calculate total cart amount (discounted)
  const totalAmount = cartArray.reduce((sum, item) => sum + item.itemTotal, 0);
  const taxAmount = (totalAmount * 0) / 100;
  const finalTotal = totalAmount + taxAmount;

  /* ---------------- PLACE ORDER ---------------- */
  const placeOrder = async () => {
    if (!user) {
      toast.info("Please login to place your order");
      setShowUserLogin(true);
      return;
    }

    if (!selectedAddress) {
      toast.info("Please select a delivery address");
      return;
    }

    if (!paymentOption) {
      toast.info("Please select a payment method");
      return;
    }

    if (paymentOption === "COD" && codAdvanceRequired && !codPaymentImage) {
      toast.info(`Please pay the ₹${ADVANCE_AMOUNT} advance and upload the screenshot`);
      openPaymentModal("cod");
      return;
    }

    if (paymentOption === "UPI" && !upiPaymentImage) {
      toast.info(`Please pay ₹${finalTotal.toFixed(2)} and upload the screenshot`);
      openPaymentModal("upi");
      return;
    }

    const orderItems = cartArray.map((item) => ({
      productId: item._id,
      variantId: item.variant._id,
      size: item.selectedSize,
      quantity: item.quantity,
      price: item.originalPrice,
      offerPrice: item.offerPercentage,
    }));

    try {
      if (paymentOption === "COD") {
        const payload = {
          items: orderItems,
          address: selectedAddress._id,
          merchantId,
        };

        // Only attach paymentImage when an advance payment was actually required
        if (codAdvanceRequired) {
          payload.paymentImage = [codPaymentImage];
        }

        const { data } = await axios.post("/api/user/order/cod", payload);

        if (data.success) {
          toast.success(data.message);
          clearCheckoutState(storageKey);
          setCartItems([]);
          navigate("/my-orders", { state: { justPlaced: true } });
        } else {
          toast.error(data.message);
        }
      } else if (paymentOption === "UPI") {
        const payload = {
          items: orderItems,
          address: selectedAddress._id,
          merchantId,
          paymentImage: [upiPaymentImage],
          amountPaid: finalTotal,
        };

        const { data } = await axios.post("/api/orders/upi", payload);

        if (data.success) {
          toast.success(data.message);
          clearCheckoutState(storageKey);
          setCartItems([]);
          navigate("/my-orders", { state: { justPlaced: true } });
        } else {
          toast.error(data.message);
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to place order");
    }
  };

  if (products.length === 0 || cartItems.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-500 text-lg font-medium">No Cart Found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row mt-10 lg:mt-16 gap-8 lg:gap-12 max-w-7xl mx-auto px-4 md:px-6">
      {/* Cart Items Section */}
      <div className="flex-1 w-full lg:max-w-4xl">
        <h1 className="text-3xl font-medium mb-6">
          Shopping Cart{" "}
          <span className="text-sm text-primary">
            {cartItems.length} Item{cartItems.length > 1 ? "s" : ""}
          </span>
        </h1>

        <div
          className="hidden lg:grid grid-cols-[2fr_1fr_1fr] text-gray-500 text-base font-medium pb-3 border-b
        "
        >
          <p>Product Details</p>
          <p className="text-center">Subtotal</p>
          <p className="text-center">Action</p>
        </div>

        <div className="max-h-[420px] overflow-y-auto pr-2">
          {cartArray.map((item) => (
            <div
              key={item.cartId}
              className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr] items-center py-6 border-b last:border-b-0"
            >
              <div className="flex gap-4">
                <div
                  onClick={() => {
                    navigate(`/products/suit/${item._id}`);
                    window.scrollTo(0, 0);
                  }}
                  className="cursor-pointer w-24 h-24 border border-gray-300 rounded overflow-hidden flex-shrink-0"
                >
                  <img
                    src={item.displayImage}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex flex-col justify-center">
                  <p className="font-semibold text-lg">{item.name}</p>
                  <p className="text-sm text-gray-600">
                    Brand: <span className="font-medium">{item.brand}</span>
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-sm">
                    <span className="text-gray-600">Color:</span>
                    <div
                      className="w-6 h-6 rounded-full border"
                      style={{ backgroundColor: item.variant.colorCode }}
                    />
                    <span className="font-medium">{item.variant.color}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Size:{" "}
                    <span className="font-medium">{item.selectedSize}</span>
                  </p>

                  <div className="flex items-center gap-3 mt-3">
                    <label className="text-sm">Qty:</label>
                    <select
                      value={item.quantity}
                      onChange={(e) =>
                        updateCartItem(
                          item._id,
                          item.variant._id,
                          item.selectedSize,
                          Number(e.target.value),
                        )
                      }
                      className="border border-gray-300 px-2 py-1 rounded outline-none cursor-pointer "
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                        <option key={num} value={num}>
                          {num}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="text-center mt-4 md:mt-0">
                <p className="text-lg font-medium">
                  {currency}
                  {item.itemTotal.toFixed(2)}
                </p>
                {item.offerPercentage > 0 && (
                  <p className="text-sm text-gray-500 line-through">
                    {currency}
                    {(item.originalPrice * item.quantity).toFixed(2)}
                  </p>
                )}
              </div>

              <div className="text-center mt-4 md:mt-0">
                <button
                  onClick={() =>
                    removeFromCart(
                      item._id,
                      item.variant._id,
                      item.selectedSize,
                    )
                  }
                  className="text-red-600 hover:text-red-800"
                >
                  <img
                    src={assets.remove_icon}
                    alt="Remove"
                    className="w-6 h-6 mx-auto cursor-pointer"
                  />
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => {
            navigate("/products");
            window.scrollTo(0, 0);
          }}
          className="group flex items-center mt-8 gap-2 text-primary font-medium cursor-pointer"
        >
          <img
            className="group-hover:-translate-x-1 transition "
            src={assets.arrow_right_icon_colored}
            alt="arrow"
          />
          Continue Shopping
        </button>
      </div>

      {/* Order Summary Sidebar */}
      <div className="max-w-[360px] w-full bg-gray-50 p-6 border border-gray-300 rounded-lg">
        <h2 className="text-2xl font-medium mb-5">Order Summary</h2>

        <div className="space-y-6">
          <div className="relative mt-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Delivery Address
            </p>

            <div className="mt-2 flex items-start justify-between gap-4 rounded-md border border-gray-200 bg-white p-3">
              <p className="text-sm text-gray-700 leading-relaxed">
                {selectedAddress
                  ? `${selectedAddress.street}, ${selectedAddress.city}, ${selectedAddress.state}, ${selectedAddress.country}`
                  : "No address selected"}
              </p>

              <button
                onClick={() => setShowAddress(!showAddress)}
                className="text-sm font-medium text-primary hover:underline whitespace-nowrap cursor-pointer"
              >
                Change
              </button>
            </div>

            {showAddress && (
              <div className="absolute left-0 right-0 z-20 mt-2 overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg">
                {addresses.map((addr) => (
                  <div
                    key={addr._id}
                    onClick={() => {
                      setSelectedAddress(addr);
                      setShowAddress(false);
                    }}
                    className="cursor-pointer px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
                  >
                    {addr.street}, {addr.city}, {addr.state}, {addr.country}
                  </div>
                ))}

                <div
                  onClick={addressFun}
                  className="cursor-pointer border-t px-4 py-2 text-center text-sm font-medium text-primary hover:bg-primary/10 transition"
                >
                  + Add new address
                </div>
              </div>
            )}
          </div>

          <div>
            <p className="text-sm font-medium uppercase text-gray-600">
              Payment Method
            </p>
            <select
              value={paymentOption}
              onChange={(e) => handlePaymentOptionChange(e.target.value)}
              className="w-full mt-2 px-3 py-2 border border-gray-300 rounded outline-none cursor-pointer"
            >
              <option value="" disabled>
                Select payment method
              </option>
              {codAvailable && (
                <option value="COD">
                  Cash On Delivery (Partial Payment)
                </option>
              )}

              {razpayAvailable && (
                <option value="Online">
                  Online Payment (Razorpay)
                </option>
              )}

              {upiAvailable && (
                <option value="UPI">
                  UPI Payment (Pay & Upload)
                </option>
              )}
            </select>

            {paymentOption === "COD" && codAdvanceRequired && (
              <div className="mt-2 flex items-center justify-between rounded border bg-white px-3 py-2">
                <p className="text-xs text-gray-600">
                  {codPaymentImage ? (
                    <span className="text-green-600 font-medium">
                      ₹{ADVANCE_AMOUNT} advance payment confirmed ✓
                    </span>
                  ) : (
                    <span>₹{ADVANCE_AMOUNT} advance payment required for COD</span>
                  )}
                </p>
                <button
                  type="button"
                  onClick={() => openPaymentModal("cod")}
                  className="text-xs text-primary hover:underline shrink-0 ml-2"
                >
                  {codPaymentImage ? "Change" : "Pay now"}
                </button>
              </div>
            )}

            {paymentOption === "UPI" && (
              <div className="mt-2 flex items-center justify-between rounded border bg-white px-3 py-2">
                <p className="text-xs text-gray-600">
                  {upiPaymentImage ? (
                    <span className="text-green-600 font-medium">
                      ₹{finalTotal.toFixed(2)} payment confirmed ✓
                    </span>
                  ) : (
                    <span>₹{finalTotal.toFixed(2)} payment required via UPI</span>
                  )}
                </p>
                <button
                  type="button"
                  onClick={() => openPaymentModal("upi")}
                  className="text-xs text-primary hover:underline shrink-0 ml-2"
                >
                  {upiPaymentImage ? "Change" : "Pay now"}
                </button>
              </div>
            )}
          </div>
        </div>

        <hr className="my-6 border-gray-300" />

        <div className="space-y-2 text-gray-700">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>
              {currency}
              {totalAmount.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Shipping</span>
            <span className="text-green-600">Free</span>
          </div>
          <div className="flex justify-between">
            <span>Tax (2%)</span>
            <span>
              {currency}
              {taxAmount.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-lg font-semibold pt-3 border-t">
            <span>Total</span>
            <span>
              {currency}
              {finalTotal.toFixed(2)}
            </span>
          </div>
        </div>

        {(paymentOption === "COD" || paymentOption === "UPI") && (
          <button
            onClick={placeOrder}
            className="w-full py-3 mt-4 bg-primary text-white font-medium rounded cursor-pointer hover:bg-primary/80"
          >
            Place Order
          </button>
        )}

        {paymentOption === "Online" && (
          <PayNowButton
            merchantId={merchantId}
            addressId={selectedAddress?._id}
            items={cartArray.map((item) => ({
              productId: item._id,
              variantId: item.variant._id,
              size: item.selectedSize,
              quantity: item.quantity,
              price: item.originalPrice,
              offerPrice: item.offerPercentage,
            }))}
          />
        )}

        {!paymentOption && (
          <p className="mt-4 text-center text-xs text-gray-400">
            Select a payment method to continue
          </p>
        )}
      </div>

      <PaymentQrModal
        open={showPaymentModal}
        mode={modalMode}
        onClose={() => setShowPaymentModal(false)}
        onConfirm={handlePaymentConfirm}
        qrCodeImage={paymentConfig?.upi?.qrCodeImage}
        upiId={paymentConfig?.upi?.upiId}
        amount={modalMode === "upi" ? finalTotal.toFixed(2) : ADVANCE_AMOUNT}
      />
    </div>
  );
};

export default Cart;