import express from "express";
import {
  merchantLogin,
  isMerchantAuth,
  merchantLogout,
  registerMerchant,
  updateMerchantPassword,
  createMerchantSettings,
  getMerchantSettings,
  updateMerchantSettings,
  updateMerchant,
  // Instagram Integration
  getInstagramConfig,
  updateInstagramConfig,
  verifyInstagramToken,
  subscribeWebhook,
  getSubscriptionStatus,
  disconnectInstagram,
  refreshInstagramToken,
} from "../controllers/merchantController.js";
import authMerchant from "../middlewares/merchantAuth.js";

const router = express.Router();

router.post("/register", registerMerchant);
router.post("/login", merchantLogin);
router.get("/is-auth", authMerchant, isMerchantAuth);
router.post("/logout", authMerchant, merchantLogout);
router.put("/update-password", authMerchant, updateMerchantPassword);
router.put("/update/:merchantId", updateMerchant);
// settings
router.post("/settings", authMerchant, createMerchantSettings);
router.put("/settings", authMerchant, updateMerchantSettings);
router.get("/settings", authMerchant, getMerchantSettings);
// Instagram Integration

router.get("/instagram", authMerchant, getInstagramConfig);
router.put("/instagram", authMerchant, updateInstagramConfig);
router.post("/instagram/verify-token", authMerchant, verifyInstagramToken);
router.post("/instagram/subscribe-webhook", authMerchant, subscribeWebhook);
router.get(
  "/instagram/subscription-status",
  authMerchant,
  getSubscriptionStatus,
);
router.delete("/instagram", authMerchant, disconnectInstagram);
router.post("/instagram/refresh-token",authMerchant, refreshInstagramToken);

export default router;
