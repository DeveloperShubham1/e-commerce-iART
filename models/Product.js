import mongoose from "mongoose";

const SizeSchema = new mongoose.Schema({
  size: { type: String, required: true }, // S, M, L, XL
  stock: { type: Number, default: 0 },
  price: { type: Number, required: true },
  offerPrice: { type: Number },
  variantSku: { type: String },
});

const VariantSchema = new mongoose.Schema({
  color: { type: String, required: true },
  colorCode: { type: String }, // #FF0000
  images: [String], // array of image URLs
  imageKeys: [String], // S3 keys
  sizes: [SizeSchema],

  // 🔥 TRENDING FIELDS (Admin Controlled)
  isTrending: { type: Boolean, default: false },
  trendingOrder: { type: Number, default: null },

  thumbnailIndex: {
    type: Number,
    default: 0,
  },
});

const ProductSchema = new mongoose.Schema(
  {
    merchantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Merchants",
      required: true,
    },

    name: { type: String, required: true },

    sku: { type: String, unique: true }, // Parent SKU for product
    brand: { type: String },

    description: { type: String },

    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    subcategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subcategory",
    },

    variants: [VariantSchema],

    isActive: { type: Boolean, default: true },
    isSeprate: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Product", ProductSchema);
