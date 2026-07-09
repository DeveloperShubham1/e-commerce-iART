import express from "express";
import {
  createOrUpdateMapping,
  removeMapping,
  getMessageHistory,
  getInstagramProducts,
  getInstagramPostProduct,
} from "../controllers/instaProduct.js";
import authMerchant from "../middlewares/merchantAuth.js";

const router = express.Router();

router.post("/mappings", authMerchant, createOrUpdateMapping);
router.delete("/mappings/:mediaId", authMerchant, removeMapping);
router.get("/message-history", authMerchant, getMessageHistory);
router.get("/instagram-products", authMerchant, getInstagramProducts);
router.get(
  "/instagram-products/:mediaId",
  authMerchant,
  getInstagramPostProduct,
);

export default router;
