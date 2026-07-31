import mongoose from "mongoose";
const guestCartSchema = new mongoose.Schema(
  {
    guestId: {
      type: String,
      required: true,
      unique: true, // UUID
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
          required: true,
        },

        size: {
          type: String,
          required: true,
        },

        quantity: {
          type: Number,
          min: 1,
          default: 1,
        },

        price: {
          type: Number,
          required: true,
        },

        offerPrice: {
          type: Number,
        },
      },
    ],
  },
  { timestamps: true },
);

export default mongoose.model("GuestCart", guestCartSchema);
