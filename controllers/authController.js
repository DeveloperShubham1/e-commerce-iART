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

    const hashedPassword = await bcrypt.hash(randomPassword, 10);
    user = await User.create({
      name: payload.username || "Instagram User",
      email: `ig_${payload.igsid}@guest.local`,
      password: hashedPassword, // never used to log in directly; hash it if your schema expects hashed passwords elsewhere
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


export async function completeGuestProfile(req, res) {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { name, email, password, currentPassword } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Email can only be changed by guest users
    if (!user.isGuest && email && email !== user.email) {
      return res.status(400).json({
        success: false,
        message: "Email cannot be changed.",
      });
    }

    // Guest user flow
    if (user.isGuest) {
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: "Email and password are required.",
        });
      }

      // Check email uniqueness
      const existingUser = await User.findOne({
        email,
        _id: { $ne: userId },
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "Email already in use.",
        });
      }

      user.email = email;
      user.password = await bcrypt.hash(password, 10);
      user.isGuest = false;
    } else {
      // Existing user must provide current password to change password
      if (password) {
        if (!currentPassword) {
          return res.status(400).json({
            success: false,
            message: "Current password is required.",
          });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);

        if (!isMatch) {
          return res.status(400).json({
            success: false,
            message: "Current password is incorrect.",
          });
        }

        user.password = await bcrypt.hash(password, 10);
      }
    }

    // Name can always be updated
    if (name) {
      user.name = name;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: user.isGuest
        ? "Profile updated successfully."
        : "Profile completed successfully.",
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isGuest: user.isGuest,
      },
    });
  } catch (error) {
    console.error("Complete guest profile error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error.",
    });
  }
}
