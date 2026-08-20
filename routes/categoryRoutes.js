import express from "express";
import authMerchant from "../middlewares/merchantAuth.js";
import requirePermission from "../middlewares/requirepermission.js";
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

router.get("/", requirePermission("category.view"), getCategories);

router.get("/:id", requirePermission("category.view"), getCategoryById);

router.post("/add", requirePermission("category.create"), addCategory);

router.put("/update/:id", requirePermission("category.edit"), updateCategory);

router.delete(
  "/delete/:id",
  requirePermission("category.delete"),
  deleteCategory,
);

export default router;
