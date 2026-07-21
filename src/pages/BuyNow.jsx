import { useEffect, useState } from "react";
import { useAppContext } from "../context/AppContext";
import { toast } from "react-toastify";
import { useLocation, useNavigate } from "react-router-dom";
import PayNowButton from "../components/PayNowButton";
import axios from "axios";
import { usePaymentConfig } from "../services/merchant";

const ADVANCE_AMOUNT = 200;

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
// Shared QR/UPI payment modal — used for BOTH:
//   - "cod"  mode: pay a small advance (ADVANCE_AMOUNT) to confirm a COD order
//   - "upi"  mode: pay the FULL order amount up front via UPI
// The only differences are the heading/copy and the amount shown; the
// upload + confirm mechanics are identical, so one component covers both.
// ---------------------------------------------------------------------------
const PaymentQrModal = ({
  open,
  mode, // "cod" | "upi"
  onClose,
  onConfirm,
  qrCodeImage,
  upiId,
  amount,
}) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!open) {
      setFile(null);
      setPreview("");
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
      toast.success("UPI ID copied");
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

  const title =
    mode === "upi" ? `Pay ₹${amount} via UPI` : `Pay ₹${amount} Advance for COD`;
  const description =
    mode === "upi"
      ? "Scan the QR code or pay to the UPI ID below to pay the full order amount, then upload your payment screenshot to place your order."
      : "Scan the QR code or pay to the UPI ID below, then upload your payment screenshot to confirm your Cash on Delivery order.";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-xl bg-white p-5 sm:p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="mt-1 text-sm text-gray-500">{description}</p>

        {qrCodeImage && (
          <div className="mt-4 flex justify-center">
            <img
              src={qrCodeImage}
              alt="Payment QR code"
              className="h-44 w-44 rounded border border-gray-200 object-contain bg-white"
            />
          </div>
        )}

        {upiId && (
          <div className="mt-3 flex items-center justify-center gap-2">
            <span className="text-sm font-medium text-gray-700">{upiId}</span>
            <button
              type="button"
              onClick={handleCopyUpi}
              className="text-xs text-primary hover:underline"
            >
              Copy
            </button>
          </div>
        )}

        <div className="mt-5 border-t pt-4">
          <label className="block text-xs font-medium text-gray-600 mb-2">
            Upload payment screenshot
          </label>

          <div className="flex items-center gap-3">
            {preview ? (
              <img
                src={preview}
                alt="Payment screenshot preview"
                className="h-16 w-16 rounded border border-gray-200 object-cover"
              />
            ) : (
              <div className="h-16 w-16 rounded border border-dashed border-gray-300 flex items-center justify-center text-[10px] text-gray-400 text-center px-1">
                No file
              </div>
            )}

            <label className="cursor-pointer text-sm font-medium text-primary hover:underline">
              {preview ? "Change screenshot" : "Choose screenshot"}
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 text-sm border rounded text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={uploading}
            className="flex-1 py-2.5 text-sm bg-primary text-white rounded font-medium hover:bg-primary-dull disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {uploading ? "Uploading…" : "Confirm Payment"}
          </button>
        </div>
      </div>
    </div>
  );
};

