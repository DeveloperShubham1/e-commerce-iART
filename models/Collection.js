import mongoose from "mongoose";

const CollectionSchema = new mongoose.Schema(
  {
    merchantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Merchants",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: String,
    image: {
      key: String,
      url: String,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Collection", CollectionSchema);
