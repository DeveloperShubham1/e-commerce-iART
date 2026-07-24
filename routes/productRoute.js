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

const productRouter = express.Router();

productRouter.get("/", productById);
productRouter.post("/add", authMerchant, addProduct);
productRouter.put("/update/:id", authMerchant, updateProduct);
productRouter.delete("/delete/:id", authMerchant, deleteProduct);
productRouter.get("/list", authMerchant, productList);

export default productRouter;
