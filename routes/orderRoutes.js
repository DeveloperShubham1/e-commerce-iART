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

const router = express.Router();
// COD
router.post("/place", authUser, placeOrder);

router.post("/upi", authUser, placeUpiOrder);

// update order state
router.put("/update/:orderId", authMerchant, updateOrderStatus);

// online payment
router.post("/stripe", authUser, createOnlineOrder);

router.post("/verify-payment", authUser, verifyPayment);

router.get("/merchant/all", authMerchant, getAllOrdersByMerchant);

router.get(
  "/merchant/customer/:phone",
  authMerchant,
  getOrdersByMerchantAndPhone,
);

router.get("/razorpay/:razorpayOrderId", authMerchant, getOrderByRazorpayId);

router.get("/payment/:paymentId", authMerchant, getOrderByPaymentId);

// REPORT DATA

router.get("/report/sales-trend", authMerchant, getSalesTrend);
router.get("/report/top-products", authMerchant, getTopSellingProducts);
router.get("/report/payment-analytics", authMerchant, getPaymentAnalytics);

export default router;
