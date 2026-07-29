import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    instagramId: { type: String, unique: true, sparse: true },
    isGuest: { type: Boolean, default: false },
    merchantData: {
      type: [
        {
          merchantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Merchants",
            required: true,
          },
        },
      ],
      default: [],
    },
    cartItems: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },

        merchantId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Merchants",
        },

        variantId: {
          type: mongoose.Schema.Types.ObjectId,
          required: true, // _id of variant (color)
        },

        size: {
          type: String,
          required: true, // S, M, L, XL
        },

        quantity: {
          type: Number,
          required: true,
          min: 1,
          default: 1,
        },

        price: {
          type: Number,
          required: true, // price at time of add
        },

        offerPrice: {
          type: Number, // optional
          default: 1,
        },
      },
    ],
  },
  { minimize: false },
);

userSchema.index({ email: 1, "merchantData.merchantId": 1 }, { unique: true });

const User = mongoose.models.user || mongoose.model("user", userSchema);

export default User;
