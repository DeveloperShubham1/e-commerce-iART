import mongoose from "mongoose";

const CategorySchema = new mongoose.Schema({
  merchantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Merchants",
    required: true,
  },
  name: { type: String, required: true },
  description: { type: String },
  image: {
    key: { type: String },
    url: { type: String },
  },

  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Category", CategorySchema);
