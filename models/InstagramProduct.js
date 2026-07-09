import mongoose from "mongoose";

const instagramProductSchema = new mongoose.Schema(
  {
    instagram_media_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    merchantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Merchants",
      required: true,
    },

    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    product_url: {
      type: String,
      required: true,
    },
    title: {
      type: String,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } },
);

export default mongoose.model("InstagramProduct", instagramProductSchema);
