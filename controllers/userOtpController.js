import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import {
  generateOtp,
  sendOtpToPhone,
  isValidPhone,
  verifyOtpForPhone,
} from "../utils/otpUtils.js";

// -------------------------------------------------------------------------
// POST /otp/send
// body: { phone, merchantId }
// -------------------------------------------------------------------------
export const sendOtp = async (req, res) => {
  try {
    const { phone, merchantId } = req.body;

    if (!phone || !merchantId) {
      return res.status(400).json({
        success: false,
        message: "Phone and merchantId are required",
      });
    }

    if (!isValidPhone(phone)) {
      return res.status(400).json({
        success: false,
        message: "Invalid phone number",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(merchantId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid merchantId",
      });
    }

    const otp = generateOtp();

    await sendOtpToPhone(phone, otp);

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.error("Send OTP Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// -------------------------------------------------------------------------
// POST /otp/resend
// body: { phone, merchantId }
// -------------------------------------------------------------------------
export const resendOtp = async (req, res) => {
  try {
    const { phone, merchantId } = req.body;

    if (!phone || !merchantId) {
      return res.status(400).json({
        success: false,
        message: "Phone and merchantId are required",
      });
    }

    if (!isValidPhone(phone)) {
      return res.status(400).json({
        success: false,
        message: "Invalid phone number",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(merchantId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid merchantId",
      });
    }

    const otp = generateOtp();

    await sendOtpToPhone(phone, otp);

    return res.status(200).json({
      success: true,
      message: "OTP resent successfully",
    });
  } catch (error) {
    console.error("Resend OTP Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// -------------------------------------------------------------------------
// POST /otp/verify
// body: { phone, otp, merchantId }
// If user exists -> Login
// If user doesn't exist -> Register + Login
// -------------------------------------------------------------------------
export const verifyOtp = async (req, res) => {
  try {
    const { phone, otp, merchantId } = req.body;

    if (!phone || !otp || !merchantId) {
      return res.status(400).json({
        success: false,
        message: "Phone, OTP and merchantId are required",
      });
    }

    if (!isValidPhone(phone)) {
      return res.status(400).json({
        success: false,
        message: "Invalid phone number",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(merchantId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid merchantId",
      });
    }

    // OTP Verification
    try {
      await verifyOtpForPhone(phone, otp);
    } catch (err) {
      return res.status(err.statusCode || 400).json({
        success: false,
        message: err.message,
      });
    }

    let user = await User.findOne({
      phone,
      merchantData: {
        $elemMatch: {
          merchantId,
        },
      },
    });

    let isNewUser = false;

    // Register automatically if user doesn't exist
    if (!user) {
      isNewUser = true;

      try {
        user = await User.create({
          phone,
          isGuest: false,
          merchantData: [
            {
              merchantId,
            },
          ],
        });
      } catch (err) {
        // Handle duplicate key race condition
        if (err.code === 11000) {
          user = await User.findOne({
            phone,
            merchantData: {
              $elemMatch: {
                merchantId,
              },
            },
          });
        } else {
          throw err;
        }
      }
    }

    const token = jwt.sign(
      {
        userId: user._id,
        merchantId,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      },
    );

    res.cookie("userToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: isNewUser
        ? "User registered successfully"
        : "Logged in successfully",
      isNewUser,
      token,
      user: {
        _id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
      },
      cartItems: user.cartItems,
    });
  } catch (error) {
    console.error("Verify OTP Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// name / email are updated immediately.
// phone, if changed, is NOT written yet — an OTP is sent to the new number.
// The change only takes effect once /api/user/verify-phone-update is
// called with the correct code.
// -------------------------------------------------------------------------
export const updateProfile = async (req, res) => {
  try {
    const userId = req?.user?._id;

    const { name, email, phone, merchantId } = req.body;

    if (!merchantId || !mongoose.Types.ObjectId.isValid(merchantId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid merchantId",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // ---- name ----
    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Name cannot be empty",
        });
      }
      user.name = name.trim();
    }

    // ---- email ----
    if (email !== undefined && email !== user.email) {
      if (!isValidEmail(email)) {
        return res.status(400).json({
          success: false,
          message: "Invalid email",
        });
      }

      const emailTaken = await User.findOne({
        _id: { $ne: userId },
        email,
        merchantData: { $elemMatch: { merchantId } },
      });

      if (emailTaken) {
        return res.status(400).json({
          success: false,
          message: "Email already in use",
        });
      }

      user.email = email;
    }

    let phoneVerificationRequired = false;

    // ---- phone (needs OTP before it actually changes) ----
    if (phone !== undefined && phone !== user.phone) {
      if (!isValidPhone(phone)) {
        return res.status(400).json({
          success: false,
          message: "Invalid phone number",
        });
      }

      const phoneTaken = await User.findOne({
        _id: { $ne: userId },
        phone,
        merchantData: { $elemMatch: { merchantId } },
      });

      if (phoneTaken) {
        return res.status(400).json({
          success: false,
          message: "Phone number already in use",
        });
      }

      const otp = generateOtp();
      await sendOtpToPhone(phone, otp);

      phoneVerificationRequired = true;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: phoneVerificationRequired
        ? "Profile updated. Enter the OTP sent to your new number to confirm the phone change."
        : "Profile updated successfully",
      phoneVerificationRequired,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error("Update Profile Error:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Email or phone already in use",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// -------------------------------------------------------------------------
// POST /api/user/resend-phone-update-otp   (protected)
// body: { phone, merchantId }
// -------------------------------------------------------------------------
export const resendPhoneUpdateOtp = async (req, res) => {
  try {
    const { phone, merchantId } = req.body;

    if (!phone || !merchantId) {
      return res.status(400).json({
        success: false,
        message: "Phone and merchantId are required",
      });
    }

    if (!isValidPhone(phone)) {
      return res.status(400).json({
        success: false,
        message: "Invalid phone number",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(merchantId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid merchantId",
      });
    }

    const otp = generateOtp();
    await sendOtpToPhone(phone, otp);

    return res.status(200).json({
      success: true,
      message: "OTP resent successfully",
    });
  } catch (error) {
    console.error("Resend Phone Update OTP Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// -------------------------------------------------------------------------
// POST /api/user/verify-phone-update   (protected)
// body: { phone, otp, merchantId }
//
// Finalizes the phone change started by updateProfile.
// -------------------------------------------------------------------------
export const verifyPhoneUpdate = async (req, res) => {
  try {
    const userId = req?.user?._id;
    const { phone, otp, merchantId } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Not authorized",
      });
    }

    if (!phone || !otp || !merchantId) {
      return res.status(400).json({
        success: false,
        message: "Phone, OTP and merchantId are required",
      });
    }

    if (!isValidPhone(phone)) {
      return res.status(400).json({
        success: false,
        message: "Invalid phone number",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(merchantId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid merchantId",
      });
    }

    // OTP verification
    try {
      await verifyOtpForPhone(phone, otp);
    } catch (err) {
      return res.status(err.statusCode || 400).json({
        success: false,
        message: err.message,
      });
    }

    // re-check in case someone else grabbed this number in the meantime
    const phoneTaken = await User.findOne({
      _id: { $ne: userId },
      phone,
      merchantData: { $elemMatch: { merchantId } },
    });

    if (phoneTaken) {
      return res.status(400).json({
        success: false,
        message: "Phone number already in use",
      });
    }

    const user = await User.findByIdAndUpdate(userId, { phone }, { new: true });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Phone number updated successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error("Verify Phone Update Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
