// models/IgAuthToken.js
import mongoose from "mongoose";

const igAuthTokenSchema = new mongoose.Schema({
  jti: { type: String, required: true, unique: true },
  merchant_id: { type: mongoose.Schema.Types.ObjectId, required: true },
  igsid: { type: String, required: true },
  username: String,
  comment_id: String,
  product_id: String,
  used: { type: Boolean, default: false },
  expiresAt: { type: Date, required: true },
});

// igAuthTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // auto-cleanup

export default mongoose.models.IgAuthToken ||
  mongoose.model("IgAuthToken", igAuthTokenSchema);