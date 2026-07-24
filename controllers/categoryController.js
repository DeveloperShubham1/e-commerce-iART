import Category from "../models/Category.js";
import Subcategory from "../models/Subcategory.js";
import Product from "../models/Product.js";
import mongoose from "mongoose";
import { deleteFileFromS3 } from "./s3Controller.js";

export const addCategory = async (req, res) => {
  try {
    const { name, description, imageKey, imageUrl } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    const trimmedName = name.trim();

    // Check duplicate category for same merchant (case-insensitive)
    const existing = await Category.findOne({
      merchantId: req.merchant._id,
      name: { $regex: new RegExp(`^${trimmedName}$`, "i") },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Category with this name already exists for this merchant",
      });
    }

    // Create new category
    const category = await Category.create({
      name: trimmedName,
      description,
      merchantId: req.merchant._id,
      ...(imageKey && imageUrl
        ? { image: { key: imageKey, url: imageUrl } }
        : {}),
    });

    return res.status(201).json({
      success: true,
      message: "Category added successfully",
      category,
    });
  } catch (error) {
    console.error("Add category error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getCategories = async (req, res) => {
  try {
    let merchantId;

    if (req.merchant?._id) {
      merchantId = req.merchant._id;
    } else if (req.query.merchantId || req.body.merchantId) {
      merchantId = req.query.merchantId || req.body.merchantId;
    }

    // If neither present → reject
    if (!merchantId) {
      return res.status(400).json({
        success: false,
        message:
          "Merchant ID missing — either login as merchant or pass merchantId in query/body",
      });
    }

    // Fetch categories (with image field preserved)
    const categories = await Category.find({ merchantId })
      .populate("merchantId", "MerchantName email")
      .sort({ createdAt: -1 })
      .lean(); // Convert to plain JS object for safe manipulation

    // Ensure image field always exists
    const categoriesWithImages = categories.map((cat) => ({
      ...cat,
      image: cat.image || { url: null, key: null },
    }));

    res.status(200).json({
      success: true,
      categories: categoriesWithImages,
      merchantUsed: merchantId,
      message: "Categories fetched successfully",
    });
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error while fetching categories",
    });
  }
};

export const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id).populate(
      "merchantId",
      "MerchantName email",
    );

    if (!category)
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });

    res.status(200).json({ success: true, category });
  } catch (error) {
    console.error("Get category by ID error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, imageKey, imageUrl, removeImage } = req.body;

    const category = await Category.findById(id);
    if (!category)
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });

    if (category.merchantId.toString() !== req.merchant._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: You can only update your own categories",
      });
    }

    if (name) category.name = name;
    if (description) category.description = description;

    if (removeImage === "true" && category.image?.key) {
      try {
        const fakeRes = {
          json: () => {},
          status: () => ({ json: () => {} }),
        };
        await deleteFileFromS3({ body: { key: category.image.key } }, fakeRes);
        console.log(`Deleted image from S3: ${category.image.key}`);
      } catch (err) {
        console.warn("Failed to delete category image from S3:", err.message);
      }
      category.image = undefined;
    }

    // 🖼 Replace image
    else if (imageKey && imageUrl) {
      if (category.image?.key) {
        try {
          const fakeRes = {
            json: () => {},
            status: () => ({ json: () => {} }),
          };
          await deleteFileFromS3(
            { body: { key: category.image.key } },
            fakeRes,
          );
          console.log(`Replaced old image in S3: ${category.image.key}`);
        } catch (err) {
          console.warn("Old image deletion failed:", err.message);
        }
      }

      category.image = { key: imageKey, url: imageUrl };
    }

    await category.save();

    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
      category,
    });
  } catch (error) {
    console.error("Update category error:", error);
    res
      .status(500)
      .json({ success: false, message: error.message || "Server error" });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);
    if (!category)
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });

    // Check merchant ownership
    if (category.merchantId.toString() !== req.merchant._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: You can only delete your own categories",
      });
    }

    // Delete all related subcategories first
    const deletedSubcategories = await Subcategory.deleteMany({
      categoryId: category._id,
    });

    // Delete the category itself
    await category.deleteOne();

    res.status(200).json({
      success: true,
      message: `Category deleted successfully along with ${deletedSubcategories.deletedCount} subcategories`,
    });
  } catch (error) {
    console.error("Delete category error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// api for User Data
export const getCategoriesForUser = async (req, res) => {
  try {
    let merchantId;

    if (req.merchant?._id) {
      merchantId = req.merchant._id;
    } else if (req.query.merchantId || req.body.merchantId) {
      merchantId = req.query.merchantId || req.body.merchantId;
    }

    // If neither present → reject
    if (!merchantId) {
      return res.status(400).json({
        success: false,
        message:
          "Merchant ID missing — either login as merchant or pass merchantId in query/body",
      });
    }

    // Fetch categories (with image field preserved)
    const categories = await Category.find({ merchantId })
      .populate("merchantId", "MerchantName email")
      .sort({ createdAt: -1 })
      .lean(); // Convert to plain JS object for safe manipulation

    // Ensure image field always exists
    const categoriesWithImages = categories.map((cat) => ({
      ...cat,
      image: cat.image || { url: null, key: null },
    }));

    res.status(200).json({
      success: true,
      categories: categoriesWithImages,
      merchantUsed: merchantId,
      message: "Categories fetched successfully",
    });
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error while fetching categories",
    });
  }
};

