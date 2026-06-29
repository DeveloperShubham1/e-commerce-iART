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

export default router;
