import React, { useEffect, useState } from "react";
import { useAppContext } from "../context/AppContext";
import { useLocation } from "react-router-dom";
import { X, Truck, Copy } from "lucide-react";
import { toast } from "react-toastify";

// ---------------------------------------------------------------------------
// Courier code -> display label. Mirrors the merchant-side courierPartners
// list; kept minimal here since MyOrders only needs to *display* it.
// ---------------------------------------------------------------------------
const COURIER_LABELS = {
  delhivery: "Delhivery",
  xpressbees: "Xpressbees",
  blue_dart: "Blue Dart",
  india_post: "India Post",
  dtdc: "DTDC",
  ekart_logistics: "Ekart Logistics",
  ecom_express: "Ecom Express",
  shadowfax: "Shadowfax",
  amazon_shipping: "Amazon Shipping",
  india_post_speed_post: "India Post (Speed Post)",
  aramex: "Aramex",
  loadshare: "Loadshare",
  smartr_logistics: "Smartr Logistics",
  borzo: "Borzo",
  dunzo: "Dunzo",
  blitz: "Blitz",
  pidge: "Pidge",
  pick_n_del: "Pick N Del",
};

const formatCourierName = (code) =>
  COURIER_LABELS[code] ||
  code?.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

// ---------------------------------------------------------------------------
// Small badge helpers
// ---------------------------------------------------------------------------
const ORDER_STATUS_STYLES = {
  pending: "bg-gray-100 text-gray-700",
  confirmed: "bg-blue-100 text-blue-700",
  shipped: "bg-amber-100 text-amber-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

const PAYMENT_STATUS_STYLES = {
  pending: "bg-gray-100 text-gray-700",
  partial: "bg-amber-100 text-amber-700",
  paid: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
};

const Badge = ({ children, className = "" }) => (
  <span
    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${className}`}
  >
    {children}
  </span>
);

const MyOrders = () => {
  const { currency, axios, user } = useAppContext();

  const [myOrders, setMyOrders] = useState([]);
  const [loading, setLoading] = useState(true); // 🔑 single source of truth
  const [previewImage, setPreviewImage] = useState(null); // full-size screenshot viewer

  const location = useLocation();

  useEffect(() => {
    if (location.state?.justPlaced) {
      setLoading(true);
    }
  }, []);

  /* ================= FETCH ORDERS ================= */
  const fetchMyOrders = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("/api/user/orders");
      if (data.success) {
        setMyOrders(data.orders || []);
      } else {
        setMyOrders([]);
      }
    } catch (error) {
      console.error(error);
      setMyOrders([]);
    } finally {
      setLoading(false); // 🔑 loader stops ONLY after API completes
    }
  };

  useEffect(() => {
    if (user) {
      fetchMyOrders();
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleCopyTracking = async (trackingId) => {
    try {
      await navigator.clipboard.writeText(trackingId);
      toast.success("Tracking ID copied");
    } catch {
      // non-critical
    }
  };

  /* ================= ORDER TRACKING ================= */
  const statusSteps = [
    { value: "pending", label: "Pending" },
    { value: "confirmed", label: "Confirmed" },
    { value: "shipped", label: "Shipped" },
    { value: "delivered", label: "Delivered" },
  ];

  const getCurrentStepIndex = (status) => {
    if (!status || status === "cancelled") return -1;
    return statusSteps.findIndex((step) => step.value === status.toLowerCase());
  };

  const getStepDate = (order, stepValue) => {
    if (stepValue === "pending")
      return new Date(order.createdAt).toLocaleDateString("en-IN");
    if (stepValue === "shipped" && order.shippedAt)
      return new Date(order.shippedAt).toLocaleDateString("en-IN");
    if (stepValue === "delivered" && order.deliveredAt)
      return new Date(order.deliveredAt).toLocaleDateString("en-IN");
    return null;
  };

  /* ================= LOADER ================= */
  const LoadingSpinner = () => (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="w-12 h-12 border-4 border-gray-300 border-t-primary rounded-full animate-spin" />
      <p className="mt-4 text-sm text-gray-500">Loading your orders...</p>
    </div>
  );

  return (
    <div className="mt-16 pb-16">
      {/* ================= HEADER ================= */}
      <div className="flex flex-col items-end w-max mb-8">
        <p className="text-2xl font-medium uppercase">My Orders</p>
        <div className="w-16 h-0.5 bg-primary rounded-full"></div>
      </div>

      {/* ================= STATES ================= */}
      {loading ? (
        <LoadingSpinner />
      ) : myOrders.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-gray-400 text-6xl mb-4">No orders found</div>
          <p className="text-gray-600">
            You haven&apos;t placed any orders yet.
          </p>
        </div>
      ) : (
        myOrders.map((order) => {
          const currentStepIdx = getCurrentStepIndex(order.orderStatus);
          const isCancelled = order.orderStatus === "cancelled";
          const isShippedOrLater =
            ["shipped", "delivered"].includes(order.orderStatus) &&
            (order.status || order.trackingPartner);
          const pendingAmount =
            order.pendingAmount ??
            Math.max(order.totalAmount - (order.amountPaid || 0), 0);

          return (
            <div
              key={order._id}
              className="border border-gray-200 rounded-xl mb-10 p-6 bg-white max-w-5xl w-full mx-auto shadow-sm hover:shadow-md transition"
            >
              {/* ================= ORDER HEADER ================= */}
              <div className="flex flex-wrap items-start justify-between gap-4 border-b pb-4 mb-6">
                <div>
                  <p className="text-sm text-gray-500">
                    Order ID{" "}
                    <span className="font-semibold text-gray-800">
                      {order.orderId}
                    </span>
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Placed on{" "}
                    {new Date(order.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    className={
                      ORDER_STATUS_STYLES[order.orderStatus] ||
                      "bg-gray-100 text-gray-700"
                    }
                  >
                    {order.orderStatus}
                  </Badge>
                  <Badge
                    className={
                      PAYMENT_STATUS_STYLES[order.paymentStatus] ||
                      "bg-gray-100 text-gray-700"
                    }
                  >
                    {order.paymentStatus}
                  </Badge>
                  <Badge className="bg-gray-900 text-white">
                    {order.paymentType?.toUpperCase()}
                  </Badge>
                </div>
              </div>

              {/* ================= PAYMENT SUMMARY ================= */}
              <div className="mb-8 bg-gray-50 rounded-lg border p-5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Total</p>
                    <p className="font-semibold text-base">
                      {currency}
                      {order.totalAmount}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Paid</p>
                    <p className="font-semibold text-base text-green-600">
                      {currency}
                      {order.amountPaid ?? 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Pending</p>
                    <p
                      className={`font-semibold text-base ${pendingAmount > 0 ? "text-red-600" : "text-green-600"
                        }`}
                    >
                      {currency}
                      {pendingAmount}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Payment Method</p>
                    <p className="font-semibold text-base uppercase">
                      {order.paymentType}
                    </p>
                  </div>
                </div>

                {order.paymentImage?.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs text-gray-500 mb-2">
                      Payment Screenshot
                      {order.paymentImage.length > 1 ? "s" : ""} submitted
                    </p>
                    <div className="flex gap-3">
                      {order.paymentImage.map((url, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setPreviewImage(url)}
                        >
                          <img
                            src={url}
                            alt={`Payment proof ${idx + 1}`}
                            className="h-16 w-16 object-cover rounded border hover:opacity-80 transition"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* ================= SHIPMENT / TRACKING INFO ================= */}
              {isShippedOrLater && (
                <div className="mb-6 flex flex-wrap items-center gap-3 rounded-lg border bg-blue-50 px-4 py-3 text-sm">
                  <Truck className="w-4 h-4 text-blue-600 shrink-0" />
                  {order.trackingPartner && (
                    <span>
                      <span className="text-gray-500">Courier:</span>{" "}
                      <span className="font-semibold text-gray-800">
                        {formatCourierName(order.trackingPartner)}
                      </span>
                    </span>
                  )}
                  {order.status && (
                    <span className="flex items-center gap-1">
                      <span className="text-gray-500">Tracking ID:</span>{" "}
                      <span className="font-semibold text-gray-800">
                        {order.status}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyTracking(order.status)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Copy tracking ID"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  )}
                  {order.shipment?.courierLink && (
                    <a
                      href={order.shipment.courierLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto text-primary font-medium hover:underline"
                    >
                      Track Shipment →
                    </a>
                  )}
                </div>
              )}

              {/* ================= TRACKING ================= */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-6">Order Tracking</h3>

                {isCancelled ? (
                  <div className="text-center py-8">
                    <p className="text-2xl font-bold text-red-600">
                      Order Cancelled
                    </p>
                    <p className="text-gray-500 mt-2">
                      Cancelled on{" "}
                      {new Date(
                        order.updatedAt || order.createdAt
                      ).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-xl p-6 border">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                      {statusSteps.map((step, idx) => {
                        const isCompleted = idx < currentStepIdx;
                        const isActive = idx === currentStepIdx;
                        const date = isCompleted
                          ? getStepDate(order, step.value)
                          : null;

                        return (
                          <div
                            key={step.value}
                            className="flex flex-col items-center text-center"
                          >
                            <div
                              className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold shadow-md ${isCompleted
                                  ? "bg-green-500 text-white"
                                  : isActive
                                    ? "bg-amber-400 text-white"
                                    : "bg-gray-300 text-gray-600"
                                }`}
                            >
                              {isCompleted ? "✓" : idx + 1}
                            </div>

                            <p className="mt-4 text-sm font-semibold">
                              {step.label}
                            </p>

                            {date && (
                              <p className="text-xs text-gray-500 mt-1">
                                {date}
                              </p>
                            )}

                            {isActive && (
                              <p className="text-xs mt-2 text-amber-600 font-medium">
                                Current Status
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* ================= ADDRESS ================= */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">Shipping Address</h3>
                <div className="bg-gray-50 p-5 rounded-lg border">
                  <p className="font-medium">
                    {order.address.firstName} {order.address.lastName}
                  </p>
                  <p>{order.address.street}</p>
                  <p>
                    {order.address.city}, {order.address.state}{" "}
                    {order.address.zipcode}
                  </p>
                  <p>{order.address.country}</p>
                  <p className="mt-2 font-medium">
                    Phone: {order.address.phone}
                  </p>
                </div>
              </div>

              {/* ================= ITEMS ================= */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Order Items</h3>

                {order.items.map((item, index) => {
                  const variant = item.productId?.variants?.find((v) =>
                    v.sizes.some((s) => s.size === item.size)
                  );

                  const image = variant?.images?.[0] || "/no-image.png";

                  return (
                    <div
                      key={item._id}
                      className={`flex flex-col md:flex-row justify-between gap-6 py-6 ${index !== order.items.length - 1 ? "border-b" : ""
                        }`}
                    >
                      <div className="flex gap-5">
                        <img
                          src={image}
                          alt={item.productId?.name}
                          className="w-24 h-24 object-cover rounded border"
                        />
                        <div>
                          <h4 className="font-semibold">
                            {item.productId?.name}
                          </h4>
                          <p className="text-sm text-gray-500">
                            Size: {item.size} | Qty: {item.quantity}
                          </p>
                          <p className="text-sm">Color: {item.color || "—"}</p>
                          {item.discountPercent > 0 && (
                            <p className="text-xs text-green-600 mt-0.5">
                              {item.discountPercent}% OFF (MRP {currency}
                              {item.mrp})
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-xl font-bold text-primary">
                          {currency}
                          {item.price * item.quantity}
                        </p>
                        <p className="text-sm text-gray-500">Item Total</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}

      {/* ================= SCREENSHOT VIEWER ================= */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setPreviewImage(null)}
        >
          <button
            onClick={() => setPreviewImage(null)}
            className="absolute top-5 right-5 text-white"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={previewImage}
            alt="Payment proof full size"
            className="max-h-[85vh] max-w-full rounded shadow-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default MyOrders;