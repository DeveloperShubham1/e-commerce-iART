import mongoose from "mongoose";

const webhookEventSchema = new mongoose.Schema(
  {
    event_type: { type: String, index: true }, // e.g. "comments"
    raw_payload: { type: mongoose.Schema.Types.Mixed },
    processed: { type: Boolean, default: false, index: true },
    processing_error: { type: String, default: null },
  },
  { timestamps: { createdAt: "received_at", updatedAt: "updated_at" } }
);

export default mongoose.model("WebhookEvent", webhookEventSchema);
