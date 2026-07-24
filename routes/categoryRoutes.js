import express from "express";
import authMerchant from "../middlewares/merchantAuth.js";
import {
  addCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  productsByCategoryId,
} from "../controllers/categoryController.js";

const router = express.Router();

router.get("/by-category", productsByCategoryId);

router.get("/", authMerchant, getCategories);

router.get("/:id", authMerchant, getCategoryById);

router.post("/add", authMerchant, addCategory);

router.put("/update/:id", authMerchant, updateCategory);

router.delete("/delete/:id", authMerchant, deleteCategory);

export default router;
