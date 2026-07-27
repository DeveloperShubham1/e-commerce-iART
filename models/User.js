import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    instagramId: { type: String, unique: true, sparse: true },
    isGuest: { type: Boolean, default: false },
    cartItems: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
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

const User = mongoose.models.user || mongoose.model("user", userSchema);

export default User;
