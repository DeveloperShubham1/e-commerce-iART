import mongoose from "mongoose";

const CollectionAssignSchema = new mongoose.Schema(
  {
    merchantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Merchants",
      required: true,
    },
    collection: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Collection",
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
  },
  {
    timestamps: true,
    suppressReservedKeysWarning: true,
  },
);

CollectionAssignSchema.index(
  {
    merchantId: 1,
    collection: 1,
    product: 1,
  },
  {
    unique: true,
  },
);

CollectionAssignSchema.index({
  collection: 1,
});

CollectionAssignSchema.index({
  product: 1,
});

export default mongoose.model("CollectionAssign", CollectionAssignSchema);
