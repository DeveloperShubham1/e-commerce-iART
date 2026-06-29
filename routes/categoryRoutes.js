import express from "express";
import authMerchant from "../middlewares/merchantAuth.js";
import {
  addCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} from "../controllers/categoryController.js";

const router = express.Router();

router.get("/", authMerchant, getCategories);

router.get("/:id", authMerchant, getCategoryById);

router.post("/add", authMerchant, addCategory);

router.put("/update/:id", authMerchant, updateCategory);

router.delete("/delete/:id", authMerchant, deleteCategory);

export default router;
