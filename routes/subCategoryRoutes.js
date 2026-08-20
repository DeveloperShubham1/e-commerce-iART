import express from "express";
import authMerchant from "../middlewares/merchantAuth.js";
import {
  addSubcategory,
  getSubcategories,
  getSubcategoryById,
  updateSubcategory,
  deleteSubcategory,
} from "../controllers/subCategoryController.js";
import requirePermission from "../middlewares/requirepermission.js";

const router = express.Router();

// Public: list all subcategories (optionally filter by ?categoryId=...)
router.get("/", requirePermission("sub_category.view"), getSubcategories);

// Public: get single subcategory by id
router.get("/:id", getSubcategoryById);

// Protected: add a subcategory (merchant only)
router.post("/add", requirePermission("sub_category.create"), addSubcategory);

// Protected: update a subcategory (merchant only)
router.put(
  "/update/:id",
  requirePermission("sub_category.edit"),
  updateSubcategory,
);

// Protected: delete a subcategory (merchant only)
router.delete(
  "/delete/:id",
  requirePermission("sub_category.delete"),
  deleteSubcategory,
);

export default router;
