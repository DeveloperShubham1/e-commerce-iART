import express from "express";
import { upload } from "../configs/multer.js";
import authMerchant from "../middlewares/merchantAuth.js";
import {
  addProduct,
  productById,
  productList,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";
import requirePermission from "../middlewares/requirepermission.js";

const productRouter = express.Router();

productRouter.get("/", productById);
productRouter.post("/add", requirePermission("product.create"), addProduct);
productRouter.put(
  "/update/:id",
  requirePermission("product.edit"),
  updateProduct,
);
productRouter.delete(
  "/delete/:id",
  requirePermission("product.delete"),
  deleteProduct,
);
productRouter.get("/list", requirePermission("product.view"), productList);

export default productRouter;
