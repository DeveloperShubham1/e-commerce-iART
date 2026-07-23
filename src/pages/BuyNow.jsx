import { useEffect, useState } from "react";
import { useAppContext } from "../context/AppContext";
import { toast } from "react-toastify";
import { useLocation, useNavigate } from "react-router-dom";
import PayNowButton from "../components/PayNowButton";
import axios from "axios";
import { usePaymentConfigForUser } from "../services/user";
import {
  Check,
  ShieldCheck,
  MapPin,
  Plus,
  Truck,
  Copy,
  Upload,
  X,
  CreditCard,
  QrCode,
  Banknote,
  ChevronDown,
  Loader2,
  Sparkles,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Navigating to /add-address fully unmounts BuyNow, so local useState
// (quantity, paymentOption, selectedAddress, uploaded screenshots) would
// normally be lost when the user comes back via navigate(-1) — even though
// location.state (and therefore the product itself) survives that trip.
// We persist just the ephemeral selections to sessionStorage, keyed to this
// specific product/variant/size, and restore them on mount.
// ---------------------------------------------------------------------------
const getBuyNowStorageKey = (state) =>
  state?.productId
    ? `buyNowState:${state.productId}:${state.variantId}:${state.size}`
    : null;

const loadBuyNowState = (key) => {
  if (!key) return null;
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const saveBuyNowState = (key, state) => {
  if (!key) return;
  try {
    sessionStorage.setItem(key, JSON.stringify(state));
  } catch {
    // sessionStorage can fail in private-browsing/storage-full edge cases —
    // non-critical, the page just won't restore selections in that case
  }
};

const clearBuyNowState = (key) => {
  if (!key) return;
  try {
    sessionStorage.removeItem(key);
  } catch {
    // no-op
  }
};

// ---------------------------------------------------------------------------
// Uploads a single payment-screenshot file to your S3 endpoint and returns
// the public URL (not the presigned PUT signedUrl — that's only for upload).
// ---------------------------------------------------------------------------
const uploadSingleFile = async (file) => {
  const formData = new FormData();
  formData.append("images", file); // matches your /api/s3/upload field name
  const { data } = await axios.post("/api/s3/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  if (!data.success) throw new Error(data.message || "Upload failed");
  const uploaded = data.files?.[0];
  if (!uploaded?.url) throw new Error("Upload succeeded but no URL returned");
  return uploaded.url;
};

// ---------------------------------------------------------------------------
// Shared QR/UPI Payment Modal Component (visual design taken from the
// styled reference version — mechanics unchanged from the working logic)
// ---------------------------------------------------------------------------
const PaymentQrModal = ({
  open,
  mode,
  onClose,
  onConfirm,
  qrCodeImage,
  upiId,
  amount,
}) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) {
      setFile(null);
      setPreview("");
      setCopied(false);
    }
  }, [open]);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  if (!open) return null;

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      toast.error("Please upload an image of your payment screenshot");
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleCopyUpi = async () => {
    try {
      await navigator.clipboard.writeText(upiId);
      setCopied(true);
      toast.success("UPI ID copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard can fail silently on some browsers/permissions — not critical
    }
  };

  const handleConfirm = async () => {
    if (!file) {
      toast.error("Please upload your payment screenshot to continue");
      return;
    }
    setUploading(true);
    try {
      const url = await uploadSingleFile(file);
      onConfirm(url);
    } catch (err) {
      toast.error(err.message || "Failed to upload screenshot");
    } finally {
      setUploading(false);
    }
  };

  const isUpi = mode === "upi";
  const title = isUpi
    ? `Pay ₹${amount} via UPI`
    : `Pay ₹${amount} Advance for COD`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4 transition-all duration-300"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center pt-2 pb-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-3">
            <QrCode className="w-6 h-6 text-indigo-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">{title}</h3>
          <p className="mt-1.5 text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
            {isUpi
              ? "Scan the QR code or pay to the UPI ID below to pay the full order amount, then upload your receipt."
              : "Scan the QR code or pay to the UPI ID below to confirm your Cash on Delivery order."}
          </p>
        </div>

        {/* QR Code Card */}
        {qrCodeImage && (
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex flex-col items-center justify-center shadow-inner">
            <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-200">
              <img
                src={qrCodeImage}
                alt="Payment QR code"
                className="h-44 w-44 object-contain"
              />
            </div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mt-2">
              Scan with any UPI App
            </p>
          </div>
        )}

        {/* UPI ID Strip */}
        {upiId && (
          <div className="mt-3 bg-indigo-50/60 border border-indigo-100 rounded-xl p-2.5 flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-950 font-mono pl-2">
              {upiId}
            </span>
            <button
              type="button"
              onClick={handleCopyUpi}
              className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-indigo-200 rounded-lg text-xs font-semibold text-indigo-600 hover:bg-indigo-50 shadow-sm transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" /> Copied
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Copy
                </>
              )}
            </button>
          </div>
        )}

        {/* Screenshot Upload Zone */}
        <div className="mt-5 border-t border-slate-100 pt-4">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Upload Payment Screenshot
          </label>

          <div className="relative group">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              id="payment-screenshot"
              className="hidden"
            />
            <label
              htmlFor="payment-screenshot"
              className={`flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-xl cursor-pointer transition-all ${preview
                ? "border-emerald-400 bg-emerald-50/20"
                : "border-slate-200 hover:border-indigo-400 bg-slate-50/50 hover:bg-indigo-50/10"
                }`}
            >
              {preview ? (
                <div className="flex items-center gap-4 w-full">
                  <img
                    src={preview}
                    alt="Payment screenshot preview"
                    className="h-16 w-16 rounded-lg object-cover border border-slate-200 shadow-sm shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">
                      {file?.name || "Screenshot Attached"}
                    </p>
                    <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
                      <Check className="w-3 h-3" /> Ready to confirm
                    </p>
                    <span className="text-[11px] text-indigo-600 font-medium underline mt-1 inline-block">
                      Click to replace
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-2">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                    <Upload className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-slate-700">
                    Click to upload screenshot
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    PNG, JPG or JPEG (Max 5MB)
                  </p>
                </div>
              )}
            </label>
          </div>
        </div>

        {/* Modal Buttons */}
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 text-xs font-semibold border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={uploading}
            className="flex-1 py-3 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md shadow-indigo-600/20 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Uploading...
              </>
            ) : (
              "Confirm Payment"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const BuyNow = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    products,
    currency,
    axios: ctxAxios,
    user,
    setShowUserLogin,
  } = useAppContext();
  const merchantId = import.meta.env.VITE_MERCHANT_ID;

  const { data: paymentConfigData } = usePaymentConfigForUser(merchantId);
  const paymentConfig = paymentConfigData?.data;

  const [item, setItem] = useState(null);
  const [quantity, setQuantity] = useState(1);

  const [addresses, setAddresses] = useState([]);
  const [showAddress, setShowAddress] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [paymentOption, setPaymentOption] = useState(""); // "" | "COD" | "Online" | "UPI"

  const storageKey = getBuyNowStorageKey(location.state);
  const [hasRestored, setHasRestored] = useState(false);

  /* ---------------- QR/UPI AVAILABILITY ---------------- */
  const upiAvailable = Boolean(paymentConfig?.upi?.enabled);
  const codAvailable = Boolean(paymentConfig?.upi?.codEnabled);
  const razpayAvailable = Boolean(paymentConfig?.isRazorpayenabled);
  const ADVANCE_AMOUNT = Number(paymentConfig?.upi?.upiAdvancePayment) || 0;

  const codAdvanceRequired = upiAvailable; // COD still needs the small advance
  const [modalMode, setModalMode] = useState(null); // "cod" | "upi" | null
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const [codPaymentImage, setCodPaymentImage] = useState(null); // ₹200 advance screenshot
  const [upiPaymentImage, setUpiPaymentImage] = useState(null); // full-amount screenshot

  const openPaymentModal = (mode) => {
    setModalMode(mode);
    setShowPaymentModal(true);
  };

  const handlePaymentSelection = (value) => {
    if (!user) {
      toast.info("Please Login to select a payment option");
      setShowUserLogin(true);
      return;
    }

    handlePaymentOptionChange(value);
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

  // Restore quantity/paymentOption/screenshots after coming back from
  // /add-address (or any other remount) — runs once per storageKey.
  // (selectedAddressId is intentionally NOT restored here — it's read
  // directly from sessionStorage inside getUserAddress instead, once the
  // address list has actually loaded, to avoid a stale-closure race.)
  useEffect(() => {
    if (hasRestored) return;
    const saved = loadBuyNowState(storageKey);
    if (saved) {
      if (saved.quantity) setQuantity(saved.quantity);
      // if (saved.paymentOption) setPaymentOption(saved.paymentOption);
      if (user && saved.paymentOption) {
        setPaymentOption(saved.paymentOption);
      }
      if (saved.codPaymentImage) setCodPaymentImage(saved.codPaymentImage);
      if (saved.upiPaymentImage) setUpiPaymentImage(saved.upiPaymentImage);
    }
    setHasRestored(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  // Persist the ephemeral selections any time they change, so they survive
  // the round trip to /add-address and back.
  useEffect(() => {
    if (!hasRestored) return; // don't overwrite saved state with initial defaults before restore runs
    saveBuyNowState(storageKey, {
      quantity,
      paymentOption,
      codPaymentImage,
      upiPaymentImage,
      selectedAddressId: selectedAddress?._id || null,
    });
  }, [
    hasRestored,
    storageKey,
    quantity,
    paymentOption,
    codPaymentImage,
    upiPaymentImage,
    selectedAddress,
  ]);

  useEffect(() => {
    if (!user) {
      setPaymentOption("");
      setCodPaymentImage(null);
      setUpiPaymentImage(null);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    saveBuyNowState(storageKey, {
      quantity,
      paymentOption,
      codPaymentImage,
      upiPaymentImage,
      selectedAddressId: selectedAddress?._id || null,
    });
  }, [
    user,
    quantity,
    paymentOption,
    codPaymentImage,
    upiPaymentImage,
    selectedAddress,
  ]);

  /* ---------------- FETCH ADDRESS ---------------- */
  const getUserAddress = async () => {
    try {
      const { data } = await ctxAxios.get("/api/address/get");
      if (data.success) {
        setAddresses(data.addresses);
        if (data.addresses.length > 0) {
          // Prefer the address that was selected before navigating away to
          // /add-address (if it still exists); otherwise fall back to first.
          // Read directly from sessionStorage (not React state) so this
          // always sees the latest value even though getUserAddress is
          // async and could otherwise close over a stale render's state.
          const saved = loadBuyNowState(storageKey);
          const restored =
            saved?.selectedAddressId &&
            data.addresses.find((a) => a._id === saved.selectedAddressId);
          setSelectedAddress(restored || data.addresses[0]);
        }
      }
    } catch (err) {
      toast.error("Failed to fetch address");
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

  /* ---------------- BUILD ITEM (LIKE CART) ---------------- */
  useEffect(() => {
    if (!location.state?.productId) {
      toast.error("Invalid product");
      navigate("/products");
      return;
    }

    const { productId, variantId, size, qty = 1 } = location.state;

    const product = products.find((p) => p._id === productId);
    if (!product) return;

    const variant = product.variants.find((v) => v._id === variantId);
    if (!variant) return;

    const sizeObj = variant.sizes.find((s) => s.size === size);
    if (!sizeObj || sizeObj.stock === 0) {
      toast.error("Selected size out of stock");
      navigate("/products");
      return;
    }

    const discountedPrice =
      sizeObj.price - (sizeObj.price * sizeObj.offerPrice) / 100;

    setItem({
      ...product,
      variant,
      selectedSize: size,
      originalPrice: sizeObj.price,
      offerPercentage: sizeObj.offerPrice,
      discountedPrice,
      quantity: qty,
      itemTotal: discountedPrice * qty,
      displayImage: variant.images[0],
    });

    setQuantity(qty);
  }, [products, location.state, navigate]);

  /* ---------------- UPDATE TOTAL ON QTY CHANGE ---------------- */
  useEffect(() => {
    if (item) {
      setItem((prev) => ({
        ...prev,
        quantity,
        itemTotal: prev.discountedPrice * quantity,
      }));
    }
  }, [quantity]);

  useEffect(() => {
    if (user) getUserAddress();
  }, [user]);

  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <p className="text-xs font-semibold text-slate-400">
          Loading order details...
        </p>
      </div>
    );
  }

  /* ---------------- TOTALS ---------------- */
  const subtotal = item.itemTotal || item.originalPrice;
  const taxAmount = subtotal * 0.0;
  const finalTotal = subtotal + taxAmount;

  /* ---------------- PLACE ORDER ---------------- */
  const placeOrder = async () => {
    if (!user) {
      toast.info("Please login to place your order");
      setShowUserLogin(true);
      return;
    }

    if (!selectedAddress) {
      toast.info("Please select address");
      return;
    }

    if (!paymentOption) {
      toast.info("Please select a payment method");
      return;
    }

    if (paymentOption === "COD" && codAdvanceRequired && !codPaymentImage) {
      toast.info(
        `Please pay the ₹${ADVANCE_AMOUNT} advance and upload the screenshot`,
      );
      openPaymentModal("cod");
      return;
    }

    if (paymentOption === "UPI" && !upiPaymentImage) {
      toast.info(
        `Please pay ₹${finalTotal.toFixed(2)} and upload the screenshot`,
      );
      openPaymentModal("upi");
      return;
    }

    const orderItems = [
      {
        productId: item._id,
        variantId: item.variant._id,
        size: item.selectedSize,
        quantity: item.quantity,
        price: item.originalPrice,
        offerPrice: item.offerPercentage,
      },
    ];

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

        const { data } = await ctxAxios.post("/api/user/order/cod", payload);

        if (data.success) {
          toast.success(data.message);
          clearBuyNowState(storageKey);
          navigate("/my-orders", { state: { justPlaced: true } });
        } else {
          toast.error(data.message);
        }
      } else if (paymentOption === "UPI") {
        // ⚠️ Endpoint guessed to mirror /api/user/order/cod — confirm/adjust
        // to your real "paid via UPI screenshot" order route.
        const payload = {
          items: orderItems,
          address: selectedAddress._id,
          merchantId,
          paymentImage: [upiPaymentImage],
          amountPaid: finalTotal,
        };

        const { data } = await ctxAxios.post("/api/user/order/upi", payload);

        if (data.success) {
          toast.success(data.message);
          clearBuyNowState(storageKey);
          navigate("/my-orders", { state: { justPlaced: true } });
        } else {
          toast.error(data.message);
        }
      }
    } catch (err) {
      toast.error("Order failed");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 py-8 lg:py-14 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        {/* TOP BAR */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-5 mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight sm:text-3xl">
              Checkout Order
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Complete your payment to finalize your item purchase.
            </p>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-xs font-bold px-3 py-1.5 rounded-full border border-indigo-100">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Express
            Checkout
          </span>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
          {/* LEFT COLUMN: ITEM DETAILS */}
          <div className="flex-1 w-full space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row gap-6">
                {/* Image */}
                <div className="relative shrink-0 mx-auto sm:mx-0">
                  <img
                    src={item.displayImage}
                    alt={item.name}
                    className="w-32 h-32 sm:w-36 sm:h-36 rounded-xl object-cover border border-slate-100 shadow-inner"
                  />
                  {item.offerPercentage > 0 && (
                    <span className="absolute -top-2 -left-2 bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm">
                      {item.offerPercentage}% Off
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      {item.brand}
                    </span>
                    <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                      {item.name}
                    </h2>

                    {/* Variant badges */}
                    <div className="flex flex-wrap items-center gap-2.5 mt-3">
                      <div className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-700">
                        <span className="text-slate-400">Color:</span>
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-sm"
                          style={{ backgroundColor: item.variant.colorCode }}
                        />
                        <span>{item.variant.color}</span>
                      </div>

                      <div className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-700">
                        <span className="text-slate-400">Size:</span>
                        <span className="font-bold text-slate-900">
                          {item.selectedSize}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quantity & Subtotal Row */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <label
                        htmlFor="quantity"
                        className="text-xs font-medium text-slate-500"
                      >
                        Qty:
                      </label>
                      <div className="relative">
                        <select
                          id="quantity"
                          value={quantity}
                          onChange={(e) => setQuantity(Number(e.target.value))}
                          className="appearance-none bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-lg pl-3 pr-8 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                            <option key={n} value={n}>
                              {n}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    <div className="text-right">
                      {item.originalPrice * quantity > subtotal && (
                        <span className="text-xs text-slate-400 line-through mr-2">
                          {currency}
                          {(item.originalPrice * quantity).toFixed(2)}
                        </span>
                      )}
                      <span className="text-xl font-black text-slate-900">
                        {currency}
                        {subtotal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm">
                <Truck className="w-5 h-5 text-indigo-600 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    Fast Express Shipping
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Dispatched in 24 hrs
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    Buyer Protection
                  </p>
                  <p className="text-[11px] text-slate-400">Safe & Encrypted</p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: ORDER SUMMARY */}
          <div className="w-full lg:w-[420px] shrink-0">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm sticky top-6">
              <h2 className="text-lg font-bold text-slate-900 mb-5 flex items-center justify-between">
                Order Summary
                <span className="text-xs font-medium text-slate-400">
                  Inclusive of all taxes
                </span>
              </h2>

              {/* ADDRESS SECTION */}
              <div className="mb-6 relative">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" /> Delivery
                    Address
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAddress(!showAddress)}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors cursor-pointer"
                  >
                    {showAddress ? "Close" : "Change"}
                  </button>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl hover:border-slate-300 transition-colors">
                  {selectedAddress ? (
                    <div className="text-xs text-slate-700 leading-relaxed space-y-0.5">
                      <p className="font-semibold text-slate-900">
                        {selectedAddress.street}
                      </p>
                      <p>
                        {selectedAddress.city}, {selectedAddress.state} -{" "}
                        {selectedAddress.zipcode}
                      </p>
                      {selectedAddress?.landmark && (
                        <p className="text-slate-500">
                          Landmark: {selectedAddress.landmark}
                        </p>
                      )}
                      <p className="text-slate-500 font-medium pt-1">
                        Phone: {selectedAddress.phone}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">
                      No address selected
                    </p>
                  )}
                </div>

                {/* Dropdown Menu */}
                {showAddress && (
                  <div className="absolute z-20 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl mt-2 max-h-60 overflow-y-auto divide-y divide-slate-100">
                    {addresses.map((addr) => (
                      <div
                        key={addr._id}
                        onClick={() => {
                          setSelectedAddress(addr);
                          setShowAddress(false);
                        }}
                        className="p-3 hover:bg-slate-50 cursor-pointer text-xs text-slate-700 transition-colors"
                      >
                        <p className="font-semibold text-slate-900">
                          {addr.street}
                        </p>
                        <p>
                          {addr.city}, {addr.state}, {addr.zipcode}
                        </p>
                        <p className="text-slate-400">{addr.phone}</p>
                      </div>
                    ))}
                    <div
                      onClick={addressFun}
                      className="p-3 bg-slate-50/60 hover:bg-slate-100 text-indigo-600 font-bold text-xs text-center cursor-pointer flex items-center justify-center gap-1 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add New Address
                    </div>
                  </div>
                )}
              </div>

              {/* PAYMENT SELECTION */}
              <div className="mb-6">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Select Payment Option
                </span>

                <div className="space-y-2.5">
                  {/* Option: COD — gated by codAvailable, same as the select-based version */}
                  {codAvailable && (
                    <label
                      // onClick={() => handlePaymentSelection("COD")}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${paymentOption === "COD"
                        ? "border-indigo-600 bg-indigo-50/20 ring-1 ring-indigo-600"
                        : "border-slate-200/80 hover:border-slate-300 bg-white"
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <Banknote className="w-4 h-4 text-slate-600" />
                        <div>
                          <p className="text-xs font-bold text-slate-800">
                            Cash On Delivery
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {codAdvanceRequired
                              ? "Partial advance required"
                              : "Pay on delivery"}
                          </p>
                        </div>
                      </div>
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentOption === "COD"}
                        onChange={() => handlePaymentSelection("COD")}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                    </label>
                  )}

                  {/* Option: Razorpay — gated by razpayAvailable, same as the select-based version */}
                  {razpayAvailable && (
                    <label
                      // onClick={() => handlePaymentSelection("Online")}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${paymentOption === "Online"
                        ? "border-indigo-600 bg-indigo-50/20 ring-1 ring-indigo-600"
                        : "border-slate-200/80 hover:border-slate-300 bg-white"
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <CreditCard className="w-4 h-4 text-slate-600" />
                        <div>
                          <p className="text-xs font-bold text-slate-800">
                            Online Payment
                          </p>
                          <p className="text-[10px] text-slate-400">
                            Razorpay Cards, Netbanking
                          </p>
                        </div>
                      </div>
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentOption === "Online"}
                        onChange={() => handlePaymentSelection("Online")}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                    </label>
                  )}

                  {/* Option: UPI */}
                  {upiAvailable && (
                    <label
                      // onClick={() => handlePaymentSelection("UPI")}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${paymentOption === "UPI"
                        ? "border-indigo-600 bg-indigo-50/20 ring-1 ring-indigo-600"
                        : "border-slate-200/80 hover:border-slate-300 bg-white"
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <QrCode className="w-4 h-4 text-slate-600" />
                        <div>
                          <p className="text-xs font-bold text-slate-800">
                            UPI Payment
                          </p>
                          <p className="text-[10px] text-slate-400">
                            Pay via QR & Upload Screenshot
                          </p>
                        </div>
                      </div>
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentOption === "UPI"}
                        onChange={() => handlePaymentSelection("UPI")}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                    </label>
                  )}
                </div>

                {/* COD State Banner */}
                {paymentOption === "COD" && codAdvanceRequired && (
                  <div className="mt-3 p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl flex items-center justify-between">
                    <p className="text-xs text-amber-900 font-medium">
                      {codPaymentImage ? (
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> ₹{ADVANCE_AMOUNT}{" "}
                          Advance Received
                        </span>
                      ) : (
                        <span>
                          Advance deposit required:{" "}
                          <strong>₹{ADVANCE_AMOUNT}</strong>
                        </span>
                      )}
                    </p>
                    <button
                      type="button"
                      onClick={() => openPaymentModal("cod")}
                      className="text-xs font-bold text-amber-900 hover:underline shrink-0 ml-2"
                    >
                      {codPaymentImage ? "Change" : "Pay Now"}
                    </button>
                  </div>
                )}

                {/* UPI State Banner */}
                {paymentOption === "UPI" && (
                  <div className="mt-3 p-3 bg-indigo-50/80 border border-indigo-200/80 rounded-xl flex items-center justify-between">
                    <p className="text-xs text-indigo-900 font-medium">
                      {upiPaymentImage ? (
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> ₹
                          {finalTotal.toFixed(2)} Screenshot Uploaded
                        </span>
                      ) : (
                        <span>
                          UPI Amount: <strong>₹{finalTotal.toFixed(2)}</strong>
                        </span>
                      )}
                    </p>
                    <button
                      type="button"
                      onClick={() => openPaymentModal("upi")}
                      className="text-xs font-bold text-indigo-600 hover:underline shrink-0 ml-2"
                    >
                      {upiPaymentImage ? "Change" : "Pay Now"}
                    </button>
                  </div>
                )}
              </div>

              {/* SUMMARY BREAKDOWN */}
              <div className="space-y-3 pt-4 border-t border-slate-100 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-900">
                    {currency}
                    {subtotal.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Shipping Fee</span>
                  <span className="font-bold text-emerald-600 uppercase text-[10px] bg-emerald-50 px-2 py-0.5 rounded">
                    Free
                  </span>
                </div>

                <div className="flex justify-between text-sm font-bold text-slate-900 pt-3 border-t border-slate-200">
                  <span>Total Amount</span>
                  <span className="text-lg text-slate-900">
                    {currency}
                    {finalTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* ACTION BUTTON */}
              <div className="mt-6">
                {(paymentOption === "COD" || paymentOption === "UPI") && (
                  <button
                    onClick={placeOrder}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3.5 px-4 rounded-xl shadow-lg shadow-slate-900/10 active:scale-[0.99] transition-all cursor-pointer text-xs uppercase tracking-wider"
                  >
                    Place Order Now
                  </button>
                )}

                {paymentOption === "Online" && (
                  <div className="w-full">
                    <PayNowButton
                      merchantId={merchantId}
                      addressId={selectedAddress?._id}
                      items={[
                        {
                          productId: item._id,
                          variantId: item.variant._id,
                          size: item.selectedSize,
                          quantity: item.quantity,
                          price: item.originalPrice,
                          offerPrice: item.offerPercentage,
                        },
                      ]}
                    />
                  </div>
                )}

                {!paymentOption && (
                  <div className="text-center p-3 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <p className="text-xs text-slate-400 font-medium">
                      Select a payment option to continue
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PAYMENT MODAL */}
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

export default BuyNow;
