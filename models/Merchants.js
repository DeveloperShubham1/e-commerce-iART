import mongoose from "mongoose";

const MerchantSchema = new mongoose.Schema({
  MerchantName: { type: String, required: true },
  OwnerName: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  whatsappNumber: { type: String },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },

  razorpayKey: { type: String },
  razorpaySecret: { type: String },

  // 🔐 Subscription & Features
  isSubscribed: {
    type: Boolean,
    default: false,
  },

  features: {
    stockManagement: {
      type: Boolean,
      default: false,
    },
  },

  subscription: {
    planName: { type: String }, // basic / pro / premium
    startDate: { type: Date },
    endDate: { type: Date },
  },

  logo: { type: String },
  address: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Merchants", MerchantSchema);
