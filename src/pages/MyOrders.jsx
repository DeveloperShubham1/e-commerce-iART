import React, { useState } from "react";
import { useAppContext } from "../context/AppContext";
import {
  X,
  Truck,
  Copy,
  Check,
  Clock,
  PackageCheck,
  PackageX,
  CheckCircle2,
  MapPin,
  Phone,
  ImageOff,
  ShoppingBag,
} from "lucide-react";
import { toast } from "react-toastify";
import { useUserOrders } from "../services/user";
import Pagination from "../components/Pagination";
import { useNavigate } from "react-router-dom";

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

const ORDER_STATUS_STYLES = {
  pending: "bg-gray-100 text-gray-700 ring-1 ring-gray-200",
  confirmed: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
  shipped: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  delivered: "bg-green-50 text-green-700 ring-1 ring-green-200",
  cancelled: "bg-red-50 text-red-700 ring-1 ring-red-200",
};

const PAYMENT_STATUS_STYLES = {
  pending: "bg-gray-100 text-gray-700 ring-1 ring-gray-200",
  partial: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  paid: "bg-green-50 text-green-700 ring-1 ring-green-200",
  failed: "bg-red-50 text-red-700 ring-1 ring-red-200",
};

const STEP_ICONS = {
  pending: Clock,
  confirmed: PackageCheck,
  shipped: Truck,
  delivered: CheckCircle2,
};

