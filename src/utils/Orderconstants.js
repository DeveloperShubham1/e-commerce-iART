import { Clock, PackageCheck, Truck, CheckCircle2 } from "lucide-react";

export const COURIER_LABELS = {
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

export const formatCourierName = (code) =>
  COURIER_LABELS[code] ||
  code?.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export const ORDER_STATUS_STYLES = {
  pending: "bg-gray-100 text-gray-700 ring-1 ring-gray-200",
  confirmed: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
  shipped: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  delivered: "bg-green-50 text-green-700 ring-1 ring-green-200",
  cancelled: "bg-red-50 text-red-700 ring-1 ring-red-200",
};

export const PAYMENT_STATUS_STYLES = {
  pending: "bg-gray-100 text-gray-700 ring-1 ring-gray-200",
  partial: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  paid: "bg-green-50 text-green-700 ring-1 ring-green-200",
  failed: "bg-red-50 text-red-700 ring-1 ring-red-200",
};

export const STEP_ICONS = {
  pending: Clock,
  confirmed: PackageCheck,
  shipped: Truck,
  delivered: CheckCircle2,
};

export const STATUS_STEPS = [
  { value: "pending", label: "Order Placed" },
  { value: "confirmed", label: "Confirmed" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
];

export const getCurrentStepIndex = (status) => {
  if (!status || status === "cancelled") return -1;
  return STATUS_STEPS.findIndex((step) => step.value === status.toLowerCase());
};

export const getStepDate = (order, stepValue) => {
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

export const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });