import React from "react";
import { ChevronRight, ImageOff } from "lucide-react";

import {
  ORDER_STATUS_STYLES,
  PAYMENT_STATUS_STYLES,
  formatDate,
} from "../utils/Orderconstants";

const Badge = ({ children, className = "" }) => (
  <span
    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${className}`}
  >
    {children}
  </span>
);


const OrderCard = ({ order, currency, onClick }) => {
  const pendingAmount =
    order.pendingAmount ??
    Math.max(order.totalAmount - (order.amountPaid || 0), 0);

  // Grab up to 3 item thumbnails for a quick visual preview
  const previewImages = order.items
    .map((item) => {
      const variant = item.productId?.variants?.find((v) =>
        v.sizes.some((s) => s.size === item.size)
      );
      return variant?.images?.[0];
    })
    .filter(Boolean)
    .slice(0, 3);

  return (
    <button
      type="button"
      onClick={() => onClick(order)}
      className="w-full text-left border border-gray-200 rounded-2xl mb-4 bg-white max-w-5xl mx-auto shadow-sm hover:shadow-md hover:border-gray-300 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
        <div className="flex items-center gap-4 min-w-0">
          {/* Thumbnail stack */}
          <div className="flex -space-x-3 shrink-0">
            {previewImages.length > 0 ? (
              previewImages.map((url, idx) => (
                <img
                  key={idx}
                  src={url}
                  alt=""
                  className="w-14 h-14 object-cover rounded-lg border-2 border-white shadow-sm"
                  style={{ zIndex: previewImages.length - idx }}
                />
              ))
            ) : (
              <div className="w-14 h-14 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center">
                <ImageOff className="w-5 h-5 text-gray-300" />
              </div>
            )}
          </div>

          <div className="min-w-0">
            <p className="text-sm text-gray-500 truncate">
              Order{" "}
              <span className="font-semibold text-gray-900">
                #{order.orderId}
              </span>
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              Placed on {formatDate(order.createdAt)}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {order.items.length} item{order.items.length === 1 ? "" : "s"} ·{" "}
              {currency}
              {order.totalAmount}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex flex-col items-end gap-1.5">
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
              {pendingAmount > 0 ? ` · ${currency}${pendingAmount} due` : ""}
            </Badge>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-300" />
        </div>
      </div>
    </button>
  );
};

export default OrderCard;