const Badge = ({ children, className = "" }) => (
  <span
    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${className}`}
  >
    {children}
  </span>
);

/* ================= SKELETON CARD ================= */
const OrderSkeleton = () => (
  <div className="max-w-5xl w-full mx-auto mb-8 rounded-xl border border-gray-200 bg-white p-6 animate-pulse">
    <div className="flex justify-between mb-6">
      <div className="space-y-2">
        <div className="h-3 w-32 bg-gray-200 rounded" />
        <div className="h-2.5 w-24 bg-gray-100 rounded" />
      </div>
      <div className="h-6 w-20 bg-gray-200 rounded-full" />
    </div>
    <div className="h-20 bg-gray-100 rounded-lg mb-6" />
    <div className="grid grid-cols-4 gap-6">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-gray-200" />
          <div className="h-2.5 w-14 bg-gray-100 rounded" />
        </div>
      ))}
    </div>
  </div>
);

const MyOrders = () => {
  const { currency, user } = useAppContext();
  const navigate = useNavigate();

  const [previewImage, setPreviewImage] = useState(null);
  const [page, setPage] = useState(1);
  const [copiedId, setCopiedId] = useState(null);

  const { data, isLoading } = useUserOrders(page, 2);

  const orders = data?.orders || [];
  const pagination = data?.pagination;

  const handleCopyTracking = async (trackingId) => {
    try {
      await navigator.clipboard.writeText(trackingId);
      setCopiedId(trackingId);
      toast.success("Tracking ID copied");
      setTimeout(() => setCopiedId((current) => (current === trackingId ? null : current)), 1800);
    } catch {
      toast.error("Couldn't copy — try selecting it manually");
    }
  };

  /* ================= ORDER TRACKING ================= */
  const statusSteps = [
    { value: "pending", label: "Order Placed" },
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
      return new Date(order.createdAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      });
    if (stepValue === "shipped" && order.shippedAt)
      return new Date(order.shippedAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      });
    if (stepValue === "delivered" && order.deliveredAt)
      return new Date(order.deliveredAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      });
    return null;
  };

  return (
    <div className="mt-16 pb-16 max-w-7xl mx-auto px-4 sm:px-6">
      {/* ================= HEADER ================= */}
      <div className="mb-10">
        <p className="text-2xl font-semibold tracking-tight">My Orders</p>
        <div className="w-16 h-0.5 bg-primary rounded-full mt-2" />
        {!isLoading && orders.length > 0 && (
          <p className="text-sm text-gray-500 mt-3">
            {pagination?.total ?? orders.length} order
            {(pagination?.total ?? orders.length) === 1 ? "" : "s"} on record
          </p>
        )}
      </div>

      {/* ================= STATES ================= */}
      {isLoading ? (
        <>
          <OrderSkeleton />
          <OrderSkeleton />
        </>
      ) : orders.length === 0 ? (
        <div className="text-center py-24 max-w-lg mx-auto">
          <div className="w-16 h-16 mx-auto rounded-full bg-gray-100 flex items-center justify-center mb-5">
            <ShoppingBag className="w-7 h-7 text-gray-400" strokeWidth={1.5} />
          </div>
          <p className="text-lg font-semibold text-gray-900">No orders yet</p>
          <p className="text-sm text-gray-500 mt-1.5">
            Once you place an order, you'll be able to track its progress here.
          </p>
          <a
            onClick={() => navigate("/products")}
            className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 cursor-pointer rounded-full bg-primary text-white text-sm font-medium hover:opacity-90 transition"
          >
            Start shopping
          </a>
        </div>
      ) : (
        <>
          {orders.map((order) => {
            const currentStepIdx = getCurrentStepIndex(order.orderStatus);
            const isCancelled = order.orderStatus === "cancelled";
            const isShippedOrLater =
              ["shipped", "delivered"].includes(order.orderStatus) &&
              (order.status || order.trackingPartner);
            const pendingAmount =
              order.pendingAmount ??
              Math.max(order.totalAmount - (order.amountPaid || 0), 0);
            const progressPercent =
              currentStepIdx <= 0
                ? 0
                : (currentStepIdx / (statusSteps.length - 1)) * 100;

            return (
              <div
                key={order._id}
                className="border border-gray-200 rounded-2xl mb-8 bg-white max-w-7xl w-full mx-auto shadow-sm hover:shadow-md transition-shadow"
              >
                {/* ================= ORDER HEADER ================= */}
                <div className="flex flex-wrap items-start justify-between gap-4 px-6 pt-6 pb-4 border-b border-gray-100">
                  <div>
                    <p className="text-sm text-gray-500">
                      Order{" "}
                      <span className="font-semibold text-gray-900">
                        #{order.orderId}
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

                  <div className="flex flex-wrap items-start gap-3">
                    <div className="flex flex-col items-start gap-1">
                      <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
                        Order
                      </span>
                      <Badge
                        className={
                          ORDER_STATUS_STYLES[order.orderStatus] ||
                          "bg-gray-100 text-gray-700"
                        }
                      >
                        {order.orderStatus}
                      </Badge>
                    </div>

                    <div className="flex flex-col items-start gap-1">
                      <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
                        Payment
                      </span>
                      <Badge
                        className={
                          PAYMENT_STATUS_STYLES[order.paymentStatus] ||
                          "bg-gray-100 text-gray-700"
                        }
                      >
                        {order.paymentStatus}
                      </Badge>
                    </div>

                    <div className="flex flex-col items-start gap-1">
                      <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
                        Method
                      </span>
                      <Badge className="bg-gray-900 text-white">
                        {order.paymentType?.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="px-6 pt-6">
                  {/* ================= PAYMENT SUMMARY ================= */}
                  <div className="mb-6 bg-gray-50 rounded-xl border border-gray-100 p-5">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 text-sm">
                      <div>
                        <p className="text-gray-500">Total</p>
                        <p className="font-semibold text-base mt-0.5">
                          {currency}
                          {order.totalAmount}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Paid</p>
                        <p className="font-semibold text-base text-green-600 mt-0.5">
                          {currency}
                          {order.amountPaid ?? 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Pending</p>
                        <p
                          className={`font-semibold text-base mt-0.5 ${pendingAmount > 0 ? "text-red-600" : "text-green-600"
                            }`}
                        >
                          {currency}
                          {pendingAmount}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Payment Method</p>
                        <p className="font-semibold text-base uppercase mt-0.5">
                          {order.paymentType}
                        </p>
                      </div>
                    </div>

                    {order.paymentImage?.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-xs text-gray-500 mb-2">
                          Payment screenshot
                          {order.paymentImage.length > 1 ? "s" : ""} submitted
                        </p>
                        <div className="flex gap-3">
                          {order.paymentImage.map((url, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setPreviewImage(url)}
                              className="rounded-lg overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                              aria-label={`View payment screenshot ${idx + 1} full size`}
                            >
                              <img
                                src={url}
                                alt={`Payment proof ${idx + 1}`}
                                className="h-16 w-16 object-cover rounded-lg border border-gray-200 hover:opacity-80 transition"
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ================= SHIPMENT / TRACKING INFO ================= */}
                  {isShippedOrLater && (
                    <div className="mb-6 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3.5 text-sm">
                      <div className="flex items-center gap-2 text-blue-700">
                        <Truck className="w-4 h-4 shrink-0" />
                        <span className="font-medium">On the way</span>
                      </div>
                      {order.trackingPartner && (
                        <span>
                          <span className="text-gray-500">Courier:</span>{" "}
                          <span className="font-semibold text-gray-800">
                            {formatCourierName(order.trackingPartner)}
                          </span>
                        </span>
                      )}
                      {order.status && (
                        <span className="flex items-center gap-1.5">
                          <span className="text-gray-500">Tracking ID:</span>
                          <span className="font-semibold text-gray-800">
                            {order.status}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyTracking(order.status)}
                            className="text-blue-600 hover:text-blue-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded"
                            title="Copy tracking ID"
                            aria-label="Copy tracking ID"
                          >
                            {copiedId === order.status ? (
                              <Check className="w-3.5 h-3.5 text-green-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
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
                          Track shipment →
                        </a>
                      )}
                    </div>
                  )}

                  {/* ================= TRACKING ================= */}
                  <div className="mb-6">
                    <h3 className="text-base font-semibold mb-5 text-gray-900">
                      Order Tracking
                    </h3>

                    {isCancelled ? (
                      <div className="flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 px-5 py-4">
                        <PackageX className="w-6 h-6 text-red-500 shrink-0" />
                        <div>
                          <p className="font-semibold text-red-700">
                            Order cancelled
                          </p>
                          <p className="text-sm text-red-500/80 mt-0.5">
                            Cancelled on{" "}
                            {new Date(
                              order.updatedAt || order.createdAt
                            ).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                        <div className="relative">
                          {/* connecting line */}
                          <div className="absolute top-6 left-6 right-6 h-0.5 bg-gray-200" />
                          <div
                            className="absolute top-6 left-6 h-0.5 bg-green-500 transition-all duration-500"
                            style={{
                              width: `calc(${progressPercent}% - ${progressPercent > 0 ? "3rem" : "0px"
                                })`,
                              maxWidth: "calc(100% - 3rem)",
                            }}
                          />

                          <div className="relative grid grid-cols-2 sm:grid-cols-4 gap-y-8">
                            {statusSteps.map((step, idx) => {
                              const isCompleted = idx < currentStepIdx;
                              const isActive = idx === currentStepIdx;
                              const date = isCompleted
                                ? getStepDate(order, step.value)
                                : null;
                              const StepIcon = STEP_ICONS[step.value];

                              return (
                                <div
                                  key={step.value}
                                  className="flex flex-col items-center text-center"
                                >
                                  <div
                                    className={`w-12 h-12 rounded-full flex items-center justify-center shadow-sm ring-4 ring-gray-50 transition-colors ${isCompleted
                                      ? "bg-green-500 text-white"
                                      : isActive
                                        ? "bg-amber-400 text-white animate-pulse"
                                        : "bg-gray-200 text-gray-500"
                                      }`}
                                  >
                                    <StepIcon className="w-5 h-5" strokeWidth={2} />
                                  </div>

                                  <p
                                    className={`mt-3 text-sm font-medium ${isCompleted || isActive
                                      ? "text-gray-900"
                                      : "text-gray-400"
                                      }`}
                                  >
                                    {step.label}
                                  </p>

                                  {date && (
                                    <p className="text-xs text-gray-500 mt-0.5">
                                      {date}
                                    </p>
                                  )}

                                  {isActive && (
                                    <p className="text-xs mt-1 text-amber-600 font-medium">
                                      In progress
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ================= ADDRESS ================= */}
                  <div className="mb-6">
                    <h3 className="text-base font-semibold mb-3 text-gray-900">
                      Shipping Address
                    </h3>

                    <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 flex gap-3">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />

                      {order.address ? (
                        <div className="text-sm text-gray-700 leading-relaxed">
                          <p className="font-medium text-gray-900">
                            {order.address.firstName} {order.address.lastName}
                          </p>

                          <p>{order.address.street}</p>

                          <p>
                            {order.address.city}, {order.address.state}{" "}
                            {order.address.zipcode}
                          </p>

                          <p>{order.address.country}</p>

                          <p className="mt-2 flex items-center gap-1.5 font-medium text-gray-900">
                            <Phone className="w-3.5 h-3.5 text-gray-400" />
                            {order.address.phone}
                          </p>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500 italic">
                          Shipping address is not available.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ================= ITEMS ================= */}
                  <div>
                    <h3 className="text-base font-semibold mb-2 text-gray-900">
                      Order Items{" "}
                      <span className="text-gray-400 font-normal text-sm">
                        ({order.items.length})
                      </span>
                    </h3>

                    {order.items.map((item, index) => {
                      const variant = item.productId?.variants?.find((v) =>
                        v.sizes.some((s) => s.size === item.size)
                      );

                      const image = variant?.images?.[0];

                      return (
                        <div
                          key={item._id}
                          className={`flex flex-col sm:flex-row justify-between gap-4 py-5 ${index !== order.items.length - 1
                            ? "border-b border-gray-100"
                            : ""
                            }`}
                        >
                          <div className="flex gap-4">
                            {image ? (
                              <img
                                src={image}
                                alt={`${item.productId?.name || "Product"}${item.color ? `, ${item.color}` : ""
                                  }, size ${item.size}`}
                                className="w-20 h-20 object-cover rounded-lg border border-gray-200 shrink-0"
                              />
                            ) : (
                              <div className="w-20 h-20 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center shrink-0">
                                <ImageOff className="w-5 h-5 text-gray-300" />
                              </div>
                            )}
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                {item.productId?.name}
                              </h4>
                              <p className="text-sm text-gray-500 mt-0.5">
                                Size: {item.size} · Qty: {item.quantity}
                              </p>
                              <p className="text-sm text-gray-500">
                                Color: {item.color || "—"}
                              </p>
                              {item.discountPercent > 0 && (
                                <p className="text-xs text-green-600 mt-1 font-medium">
                                  {item.discountPercent}% off · MRP {currency}
                                  {item.mrp}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <p className="text-lg font-bold text-primary">
                              {currency}
                              {item.price * item.quantity}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              Item total
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="h-6" />
              </div>
            );
          })}
          <Pagination pagination={pagination} onPageChange={(p) => setPage(p)} />
        </>
      )}

      {/* ================= SCREENSHOT VIEWER ================= */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setPreviewImage(null)}
        >
          <button
            onClick={() => setPreviewImage(null)}
            className="absolute top-5 right-5 text-white hover:text-gray-300 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white rounded-full p-1"
            aria-label="Close preview"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={previewImage}
            alt="Payment proof full size"
            className="max-h-[85vh] max-w-full rounded-lg shadow-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default MyOrders;