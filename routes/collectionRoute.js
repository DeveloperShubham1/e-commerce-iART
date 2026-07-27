import express from "express";
import {
  createCollection,
  updateCollection,
  getCollections,
  getCollectionById,
  deleteCollection,
  addProductsToCollection,
  getProductsForCollection,
  removeProductFromCollection,
} from "../controllers/collectionController.js";
import authMerchant from "../middlewares/merchantAuth.js";

const router = express.Router();

router.post("/", authMerchant, createCollection);

router.get("/", authMerchant, getCollections);

router.get("/products/all", authMerchant, getProductsForCollection);

router.get("/:id", authMerchant, getCollectionById);

router.put("/:id", authMerchant, updateCollection);

router.delete("/:id", authMerchant, deleteCollection);

router.post("/:id/products", authMerchant, addProductsToCollection);

router.delete(
  "/:id/products/:productId",
  authMerchant,
  removeProductFromCollection,
);

export default router;
