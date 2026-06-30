import { useEffect, useState } from "react";
import { useAppContext } from "../context/AppContext";
import { toast } from "react-toastify";
import { useLocation, useNavigate } from "react-router-dom";
import PayNowButton from "../components/PayNowButton";

const BuyNow = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { products, currency, axios, user, setShowUserLogin } = useAppContext();
  const merchantId = import.meta.env.VITE_MERCHANT_ID;

  const [item, setItem] = useState(null);
  const [quantity, setQuantity] = useState(1);

  const [addresses, setAddresses] = useState([]);
  const [showAddress, setShowAddress] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [paymentOption, setPaymentOption] = useState("COD");

  /* ---------------- FETCH ADDRESS ---------------- */
  const getUserAddress = async () => {
    try {
      const { data } = await axios.get("/api/address/get");
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
  const taxAmount = subtotal * 0.02;
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
        const { data } = await axios.post("/api/user/order/cod", {
          items: orderItems,
          address: selectedAddress._id,
          merchantId,
        });

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
                ? `${selectedAddress.street}, ${selectedAddress.city}, ${selectedAddress.state}, ${selectedAddress.zipcode},
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
                  {addr.street}, {addr.city},{addr.state},{addr.zipcode},
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
            onChange={(e) => setPaymentOption(e.target.value)}
            className="w-full mt-2 p-2 border rounded cursor-pointer"
          >
            <option value="COD">Cash On Delivery</option>
            <option value="Online">Online Payment</option>
          </select>
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
          <div className="flex justify-between">
            <span>Tax (2%)</span>
            <span>
              {currency}
              {taxAmount.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-lg font-semibold border-t pt-3">
            <span>Total</span>
            <span>
              {currency}
              {finalTotal.toFixed(2)}
            </span>
          </div>
        </div>

        {paymentOption === "COD" ? (
          <button
            onClick={placeOrder}
            className="w-full mt-6 py-3 text-base bg-primary text-white rounded font-medium hover:bg-primary-dull cursor-pointer hover:bg-primary/80"
          >
            Place Order
          </button>
        ) : (
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
      </div>
    </div>
  );
};

export default BuyNow;