const BuyNow = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { products, currency, axios: ctxAxios, user, setShowUserLogin } =
    useAppContext();
  const merchantId = import.meta.env.VITE_MERCHANT_ID;

  const { data: paymentConfigData } = usePaymentConfig();
  const paymentConfig = paymentConfigData?.data;

  const [item, setItem] = useState(null);
  const [quantity, setQuantity] = useState(1);

  const [addresses, setAddresses] = useState([]);
  const [showAddress, setShowAddress] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [paymentOption, setPaymentOption] = useState(""); // "" | "COD" | "Online" | "UPI"

  /* ---------------- QR/UPI AVAILABILITY ---------------- */
  const upiAvailable = Boolean(paymentConfig?.upi?.enabled);
  const codAdvanceRequired = upiAvailable; // COD still needs the small advance
  const [modalMode, setModalMode] = useState(null); // "cod" | "upi" | null
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const [codPaymentImage, setCodPaymentImage] = useState(null); // ₹200 advance screenshot
  const [upiPaymentImage, setUpiPaymentImage] = useState(null); // full-amount screenshot

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

  /* ---------------- FETCH ADDRESS ---------------- */
  const getUserAddress = async () => {
    try {
      const { data } = await ctxAxios.get("/api/address/get");
      if (data.success) {
        setAddresses(data.addresses);
        if (data.addresses.length > 0) {
          setSelectedAddress(data.addresses[0]);
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  /* ---------------- TOTALS ---------------- */
  const subtotal = item.itemTotal;
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
      toast.info(`Please pay the ₹${ADVANCE_AMOUNT} advance and upload the screenshot`);
      openPaymentModal("cod");
      return;
    }

    if (paymentOption === "UPI" && !upiPaymentImage) {
      toast.info(`Please pay ₹${finalTotal.toFixed(2)} and upload the screenshot`);
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

        const { data } = await ctxAxios.post("/api/orders/upi", payload);

        if (data.success) {
          toast.success(data.message);
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
    <div className="flex flex-col lg:flex-row mt-10 lg:mt-16 gap-8 lg:gap-12 max-w-7xl mx-auto px-4 md:px-6">
      {/* PRODUCT */}
      <div className="flex-1">
        <h1 className="text-3xl font-medium mb-6">Buy Now</h1>

        <div className="flex flex-col sm:flex-row gap-6 border-b pb-6">
          <img
            src={item.displayImage}
            alt={item.name}
            className="w-28 h-28 sm:w-32 sm:h-32 lg:w-36 lg:h-36 border rounded object-cover"
          />

          <div className="flex-1">
            <p className="text-xl font-semibold">{item.name}</p>
            <p className="text-sm text-gray-600">Brand: {item.brand}</p>

            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm">Color:</span>
              <div
                className="w-5 h-5 rounded-full border"
                style={{ backgroundColor: item.variant.colorCode }}
              />
              <span className="text-sm">{item.variant.color}</span>
            </div>

            <p className="text-sm mt-1">
              Size: <span className="font-medium">{item.selectedSize}</span>
            </p>

            <div className="flex items-center gap-3 mt-4">
              <span className="text-sm font-medium">Qty:</span>
              <select
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="border px-2 py-1 rounded"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="text-left sm:text-right mt-4 sm:mt-0">
            <p className="text-sm text-gray-500 line-through">
              MRP: {currency}
              {(item.originalPrice * quantity).toFixed(2)}
            </p>

            <p className="text-2xl font-semibold">
              {currency}
              {subtotal.toFixed(2)}
            </p>

            {item.offerPercentage > 0 && (
              <p className="text-sm text-green-600">
                ({item.offerPercentage}% OFF)
              </p>
            )}

            <p className="text-xs text-gray-500 mt-1">
              (inclusive of all taxes)
            </p>
          </div>
        </div>
      </div>

      {/* SUMMARY */}
      <div className="w-full lg:w-[420px] bg-gray-50 p-5 sm:p-6 border rounded-lg">
        <h2 className="text-2xl font-medium mb-5">Order Summary</h2>

        {/* ADDRESS */}
        <div className="mb-6 relative">
          <p className="text-xs font-semibold text-gray-500 uppercase">
            Delivery Address
          </p>

          <div className="mt-2 p-3 bg-white border rounded flex justify-between">
            <p className="text-sm">
              {selectedAddress
                ? `${selectedAddress.street}, ${selectedAddress.city}, ${selectedAddress.state},${selectedAddress?.landmark ? selectedAddress?.landmark + "," : ""} ${selectedAddress.zipcode},
                  ${selectedAddress.phone}`
                : "No address selected"}
            </p>
            <button
              onClick={() => setShowAddress(!showAddress)}
              className="text-primary text-sm cursor-pointer"
            >
              Change
            </button>
          </div>

          {showAddress && (
            <div className="absolute z-10 bg-white border rounded shadow mt-2 w-full max-h-60 overflow-y-auto">
              {addresses.map((addr) => (
                <div
                  key={addr._id}
                  onClick={() => {
                    setSelectedAddress(addr);
                    setShowAddress(false);
                  }}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                >
                  {addr.street}, {addr.city},{addr.state},{addr?.landmark},{addr.zipcode},
                  {addr.phone}
                </div>
              ))}
              <div
                onClick={addressFun}
                className="border-t px-4 py-2 text-primary text-center cursor-pointer"
              >
                + Add new address
              </div>
            </div>
          )}
        </div>

        {/* PAYMENT */}
        <div className="mb-6">
          <p className="text-sm font-medium uppercase text-gray-600">
            Payment Method
          </p>
          <select
            value={paymentOption}
            onChange={(e) => handlePaymentOptionChange(e.target.value)}
            className="w-full mt-2 p-2 border rounded cursor-pointer"
          >
            <option value="" disabled>
              Select payment method
            </option>
            <option value="COD">Cash On Delivery (Partial Payment)</option>
            <option value="Online">Online Payment(razorpay)</option>
            {upiAvailable && <option value="UPI">UPI Payment (Pay & Upload)</option>}
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

        <hr className="my-4" />

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>
              {currency}
              {subtotal.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Shipping</span>
            <span className="text-green-600">Free</span>
          </div>
          {/* <div className="flex justify-between">
            <span>Tax (2%)</span>
            <span>
              {currency}
              {taxAmount.toFixed(2)}
            </span>
          </div> */}
          <div className="flex justify-between text-lg font-semibold border-t pt-3">
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
            className="w-full mt-6 py-3 text-base bg-primary text-white rounded font-medium hover:bg-primary-dull cursor-pointer hover:bg-primary/80"
          >
            Place Order
          </button>
        )}

        {paymentOption === "Online" && (
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
        )}

        {!paymentOption && (
          <p className="mt-6 text-center text-xs text-gray-400">
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

export default BuyNow;