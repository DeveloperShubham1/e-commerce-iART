// whatsappTemplates.js
// Merchant name is pulled from config/env so every message is on-brand.
// Fallback keeps things working even if it's not set anywhere yet.
import { courierPartners } from "../assets/trackingPartners";

const DEFAULT_MERCHANT_NAME = "Your Store";

function getTrackingPartnerLabel(partnerKey) {
  if (!partnerKey) return "N/A";
  const found = courierPartners.find((partner) => partner.value === partnerKey);
  if (found) return found.label;
  return partnerKey
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export const whatsappTemplates = {
  generic: ({ name, orderId, merchantName = DEFAULT_MERCHANT_NAME }) =>
    `Hello ${name},\n\n` +
    `Your order ${orderId} has been updated.\n` +
    `Please check the latest status in your account.\n\n` +
    `Thank you for shopping with us!\n` +
    `${merchantName}`,

  paymentUpdate: ({
    name,
    orderId,
    paymentStatus,
    amountPaid,
    pendingAmount,
    currency,
    merchantName = DEFAULT_MERCHANT_NAME,
  }) =>
    `Hello ${name},\n\n` +
    `Payment update on your order ${orderId}!\n\n` +
    `Payment Status: *${paymentStatus.toUpperCase()}*\n` +
    `Amount Paid: ${currency}${amountPaid}\n` +
    `Pending Amount: ${currency}${pendingAmount}\n\n` +
    `Thank you for shopping with us!\n` +
    `${merchantName}`,

  orderUpdate: ({ name, orderId, orderStatus, merchantName = DEFAULT_MERCHANT_NAME }) =>
    `Hello ${name},\n\n` +
    `Update on your order ${orderId}!\n\n` +
    `Order Status: *${orderStatus.toUpperCase()}*\n\n` +
    `Thank you for shopping with us!\n` +
    `${merchantName}`,

  partialShippedUpdate: ({
    name,
    orderId,
    trackingPartner,
    trackingId,
    merchantName = DEFAULT_MERCHANT_NAME,
  }) =>
    `Hello ${name},\n\n` +
    `We’re pleased to inform you that a part of your order ${orderId} has been shipped via ${trackingPartner} and is now on its way to you.\n` +
    `Tracking ID: ${trackingId}\n\n` +
    `Thank you for shopping with us!\n` +
    `${merchantName}`,

  shippedUpdate: ({
    name,
    orderId,
    trackingPartner,
    trackingId,
    merchantName = DEFAULT_MERCHANT_NAME,
  }) =>
    `Hello ${name},\n\n` +
    `Good news — your order ${orderId} has been shipped via ${trackingPartner}.\n` +
    `Tracking ID: ${trackingId}\n\n` +
    `Thank you for shopping with us!\n` +
    `${merchantName}`,

  deliveredUpdate: ({ name, orderId, merchantName = DEFAULT_MERCHANT_NAME }) =>
    `Hello ${name},\n\n` +
    `Your order ${orderId} has been delivered.\n\n` +
    `We hope you love it!\n` +
    `Thank you for shopping with us!\n` +
    `${merchantName}`,

  cancelledUpdate: ({ name, orderId, merchantName = DEFAULT_MERCHANT_NAME }) =>
    `Hello ${name},\n\n` +
    `Your order ${orderId} has been cancelled.\n` +
    `If you didn't request this, please contact our support team.\n\n` +
    `${merchantName}`,

  combinedUpdate: ({
    name,
    orderId,
    paymentStatus,
    amountPaid,
    pendingAmount,
    orderStatus,
    merchantName = DEFAULT_MERCHANT_NAME,
  }) =>
    `Hello ${name},\n\n` +
    `Update on your order ${orderId}!\n\n` +
    `Order Status: *${orderStatus.toUpperCase()}*\n` +
    `Payment Status: *${paymentStatus.toUpperCase()}*\n` +
    `Amount Paid: ${amountPaid}\n` +
    `Pending Amount: ${pendingAmount}\n\n` +
    `Thank you for shopping with us!\n` +
    `${merchantName}`,
};

export function buildOrderUpdateMessage({ order, editable, originalOrder, merchantName }) {
  const customerName =
    order?.address?.firstName || order?.userId?.name || "Customer";
  const orderId = order?.orderId || order?._id || "#";
  const brand = merchantName || order?.merchantName || DEFAULT_MERCHANT_NAME;

  const paymentStatusChanged =
    editable.paymentStatus !== originalOrder.paymentStatus ||
    Number(editable.amountPaid) !== Number(originalOrder.amountPaid ?? 0);
  const orderStatusChanged =
    editable.orderStatus !== originalOrder.orderStatus ||
    editable.status !== originalOrder.status ||
    editable.trackingPartner !== (originalOrder.trackingPartner || "");

  const pendingAmount = Math.max(
    Number(order.totalAmount ?? 0) - Number(editable.amountPaid ?? 0),
    0
  );

  if (editable.orderStatus === "cancelled") {
    return whatsappTemplates.cancelledUpdate({
      name: customerName,
      orderId,
      merchantName: brand,
    });
  }

  if (editable.orderStatus === "delivered") {
    return whatsappTemplates.deliveredUpdate({
      name: customerName,
      orderId,
      merchantName: brand,
    });
  }

  if (editable.orderStatus === "shipped") {
    return whatsappTemplates.shippedUpdate({
      name: customerName,
      orderId,
      trackingPartner: getTrackingPartnerLabel(editable.trackingPartner),
      trackingId: editable.trackingId || editable.status || "N/A",
      merchantName: brand,
    });
  }

  if (editable.orderStatus === "partial_shipped") {
    return whatsappTemplates.partialShippedUpdate({
      name: customerName,
      orderId,
      trackingPartner: getTrackingPartnerLabel(editable.trackingPartner),
      trackingId: editable.trackingId || editable.status || "N/A",
      merchantName: brand,
    });
  }

  if (paymentStatusChanged && orderStatusChanged) {
    return whatsappTemplates.combinedUpdate({
      name: customerName,
      orderId,
      paymentStatus: editable.paymentStatus,
      orderStatus: editable.orderStatus,
      amountPaid: `${order.currency || "₹"}${editable.amountPaid ?? 0}`,
      pendingAmount: `${order.currency || "₹"}${pendingAmount}`,
      merchantName: brand,
    });
  }

  if (paymentStatusChanged) {
    return whatsappTemplates.paymentUpdate({
      name: customerName,
      orderId,
      paymentStatus: editable.paymentStatus,
      amountPaid: editable.amountPaid ?? 0,
      pendingAmount,
      currency: order.currency || "₹",
      merchantName: brand,
    });
  }

  if (orderStatusChanged) {
    return whatsappTemplates.orderUpdate({
      name: customerName,
      orderId,
      orderStatus: editable.orderStatus,
      merchantName: brand,
    });
  }

  return whatsappTemplates.generic({ name: customerName, orderId, merchantName: brand });
}

export function normalizeWhatsappNumber(rawPhone) {
  if (!rawPhone) return "";
  return rawPhone.replace(/[^0-9]/g, "");
}

export function buildWhatsappUrl(phone, message) {
  if (!phone) return "";
  const encoded = encodeURIComponent(message);
  return `https://api.whatsapp.com/send?phone=${phone}&text=${encoded}`;
}