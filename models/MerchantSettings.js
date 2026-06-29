import mongoose from "mongoose";

const merchantWebsiteSettingsSchema = new mongoose.Schema(
  {
    merchantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Merchant",
      required: true,
      unique: true, // one settings doc per merchant
    },
    // Branding
    branding: {
      logo: {
        url: { type: String }, // uploaded logo URL
      },
      favicon: {
        url: { type: String },
      },
    },
    // Homepage / Front Images
    homepage: {
      bannerTopImageWeb: {
        url: { type: String },
      },
      bannerTopImageMob: {
        url: { type: String },
      },
      bannerBottomImageWeb: {
        url: { type: String },
      },
      bannerBottomImageMob: {
        url: { type: String },
      },
    },

    title: {
      type: String,
    },
    title2: {
      type: String,
    },
    title3: {
      type: String,
    },

    // Theme & UI settings
    theme: {
      primaryColor: { type: String, default: "#000000" },
      fontFamily: { type: String, default: "Poppins" },
      darkModeEnabled: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

export default mongoose.model(
  "MerchantWebsiteSettings",
  merchantWebsiteSettingsSchema
);
