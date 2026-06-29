import mongoose from "mongoose";

const ReviewSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: true,
  },
  merchantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Merchants",
    required: true,
  },
  customerPhone: { type: String, required: true },

  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String },

  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Review", ReviewSchema);
