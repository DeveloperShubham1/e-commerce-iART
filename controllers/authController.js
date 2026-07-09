import jwt from "jsonwebtoken";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { consumeIgAuthToken } from "../services/authTokenService.js";

export async function igExchange(req, res) {
  const { token } = req.query;
  if (!token) {
    return res.status(400).json({ success: false, message: "Missing token" });
  }

  const payload = await consumeIgAuthToken(token);
  if (!payload) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid or expired link" });
  }

  let user = await User.findOne({ instagramId: payload.igsid });

  if (!user) {
    // No linked account yet — provision a shadow user so req.user._id
    // works everywhere downstream, exactly like a real logged-in user.
    const randomPassword = crypto.randomBytes(24).toString("hex");
    user = await User.create({
      name: payload.username || "Instagram User",
      email: `ig_${payload.igsid}@guest.local`,
      password: randomPassword, // never used to log in directly; hash it if your schema expects hashed passwords elsewhere
      instagramId: payload.igsid,
      isGuest: true,
    });
  }

  const userToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  res.cookie("userToken", userToken, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.json({ success: true, isGuest: user.isGuest });
}

// controllers/authController.js
export async function completeGuestProfile(req, res) {
  const userId = req.user?._id;
  if (!userId)
    return res.status(401).json({ success: false, message: "Unauthorized" });

  const { name, email, password } = req.body;
  if (!email || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Email and password required" });
  }

  const existing = await User.findOne({ email, _id: { $ne: userId } });
  if (existing) {
    return res
      .status(409)
      .json({ success: false, message: "Email already in use" });
  }

  const hashed = await bcrypt.hash(password, 10); // match whatever your signup flow already uses
  const user = await User.findByIdAndUpdate(
    userId,
    { name: name || undefined, email, password: hashed, isGuest: false },
    { new: true },
  );

  return res.json({
    success: true,
    message: "Profile completed",
    isGuest: user.isGuest,
  });
}
