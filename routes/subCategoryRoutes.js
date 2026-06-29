import express from "express";
import authMerchant from "../middlewares/merchantAuth.js";
import {
  addSubcategory,
  getSubcategories,
  getSubcategoryById,
  updateSubcategory,
  deleteSubcategory,
} from "../controllers/subCategoryController.js";

const router = express.Router();

// Public: list all subcategories (optionally filter by ?categoryId=...)
router.get("/", authMerchant, getSubcategories);

// Public: get single subcategory by id
router.get("/:id", getSubcategoryById);

// Protected: add a subcategory (merchant only)
router.post("/add", authMerchant, addSubcategory);

// Protected: update a subcategory (merchant only)
router.put("/update/:id", authMerchant, updateSubcategory);

// Protected: delete a subcategory (merchant only)
router.delete("/delete/:id", authMerchant, deleteSubcategory);

export default router;
