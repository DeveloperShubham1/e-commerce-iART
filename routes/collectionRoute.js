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
import requirePermission from "../middlewares/requirepermission.js";

const router = express.Router();

router.post("/", requirePermission("collection.create"), createCollection);

router.get("/", requirePermission("collection.view"), getCollections);

router.get(
  "/products/all",
  requirePermission("collection.view"),
  getProductsForCollection,
);

router.get("/:id", requirePermission("collection.view"), getCollectionById);

router.put("/:id", requirePermission("collection.edit"), updateCollection);

router.delete("/:id", requirePermission("collection.delete"), deleteCollection);

router.post(
  "/:id/products",
  requirePermission("collection.edit"),
  addProductsToCollection,
);

router.delete(
  "/:id/products/:productId",
  requirePermission("collection.edit"),
  removeProductFromCollection,
);

export default router;