export const productsByCategoryId = async (req, res) => {
  try {
    const { categoryId, productId } = req.query;

    if (!categoryId || !productId) {
      return res.status(400).json({
        success: false,
        message: "categoryId and productId are required",
      });
    }

    const excludeId = new mongoose.Types.ObjectId(productId);
    const categoryObjectId = new mongoose.Types.ObjectId(categoryId);

    let products = [];
    let type = "";

    /* =====================================================
       CASE 1 : SIMILAR PRODUCTS
       Same category
       Trending first
    ====================================================== */
    products = await Product.aggregate([
      {
        $match: {
          _id: { $ne: excludeId },
          categoryId: categoryObjectId,
          isActive: true,
        },
      },

      {
        $addFields: {
          hasTrendingVariant: {
            $anyElementTrue: {
              $map: {
                input: "$variants",
                as: "v",
                in: "$$v.isTrending",
              },
            },
          },
          minTrendingOrder: {
            $min: {
              $map: {
                input: {
                  $filter: {
                    input: "$variants",
                    as: "v",
                    cond: { $eq: ["$$v.isTrending", true] },
                  },
                },
                as: "tv",
                in: "$$tv.trendingOrder",
              },
            },
          },
        },
      },

      {
        $sort: {
          hasTrendingVariant: -1,
          minTrendingOrder: 1,
          createdAt: -1,
        },
      },
      {
        $limit: 5,
      },
    ]);

    await Product.populate(products, [
      { path: "categoryId", select: "name _id" },
      { path: "subcategoryId", select: "name _id" },
    ]);

    if (products.length) {
      type = "similar";
    }

    /* =====================================================
       CASE 2 : TOP TRENDING
       ALL CATEGORIES
       Exclude current product
    ====================================================== */

    if (!products.length) {
      products = await Product.aggregate([
        {
          $match: {
            _id: { $ne: excludeId },
            isActive: true,
            "variants.isTrending": true,
          },
        },

        {
          $addFields: {
            minTrendingOrder: {
              $min: {
                $map: {
                  input: {
                    $filter: {
                      input: "$variants",
                      as: "v",
                      cond: { $eq: ["$$v.isTrending", true] },
                    },
                  },
                  as: "tv",
                  in: "$$tv.trendingOrder",
                },
              },
            },
          },
        },

        {
          $sort: {
            minTrendingOrder: 1,
            createdAt: -1,
          },
        },
      ]);

      await Product.populate(products, [
        { path: "categoryId", select: "name _id" },
        { path: "subcategoryId", select: "name _id" },
      ]);

      if (products.length) {
        type = "top-trending";
      }
    }

    /* =====================================================
       CASE 3 : ALL PRODUCTS
       Exclude current product
    ====================================================== */

    if (!products.length) {
      products = await Product.find({
        _id: { $ne: excludeId },
        isActive: true,
      })
        .populate("categoryId", "name _id")
        .populate("subcategoryId", "name _id")
        .sort({ createdAt: -1 });

      type = "products";
    }

    /* =====================================================
       SORT VARIANTS
    ====================================================== */

    products.forEach((product) => {
      if (product.variants?.length) {
        product.variants.sort((a, b) => {
          if (a.isTrending === b.isTrending) {
            return (a.trendingOrder ?? 999) - (b.trendingOrder ?? 999);
          }

          return b.isTrending - a.isTrending;
        });
      }
    });

    return res.status(200).json({
      success: true,
      type,
      total: products.length,
      products,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Error fetching products",
      error: error.message,
    });
  }
};
