import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
    {
        phone: { type: String, required: true, index: true },
        otpHash: { type: String, required: true },
        sessionId: { type: String }, // 2Factor's "Details" id, useful for support lookups
        expiresAt: { type: Date, required: true },
        attempts: { type: Number, default: 0 },
        verified: { type: Boolean, default: false },
    },
    { timestamps: true }
);

// Housekeeping only — real expiry is enforced in otpUtils before this fires
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 600 });

const Otp = mongoose.models.otp || mongoose.model("otp", otpSchema);
export default Otp;