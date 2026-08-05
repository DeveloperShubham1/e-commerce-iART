import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  X,
  Truck,
  Copy,
  Check,
  PackageX,
  MapPin,
  Phone,
  ImageOff,
  CreditCard,
  ShoppingBag,
  ExternalLink,
  FileText,
  HelpCircle,
  Hash,
} from "lucide-react";
import { toast } from "react-toastify";
import {
  ORDER_STATUS_STYLES,
  PAYMENT_STATUS_STYLES,
  STATUS_STEPS,
  STEP_ICONS,
  getCurrentStepIndex,
  getStepDate,
  formatCourierName,
  formatDate,
} from "../utils/Orderconstants";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

const OrderDetailsModal = ({ order, currency, onClose, supportEmail }) => {
  const [copiedField, setCopiedField] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [visible, setVisible] = useState(false);

  const panelRef = useRef(null);
  const closeBtnRef = useRef(null);
  const previouslyFocused = useRef(null);

  // Mount animation + focus management + scroll lock
  useEffect(() => {
    previouslyFocused.current = document.activeElement;
    const raf = requestAnimationFrame(() => setVisible(true));
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeBtnRef.current?.focus();

    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = originalOverflow;
      previouslyFocused.current?.focus?.();
    };
  }, []);

  const Badge = ({ children, className = "" }) => (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${className}`}
    >
      {children}
    </span>
  );

  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(onClose, 150);
  }, [onClose]);

  // Escape to close + focus trap
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        handleClose();
        return;
      }
      if (e.key === "Tab" && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll(FOCUSABLE_SELECTOR);
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleClose]);

  if (!order) return null;

  const currentStepIdx = getCurrentStepIndex(order.orderStatus);
  const isCancelled = order.orderStatus === "cancelled";
  const isShippedOrLater =
    ["shipped", "delivered"].includes(order.orderStatus) &&
    (order.status || order.trackingPartner);
  const pendingAmount =
    order.pendingAmount ??
    Math.max(order.totalAmount - (order.amountPaid || 0), 0);
  const progressPercent =
    currentStepIdx <= 0 ? 0 : (currentStepIdx / (STATUS_STEPS.length - 1)) * 100;

  const handleCopy = async (text, fieldKey, label) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldKey);
      toast.success(`${label} copied`);
      setTimeout(
        () => setCopiedField((current) => (current === fieldKey ? null : current)),
        1800
      );
    } catch {
      toast.error("Couldn't copy — try selecting it manually");
    }
  };

  const addressLines = order.address
    ? [
      `${order.address.firstName} ${order.address.lastName}`,
      order.address.street,
      `${order.address.city}, ${order.address.state} ${order.address.zipcode}`,
      order.address.country,
    ]
      .filter(Boolean)
      .join("\n")
    : "";

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-[2px] transition-opacity duration-150 ${visible ? "opacity-100" : "opacity-0"
        }`}
      onClick={handleClose}
      role="presentation"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-details-heading"
        className={`bg-white w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[88vh] flex flex-col rounded-t-2xl sm:rounded-2xl shadow-xl relative transition-all duration-200 ${visible
          ? "translate-y-0 sm:scale-100 opacity-100"
          : "translate-y-4 sm:translate-y-0 sm:scale-95 opacity-0"
          }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ================= MODAL HEADER ================= */}
        <div className="shrink-0 bg-white flex items-start justify-between gap-4 px-5 sm:px-6 pt-5 pb-4 border-b border-gray-100 rounded-t-2xl">
          {/* mobile drag handle */}
          <div className="absolute left-1/2 -translate-x-1/2 top-2 w-10 h-1 rounded-full bg-gray-200 sm:hidden" />
          <div className="min-w-0 pt-1 sm:pt-0">
            <h2
              id="order-details-heading"
              className="text-base font-semibold text-gray-900 flex items-center gap-2 flex-wrap"
            >
              Order #{order.orderId}
              <button
                type="button"
                onClick={() => handleCopy(order.orderId, "orderId", "Order ID")}
                className="text-gray-400 hover:text-gray-700 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded p-0.5"
                aria-label="Copy order ID"
                title="Copy order ID"
              >
                {copiedField === "orderId" ? (
                  <Check className="w-3.5 h-3.5 text-green-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Placed on {formatDate(order.createdAt)}
            </p>
          </div>
          <button
            ref={closeBtnRef}
            onClick={handleClose}
            className="shrink-0 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition rounded-full p-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Close order details"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ================= SCROLLABLE BODY ================= */}
        <div className="overflow-y-auto px-5 sm:px-6 py-5 flex-1">
          {/* ================= STATUS BADGES ================= */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
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
              Payment: {order.paymentStatus}
            </Badge>
            <Badge className="bg-gray-900 text-white">
              {order.paymentType?.toUpperCase()}
            </Badge>
          </div>

          {/* ================= SHIPMENT / TRACKING INFO ================= */}
          {isShippedOrLater && (
            <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3.5 text-sm">
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
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
                      onClick={() =>
                        handleCopy(order.status, "tracking", "Tracking ID")
                      }
                      className="text-blue-600 hover:text-blue-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded"
                      title="Copy tracking ID"
                      aria-label="Copy tracking ID"
                    >
                      {copiedField === "tracking" ? (
                        <Check className="w-3.5 h-3.5 text-green-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </span>
                )}
              </div>
              {order.shipment?.courierLink && (
                <a
                  href={order.shipment.courierLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-primary font-medium hover:underline"
                >
                  Track shipment <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          )}

          {/* ================= TRACKING TIMELINE ================= */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-4 text-gray-900">
              Order Tracking
            </h3>

            {isCancelled ? (
              <div className="flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 px-5 py-4">
                <PackageX className="w-6 h-6 text-red-500 shrink-0" />
                <div>
                  <p className="font-semibold text-red-700">Order cancelled</p>
                  <p className="text-sm text-red-500/80 mt-0.5">
                    Cancelled on {formatDate(order.updatedAt || order.createdAt)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl p-5 sm:p-6 border border-gray-100">
                <div className="relative">
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
                    {STATUS_STEPS.map((step, idx) => {
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
                            <p className="text-xs text-gray-500 mt-0.5">{date}</p>
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

          {/* ================= PAYMENT SUMMARY (receipt style) ================= */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-3 text-gray-900 flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-gray-400" />
              Payment Summary
            </h3>
            <div className="rounded-xl border border-gray-100 overflow-hidden">
              <div className="divide-y divide-gray-100 text-sm">
                <div className="flex items-center justify-between px-5 py-3">
                  <span className="text-gray-500">Payment method</span>
                  <span className="font-medium text-gray-900 uppercase">
                    {order.paymentType}
                  </span>
                </div>
                <div className="flex items-center justify-between px-5 py-3">
                  <span className="text-gray-500">Order total</span>
                  <span className="font-medium text-gray-900">
                    {currency}
                    {order.totalAmount}
                  </span>
                </div>
                <div className="flex items-center justify-between px-5 py-3">
                  <span className="text-gray-500">Amount paid</span>
                  <span className="font-medium text-green-600">
                    {currency}
                    {order.amountPaid ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between px-5 py-3 bg-gray-50">
                  <span className="font-semibold text-gray-900">
                    {pendingAmount > 0 ? "Balance due" : "Balance"}
                  </span>
                  <span
                    className={`font-bold text-base ${pendingAmount > 0 ? "text-red-600" : "text-green-600"
                      }`}
                  >
                    {currency}
                    {pendingAmount}
                  </span>
                </div>
              </div>

              {order.paymentImage?.length > 0 && (
                <div className="px-5 py-4 border-t border-gray-100 bg-white">
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
          </div>

          {/* ================= ADDRESS ================= */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-3 text-gray-900 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-gray-400" />
              Shipping Address
            </h3>

            <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 flex items-start justify-between gap-3">
              {order.address ? (
                <>
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
                    <a
                      href={`tel:${order.address.phone}`}
                      className="mt-2 flex items-center gap-1.5 font-medium text-gray-900 hover:text-primary transition w-fit"
                    >
                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                      {order.address.phone}
                    </a>
                  </div>
                  {/* <button
                    type="button"
                    onClick={() =>
                      handleCopy(addressLines, "address", "Address")
                    }
                    className="shrink-0 text-gray-400 hover:text-gray-700 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded p-1"
                    aria-label="Copy shipping address"
                    title="Copy address"
                  >
                    {copiedField === "address" ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button> */}
                </>
              ) : (
                <div className="text-sm text-gray-500">
                  Shipping address is not available.
                </div>
              )}
            </div>
          </div>

          {/* ================= ITEMS ================= */}
          <div>
            <h3 className="text-sm font-semibold mb-2 text-gray-900 flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4 text-gray-400" />
              Order Items{" "}
              <span className="text-gray-400 font-normal text-sm">
                ({order.items.length})
              </span>
            </h3>

            <div className="rounded-xl border border-gray-100 overflow-hidden">
              {order.items.map((item, index) => {
                const variant = item.productId?.variants?.find((v) =>
                  v.sizes.some((s) => s.size === item.size)
                );

                const image = variant?.images?.[0];

                return (
                  <div
                    key={item._id}
                    className={`flex flex-col sm:flex-row justify-between gap-4 px-5 py-4 ${index !== order.items.length - 1
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
                          className="w-16 h-16 object-cover rounded-lg border border-gray-200 shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center shrink-0">
                          <ImageOff className="w-5 h-5 text-gray-300" />
                        </div>
                      )}
                      <div>
                        <h4 className="font-semibold text-gray-900 text-sm">
                          {item.productId?.name}
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Size: {item.size} · Qty: {item.quantity}
                        </p>
                        <p className="text-xs text-gray-500">
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
                      <p className="text-base font-bold text-primary">
                        {currency}
                        {item.price * item.quantity}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">Item total</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ================= STICKY FOOTER ================= */}
        <div className="shrink-0 border-t border-gray-100 px-5 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 bg-white rounded-b-2xl">
          {supportEmail ? (
            <a
              href={`mailto:${supportEmail}?subject=Question about order #${order.orderId}`}
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition"
            >
              <HelpCircle className="w-4 h-4" />
              Need help with this order?
            </a>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-2">
            {order.invoiceUrl && (
              <a
                href={order.invoiceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                <FileText className="w-4 h-4" />
                Invoice
              </a>
            )}
            {isShippedOrLater && order.shipment?.courierLink && (
              <a
                href={order.shipment.courierLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-primary text-white text-sm font-medium hover:opacity-90 transition"
              >
                <Truck className="w-4 h-4" />
                Track shipment
              </a>
            )}
          </div>
        </div>
      </div>

      {/* ================= SCREENSHOT VIEWER ================= */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4"
          onClick={(e) => {
            e.stopPropagation();
            setPreviewImage(null);
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setPreviewImage(null);
            }}
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

export default OrderDetailsModal;