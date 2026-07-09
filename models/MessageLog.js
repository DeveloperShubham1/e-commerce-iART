import mongoose from "mongoose";

const messageLogSchema = new mongoose.Schema(
  {
    comment_id: {
      type: String,
      required: true,
      unique: true, // <-- enforces "one reply per comment" at the DB level
      index: true,
    },
    media_id: { type: String, index: true },
    commenter_id: { type: String },
    commenter_username: { type: String },
    comment_text: { type: String },

    product_id: { type: String },
    product_url: { type: String },

    dm_sent: { type: Boolean, default: false },
    dm_error: { type: String, default: null },

    reply_sent: { type: Boolean, default: false },
    reply_error: { type: String, default: null },

    status: {
      type: String,
      enum: ["pending", "success", "partial_failure", "failed", "no_product_match"],
      default: "pending",
      index: true,
    },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

export default mongoose.model("MessageLog", messageLogSchema);
