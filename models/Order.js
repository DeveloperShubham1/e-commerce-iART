import mongoose from "mongoose";
const OrderSchema = new mongoose.Schema({
  orderId: { type: String, unique: true, required: true },
  razorpayOrderId: { type: String },
  paymentId: { type: String },
  merchantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Merchants",
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },

  address: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "address",
    required: true,
  },
  items: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      size: String,
      quantity: Number,
      color: String,
      variantId: String,
      mrp: Number,
      discountPercent: Number,
      price: Number,
    },
  ],
  totalAmount: { type: Number, required: true },
  amountPaid: { type: Number, default: 0, min: 0 },
  paymentStatus: {
    type: String,
    enum: ["pending", "partial", "paid", "failed"],
    default: "pending",
  },
  //  status as tracking Id
  status: { type: String },
  paymentType: { type: String, required: true },
  isPaid: { type: Boolean, required: true, default: false },
  orderStatus: {
    type: String,
    enum: ["pending", "confirmed", "shipped", "delivered", "cancelled","partial_shipped"],
    default: "pending",
  },
  shipment: {
    trackingNumber: String,
    courierName: String,
    courierLink: String,
  },
  trackingPartner: {
    type: String,
    enum: [
      "delhivery",
      "xpressbees",
      "blue_dart",
      "india_post",
      "dtdc",
      "ekart_logistics",
      "ecom_express",
      "shadowfax",
      "amazon_shipping",
      "india_post_speed_post",
      "aramex",
      "loadshare",
      "smartr_logistics",
      "borzo",
      "dunzo",
      "blitz",
      "pidge",
      "pick_n_del",
    ],
  },
  paymentImage: {
    type: [String],
    default: [],
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// 🔹 ADD THIS BLOCK
OrderSchema.virtual("pendingAmount").get(function () {
  return Math.max((this.totalAmount || 0) - (this.amountPaid || 0), 0);
});

OrderSchema.set("toJSON", { virtuals: true });
OrderSchema.set("toObject", { virtuals: true });

export default mongoose.model("Order", OrderSchema);
