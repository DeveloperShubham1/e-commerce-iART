import express from "express";
import authMerchant from "../middlewares/merchantAuth.js";
import authUser from "../middlewares/authUser.js";
import {
  placeOrder,
  placeUpiOrder,
  verifyPayment,
  getAllOrdersByMerchant,
  getOrdersByMerchantAndPhone,
  getOrderByRazorpayId,
  getOrderByPaymentId,
  createOnlineOrder,
  updateOrderStatus,
  getSalesTrend,
  getTopSellingProducts,
  getPaymentAnalytics,
} from "../controllers/orderController.js";
import requirePermission from "../middlewares/requirepermission.js";

const router = express.Router();
// COD
router.post("/place", authUser, placeOrder);

router.post("/upi", authUser, placeUpiOrder);

// update order state
router.put(
  "/update/:orderId",
  requirePermission("order.update_status"),
  updateOrderStatus,
);

// online payment
router.post("/stripe", authUser, createOnlineOrder);

router.post("/verify-payment", authUser, verifyPayment);

router.get(
  "/merchant/all",
  requirePermission("order.view"),
  getAllOrdersByMerchant,
);

router.get(
  "/merchant/customer/:phone",
  requirePermission("order.view"),
  getOrdersByMerchantAndPhone,
);

router.get(
  "/razorpay/:razorpayOrderId",
  requirePermission("order.view"),
  getOrderByRazorpayId,
);

router.get(
  "/payment/:paymentId",
  requirePermission("order.view"),
  getOrderByPaymentId,
);

// REPORT DATA

router.get(
  "/report/sales-trend",
  requirePermission("reports.view"),
  getSalesTrend,
);
router.get(
  "/report/top-products",
  requirePermission("reports.view"),
  getTopSellingProducts,
);
router.get(
  "/report/payment-analytics",
  requirePermission("reports.view"),
  getPaymentAnalytics,
);

export default router;
