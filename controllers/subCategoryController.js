import Subcategory from "../models/Subcategory.js";
import Category from "../models/Category.js";

export const addSubcategory = async (req, res) => {
  try {
    const { name, description, categoryId } = req.body;

    if (!name || !categoryId) {
      return res.status(400).json({
        success: false,
        message: "Subcategory name and categoryId are required",
      });
    }

    // Verify that category exists
    const category = await Category.findById(categoryId);
    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Parent category not found" });
    }

    if (category.merchantId.toString() !== req.merchant._id.toString()) {
      return res.status(403).json({
        success: false,
        message:
          "Unauthorized: You can only add subcategories to your own categories",
      });
    }
    // Prevent duplicate subcategory names under same category
    const existing = await Subcategory.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") },
      categoryId,
      merchantId: req.merchant._id,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message:
          "Subcategory with this name already exists under this category",
      });
    }

    // Create subcategory
    const subcategory = await Subcategory.create({
      name,
      description,
      categoryId,
      merchantId: req.merchant._id,
    });

    res.status(201).json({
      success: true,
      message: "Subcategory added successfully",
      subcategory,
    });
  } catch (error) {
    console.error("Add subcategory error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// export const getSubcategories = async (req, res) => {
//   try {
//     const { categoryId } = req.query;

//     const filter = {};
//     if (categoryId) filter.categoryId = categoryId;

//     const subcategories = await Subcategory.find(filter)
//       .populate("categoryId", "name")
//       .populate("merchantId", "MerchantName email")
//       .sort({ createdAt: -1 });

//     if (!subcategories || subcategories.length === 0) {
//       return res.status(200).json({
//         success: true,
//         subcategories,
//         message: categoryId
//           ? "No subcategories found for this category"
//           : "No subcategories found",
//       });
//     }

//     res.status(200).json({
//       success: true,
//       subcategories,
//       message: "Subcategories fetched successfully",
//     });
//   } catch (error) {
//     console.error("Get subcategories error:", error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };



export const getSubcategories = async (req, res) => {
  try {
    // Check merchant exists
    if (!req.merchant || !req.merchant._id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Merchant data missing",
      });
    }

    const { categoryId } = req.query;

    const filter = {
      merchantId: req.merchant._id, // ✅ Only fetch merchant's subcategories
    };

    if (categoryId) filter.categoryId = categoryId;

    const subcategories = await Subcategory.find(filter)
      .populate("categoryId", "name")
      .populate("merchantId", "MerchantName email")
      .sort({ createdAt: -1 });

    if (!subcategories || subcategories.length === 0) {
      return res.status(200).json({
        success: true,
        subcategories,
        message: categoryId
          ? "No subcategories found for this category"
          : "No subcategories found",
      });
    }

    res.status(200).json({
      success: true,
      subcategories,
      message: "Subcategories fetched successfully",
    });
  } catch (error) {
    console.error("Get subcategories error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};


export const getSubcategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const subcategory = await Subcategory.findById(id)
      .populate("categoryId", "name")
      .populate("merchantId", "MerchantName email");

    if (!subcategory) {
      return res
        .status(404)
        .json({ success: false, message: "Subcategory not found" });
    }

    res.status(200).json({ success: true, subcategory });
  } catch (error) {
    console.error("Get subcategory by ID error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSubcategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, categoryId } = req.body;

    const subcategory = await Subcategory.findById(id);
    if (!subcategory)
      return res
        .status(404)
        .json({ success: false, message: "Subcategory not found" });

    // Ownership check
    if (subcategory.merchantId.toString() !== req.merchant._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: You can only update your own subcategories",
      });
    }

    // If categoryId is provided, verify new category
    if (categoryId && categoryId !== subcategory.categoryId.toString()) {
      const newCategory = await Category.findById(categoryId);

      if (!newCategory)
        return res.status(404).json({
          success: false,
          message:
            "No such category exists please create a new category before updating",
        });

      // Ensure the new category also belongs to this merchant
      if (newCategory.merchantId.toString() !== req.merchant._id.toString()) {
        return res.status(403).json({
          success: false,
          message:
            "Unauthorized: You can only move subcategory to your own category",
        });
      }

      subcategory.categoryId = categoryId; //update category
    }

    // Update name/description if provided
    if (name) subcategory.name = name;
    if (description) subcategory.description = description;

    await subcategory.save();

    res.status(200).json({
      success: true,
      message: "Subcategory updated successfully",
      subcategory,
    });
  } catch (error) {
    console.error("Update subcategory error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteSubcategory = async (req, res) => {
  try {
    const { id } = req.params;

    const subcategory = await Subcategory.findById(id);
    if (!subcategory)
      return res
        .status(404)
        .json({ success: false, message: "Subcategory not found" });

    // Check ownership
    if (subcategory.merchantId.toString() !== req.merchant._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: You can only delete your own subcategories",
      });
    }

    await subcategory.deleteOne();

    res.status(200).json({
      success: true,
      message: "Subcategory deleted successfully",
    });
  } catch (error) {
    console.error("Delete subcategory error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
