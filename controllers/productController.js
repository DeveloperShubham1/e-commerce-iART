import mongoose from "mongoose";
import Product from "../models/Product.js";
import Subcategory from "../models/Subcategory.js";
import Category from "../models/Category.js";
import Collection from "../models/Collection.js";
import CollectionAssign from "../models/CollectionAssign.js";
import axios from "axios";

// ADD PRODUCTS
export const addProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      categoryId,
      subcategoryId,
      brand,
      sku,
      variants,
      isSeprate,
    } = req.body;

    /* ===================== BASIC VALIDATION ===================== */
    const missing = [];
    if (!name || !name.trim()) missing.push("name");
    if (!categoryId) missing.push("categoryId");
    // if (!subcategoryId) missing.push("subcategoryId");
    if (!variants) missing.push("variants");

    if (isSeprate !== undefined && typeof isSeprate !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isSeprate must be a boolean",
      });
    }

    if (missing.length) {
      return res.status(400).json({
        success: false,
        message: `Missing required field(s): ${missing.join(", ")}`,
      });
    }

    /* ===================== PARSE VARIANTS ===================== */
    let parsedVariants;
    try {
      parsedVariants =
        Array.isArray(variants) && variants.length
          ? variants
          : JSON.parse(variants);

      if (!Array.isArray(parsedVariants) || !parsedVariants.length) {
        throw new Error();
      }
    } catch {
      return res.status(400).json({
        success: false,
        message:
          "Invalid variants format. Expected a non-empty array of variant objects.",
      });
    }

    /* ===================== VALIDATE VARIANTS ===================== */
    for (let i = 0; i < parsedVariants.length; i++) {
      const v = parsedVariants[i];

      if (!v.color || !v.color.trim()) {
        return res.status(400).json({
          success: false,
          message: `Variant ${i + 1}: color is required`,
        });
      }

      if (!Array.isArray(v.sizes) || !v.sizes.length) {
        return res.status(400).json({
          success: false,
          message: `Variant ${i + 1}: at least one size required`,
        });
      }

      for (let j = 0; j < v.sizes.length; j++) {
        const s = v.sizes[j];

        if (!s.size || !s.size.trim()) {
          return res.status(400).json({
            success: false,
            message: `Variant ${i + 1}, Size ${j + 1}: size required`,
          });
        }

        if (s.price === undefined || isNaN(Number(s.price))) {
          return res.status(400).json({
            success: false,
            message: `Variant ${i + 1}, Size ${j + 1}: invalid price`,
          });
        }
      }

      /* ---------- IMAGES VALIDATION ---------- */
      if (!Array.isArray(v.images) || !v.images.length) {
        return res.status(400).json({
          success: false,
          message: `Variant ${i + 1}: at least one image is required`,
        });
      }

      if (v.imageKeys && !Array.isArray(v.imageKeys)) {
        return res.status(400).json({
          success: false,
          message: `Variant ${i + 1}: imageKeys must be an array`,
        });
      }

      /* ---------- THUMBNAIL INDEX VALIDATION ---------- */
      if (v.thumbnailIndex === undefined) {
        v.thumbnailIndex = 0; // ✅ default
      }

      if (
        typeof v.thumbnailIndex !== "number" ||
        v.thumbnailIndex < 0 ||
        v.thumbnailIndex >= v.images.length
      ) {
        return res.status(400).json({
          success: false,
          message: `Variant ${i + 1}: thumbnailIndex must be between 0 and ${v.images.length - 1
            }`,
        });
      }

      /* ---------- TRENDING VALIDATION ---------- */
      if (v.isTrending !== undefined && typeof v.isTrending !== "boolean") {
        return res.status(400).json({
          success: false,
          message: `Variant ${i + 1}: isTrending must be boolean`,
        });
      }

      if (v.isTrending) {
        if (
          v.trendingOrder === undefined ||
          typeof v.trendingOrder !== "number" ||
          v.trendingOrder < 1
        ) {
          return res.status(400).json({
            success: false,
            message: `Variant ${i + 1}: trendingOrder must be positive number`,
          });
        }

        const orderExists = await Product.findOne({
          "variants.isTrending": true,
          "variants.trendingOrder": v.trendingOrder,
        }).select("_id");

        if (orderExists) {
          return res.status(409).json({
            success: false,
            message: `Trending order ${v.trendingOrder} already exists`,
          });
        }
      }
    }

    /* ===================== MERCHANT CHECK ===================== */
    const merchantId = req.merchant?._id;
    if (!merchantId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    /* ===================== SKU GENERATION ===================== */
    let parentSku = sku;
    if (!parentSku) {
      const clean = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      parentSku = `${clean}-${Date.now()}`.slice(0, 64);
    }

    /* ===================== SAVE PRODUCT ===================== */
    const product = await Product.create({
      merchantId,
      name: name.trim(),
      description: description?.trim(),
      brand: brand?.trim(),
      sku: parentSku,
      categoryId,
      subcategoryId,
      variants: parsedVariants,
      isSeprate: isSeprate ?? false, // 👈 ADD
    });

    return res.status(201).json({
      success: true,
      message: "Product added successfully",
      product,
    });
  } catch (error) {
    console.error("Add product error:", error);

    if (error.code === 11000 && error.keyPattern?.sku) {
      return res.status(409).json({
        success: false,
        message: "SKU already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};
// UPDATE PRODUCT
export const updateProduct = async (req, res) => {
  try {
    let productId = req.params.id;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
    }

    const {
      name,
      description,
      categoryId,
      subcategoryId,
      brand,
      sku,
      variants,
      isActive,
      isSeprate,
    } = req.body;

    // find product
    const existing = await Product.findById(productId);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // merchant authorization check
    const merchantId = req.merchant && req.merchant._id;
    if (
      !merchantId ||
      existing.merchantId.toString() !== merchantId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: You cannot update this product",
      });
    }

    if (isSeprate !== undefined && typeof isSeprate !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isSeprate must be a boolean",
      });
    }

    // build update object
    const updateFields = {};

    if (name !== undefined) updateFields.name = name;
    if (description !== undefined) updateFields.description = description;
    if (brand !== undefined) updateFields.brand = brand;
    if (categoryId !== undefined) updateFields.categoryId = categoryId;
    if (subcategoryId !== undefined) updateFields.subcategoryId = subcategoryId;
    if (sku !== undefined) updateFields.sku = sku;
    if (isActive !== undefined) updateFields.isActive = isActive;
    if (isSeprate !== undefined) {
      updateFields.isSeprate = isSeprate;
    }
    // Handle variants
    if (variants !== undefined) {
      let parsedVariants;

      try {
        parsedVariants =
          Array.isArray(variants) && variants.length
            ? variants
            : JSON.parse(variants);

        if (!Array.isArray(parsedVariants) || !parsedVariants.length) {
          throw new Error("Variants must be a non-empty array");
        }
      } catch (e) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid variants format. Expected a non-empty array of variant objects.",
        });
      }

      // variant validation
      for (let i = 0; i < parsedVariants.length; i++) {
        const v = parsedVariants[i];

        if (!v.color || !v.color.trim()) {
          return res.status(400).json({
            success: false,
            message: `Variant ${i + 1}: color is required`,
          });
        }

        if (!Array.isArray(v.sizes) || v.sizes.length === 0) {
          return res.status(400).json({
            success: false,
            message: `Variant ${i + 1}: must have at least one size`,
          });
        }

        for (let j = 0; j < v.sizes.length; j++) {
          const s = v.sizes[j];

          if (!s.size || s.size.trim() === "") {
            return res.status(400).json({
              success: false,
              message: `Variant ${i + 1}, Size ${j + 1}: size required`,
            });
          }

          if (
            s.price === undefined ||
            s.price === null ||
            isNaN(Number(s.price))
          ) {
            return res.status(400).json({
              success: false,
              message: `Variant ${i + 1}, Size ${j + 1}: invalid price`,
            });
          }
        }

        /* ---------- IMAGES VALIDATION ---------- */
        if (!Array.isArray(v.images) || !v.images.length) {
          return res.status(400).json({
            success: false,
            message: `Variant ${i + 1}: at least one image is required`,
          });
        }

        if (v.imageKeys && !Array.isArray(v.imageKeys)) {
          return res.status(400).json({
            success: false,
            message: `Variant ${i + 1}: imageKeys must be an array`,
          });
        }

        /* ---------- THUMBNAIL INDEX VALIDATION ---------- */
        if (v.thumbnailIndex === undefined || v.thumbnailIndex === null) {
          v.thumbnailIndex = 0; // ✅ default for updates also
        }

        if (
          typeof v.thumbnailIndex !== "number" ||
          v.thumbnailIndex < 0 ||
          v.thumbnailIndex >= v.images.length
        ) {
          return res.status(400).json({
            success: false,
            message: `Variant ${i + 1}: thumbnailIndex must be between 0 and ${v.images.length - 1
              }`,
          });
        }

        /* ---------- TRENDING VALIDATION ---------- */
        if (v.isTrending !== undefined && typeof v.isTrending !== "boolean") {
          return res.status(400).json({
            success: false,
            message: `Variant ${i + 1}: isTrending must be boolean`,
          });
        }

        if (
          v.isTrending &&
          (v.trendingOrder === undefined ||
            typeof v.trendingOrder !== "number" ||
            v.trendingOrder < 1)
        ) {
          return res.status(400).json({
            success: false,
            message: `Variant ${i + 1}: trendingOrder must be positive number`,
          });
        }

        // ensure trendingOrder is null if variant is not trending
        if (!v.isTrending) {
          v.trendingOrder = null;
        }
      }

      updateFields.variants = parsedVariants;
    }

    // update product
    const updated = await Product.findByIdAndUpdate(
      productId,
      { $set: updateFields },
      { new: true, runValidators: true },
    );

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product: updated,
    });
  } catch (error) {
    console.error("Update product error:", error);

    if (error.code === 11000 && error.keyPattern && error.keyPattern.sku) {
      return res.status(409).json({
        success: false,
        message: "SKU already exists. Try a different SKU.",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};
//WITH  merchantId PRODUCT LIST
export const productList = async (req, res) => {
  try {
    const {
      search = "",
      page = 1,
      limit = 10,
      isActive,
      categoryId,
      subcategoryId,
      size,
    } = req.query;

    if (!req.merchant || !req.merchant._id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: merchant data missing",
      });
    }

    /* ------------------ FILTER ------------------ */
    const filter = {
      merchantId: new mongoose.Types.ObjectId(req.merchant._id),
      isDeleted: false,
    };

    if (search.trim()) {
      filter.$or = [
        { name: { $regex: search.trim(), $options: "i" } },
        { description: { $regex: search.trim(), $options: "i" } },
      ];
    }

    if (isActive === "true") filter.isActive = true;
    else if (isActive === "false") filter.isActive = false;

    if (categoryId) filter.categoryId = new mongoose.Types.ObjectId(categoryId);

    if (subcategoryId)
      filter.subcategoryId = new mongoose.Types.ObjectId(subcategoryId);

    if (size) filter["variants.sizes.size"] = size.toUpperCase(); // ✅ FIXED

    /* ------------------ PAGINATION ------------------ */
    const skip = (Number(page) - 1) * Number(limit);

    /* ------------------ AGGREGATION ------------------ */
    const products = await Product.aggregate([
      { $match: filter },

      // 🔥 Product-level trending flags
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

      // 🔥 Trending products first
      {
        $sort: {
          hasTrendingVariant: -1,
          minTrendingOrder: 1,
          createdAt: -1,
        },
      },

      { $skip: skip },
      { $limit: Number(limit) },
    ]);

    /* ------------------ POPULATE ------------------ */
    await Product.populate(products, [
      { path: "categoryId", select: "name _id" },
      { path: "subcategoryId", select: "name _id" },
    ]);

    /* ------------------ VARIANT SORT ------------------ */
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

    /* ------------------ TOTAL COUNT ------------------ */
    const total = await Product.countDocuments(filter);

    return res.json({
      success: true,
      products,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching products",
      error: error.message,
    });
  }
};

export const productById = async (req, res) => {
  try {
    const { id } = req.query;

    const product = await Product.findOne({
      _id: id,
      isDeleted: false,
    })
      .populate("categoryId", "name _id")
      .populate("subcategoryId", "name _id");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Sort variants (Trending first)
    if (product.variants?.length) {
      product.variants.sort((a, b) => {
        if (a.isTrending === b.isTrending) {
          return (a.trendingOrder ?? 999) - (b.trendingOrder ?? 999);
        }
        return b.isTrending - a.isTrending;
      });
    }

    return res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching product",
      error: error.message,
    });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });

    // Check merchant ownership
    if (product.merchantId.toString() !== req.merchant._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: You can only delete your own categories",
      });
    }

    // Delete the Product itself
    product.isDeleted = true;
    await product.save();

    res.status(200).json({
      success: true,
      message: `Product deleted successfully.`,
    });
  } catch (error) {
    console.error("Delete Product error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const productListByUser = async (req, res) => {
  try {
    const {
      search = "",
      page = 1,
      limit = 10,
      isActive,
      categoryId,
      subcategoryId,
      collectionId,
      size,
    } = req.query;

    const merchantId = req.query.merchantId || req.body.merchantId;

    if (!merchantId) {
      return res.status(400).json({
        success: false,
        message:
          "Merchant ID missing — either login as merchant or pass merchantId in query/body",
      });
    }
    let collection = null;
    /* ------------------ FILTER BUILD ------------------ */
    const filter = {
      merchantId: new mongoose.Types.ObjectId(merchantId), // ✅ IMPORTANT
    };

    if (search.trim()) {
      filter.$or = [
        { name: { $regex: search.trim(), $options: "i" } },
        { description: { $regex: search.trim(), $options: "i" } },
      ];
    }

    if (isActive === "true") filter.isActive = true;
    else if (isActive === "false") filter.isActive = false;

    if (categoryId) filter.categoryId = new mongoose.Types.ObjectId(categoryId);

    if (subcategoryId)
      filter.subcategoryId = new mongoose.Types.ObjectId(subcategoryId);

    if (size) filter["variants.sizes.size"] = size.toUpperCase(); // ✅ FIXED PATH

    if (collectionId) {
      collection = await Collection.findOne({
        _id: collectionId,
        merchantId,
      })
        .select("_id name")
        .lean();

      const productIds = await CollectionAssign.distinct("product", {
        merchantId: new mongoose.Types.ObjectId(merchantId),
        collection: new mongoose.Types.ObjectId(collectionId),
      });

      filter._id = { $in: productIds };
    }

    /* ------------------ PAGINATION ------------------ */
    const skip = (Number(page) - 1) * Number(limit);

    /* ------------------ AGGREGATION ------------------ */
    const products = await Product.aggregate([
      { $match: filter },

      // 🔥 PRODUCT-LEVEL TRENDING FLAGS
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

      // 🔥 TRENDING PRODUCTS FIRST
      {
        $sort: {
          hasTrendingVariant: -1,
          minTrendingOrder: 1,
          createdAt: -1,
        },
      },

      { $skip: skip },
      { $limit: Number(limit) },
    ]);

    /* ------------------ POPULATE ------------------ */
    await Product.populate(products, [
      { path: "categoryId", select: "name _id" },
      { path: "subcategoryId", select: "name _id" },
    ]);

    /* ------------------ VARIANT SORT ------------------ */
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

    /* ------------------ TOTAL COUNT ------------------ */
    const total = await Product.countDocuments(filter);

    return res.json({
      success: true,
      collection,
      products,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching products",
      error: error.message,
    });
  }
};
