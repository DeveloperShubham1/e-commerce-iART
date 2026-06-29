import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import Merchants from "../models/Merchants.js";
import MerchantWebsiteSettings from "../models/MerchantSettings.js";
import multer from "multer";
import multerS3 from "multer-s3";
import s3 from "../configs/s3.js"; // your S3 instance

export const registerMerchant = async (req, res) => {
  try {
    const {
      MerchantName,
      OwnerName,
      phone,
      whatsappNumber,
      email,
      password,
      razorpayKey,
      razorpaySecret,
      logo,
      address,
      categories,
    } = req.body;

    // Basic validation
    if (!MerchantName || !OwnerName || !phone || !email || !password) {
      return res.status(400).json({
        success: false,
        message:
          "MerchantName, OwnerName, phone, email, and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if merchant already exists
    const existingMerchant = await Merchants.findOne({
      $or: [{ email: normalizedEmail }, { phone }],
    });

    if (existingMerchant) {
      return res.status(409).json({
        success: false,
        message: "Merchant with this email or phone already exists",
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create merchant
    const newMerchant = new Merchants({
      MerchantName,
      OwnerName,
      phone,
      whatsappNumber,
      email: normalizedEmail,
      password: hashedPassword,
      razorpayKey,
      razorpaySecret,
      logo,
      address,
      categories,
    });

    await newMerchant.save();

    // Generate JWT token
    const token = jwt.sign(
      { merchantId: newMerchant._id, email: newMerchant.email },
      process.env.JWT_SECRET,
      { expiresIn: "5d" }
    );

    // Set cookie
    res.cookie("merchantToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 5 * 24 * 60 * 60 * 1000,
    });

    // Success response
    return res.status(201).json({
      success: true,
      message: "Merchant registered successfully",
      merchant: {
        _id: newMerchant._id,
        MerchantName: newMerchant.MerchantName,
        email: newMerchant.email,
        phone: newMerchant.phone,
      },
    });
  } catch (error) {
    console.error("Register merchant error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error while registering merchant",
      error: error.message,
    });
  }
};

export const merchantLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const merchant = await Merchants.findOne({ email: normalizedEmail });
    if (!merchant) {
      return res.status(404).json({
        success: false,
        message: "Merchant not found. Please check your email.",
      });
    }

    const isMatch = await bcrypt.compare(password, merchant.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid password." });
    }

    const token = jwt.sign(
      { merchantId: merchant._id, email: merchant.email },
      process.env.JWT_SECRET,
      { expiresIn: "5d" }
    );

    res.cookie("merchantToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 5 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      success: true,
      message: "Merchant logged in successfully",
      merchant: {
        _id: merchant._id,
        MerchantName: merchant.MerchantName,
        email: merchant.email,
        phone: merchant.phone,
        OwnerName: merchant.OwnerName,
      },
    });
  } catch (error) {
    console.error("Merchant login error:", error.message);
    res
      .status(500)
      .json({ success: false, message: "Server error during login" });
  }
};

export const isMerchantAuth = async (req, res) => {
  try {
    return res.json({ success: true, merchant: req.merchant });
  } catch (error) {
    console.error("Merchant auth check error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const merchantLogout = async (req, res) => {
  try {
    res.clearCookie("merchantToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      path: "/", // VERY IMPORTANT
    });

    return res.json({
      success: true,
      message: "Merchant logged out successfully",
    });
  } catch (error) {
    console.error("Merchant logout error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateMerchantPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message:
          "All fields (currentPassword, newPassword, confirmPassword) are required",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New password and confirmation do not match",
      });
    }

    const merchant = await Merchants.findById(req.merchant._id);
    if (!merchant) {
      return res
        .status(404)
        .json({ success: false, message: "Merchant not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, merchant.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    merchant.password = hashedPassword;
    await merchant.save();

    res.clearCookie("merchantToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    });

    return res.json({
      success: true,
      message:
        "Password updated successfully. Please log in again with your new password.",
    });
  } catch (error) {
    console.error("Update password error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateMerchant = async (req, res) => {
  try {
    const { merchantId } = req.params;
    const {
      isSubscribed,
      features,
      subscription,
      razorpayKey,
      razorpaySecret,
      logo,
      address,
    } = req.body;

    if (!merchantId) {
      return res.status(400).json({
        success: false,
        message: "Merchant ID is required",
      });
    }

    const updateFields = {};

    if (typeof isSubscribed === "boolean")
      updateFields.isSubscribed = isSubscribed;

    if (features?.stockManagement !== undefined) {
      updateFields["features.stockManagement"] = features.stockManagement;
    }

    if (subscription) updateFields.subscription = subscription;
    if (razorpayKey) updateFields.razorpayKey = razorpayKey;
    if (razorpaySecret) updateFields.razorpaySecret = razorpaySecret;
    if (logo) updateFields.logo = logo;
    if (address) updateFields.address = address;

    const merchant = await Merchants.findByIdAndUpdate(
      merchantId,
      { $set: updateFields },
      { new: true }
    );

    if (!merchant) {
      return res.status(404).json({
        success: false,
        message: "Merchant not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Merchant updated successfully",
      merchant,
    });
  } catch (error) {
    console.error("Update merchant error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update merchant",
    });
  }
};

// Merchant settings

//  CREATE settings (only once per merchant)
export const createMerchantSettings = async (req, res) => {
  try {
    const merchantId = req.merchant._id;

    // Check if already exists
    const existing = await MerchantWebsiteSettings.findOne({ merchantId });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Settings already exist",
      });
    }

    const { title, title2, title3, primaryColor, fontFamily, darkModeEnabled } =
      req.body;

    const settings = new MerchantWebsiteSettings({
      merchantId,

      title,
      title2,
      title3,

      theme: {
        primaryColor: primaryColor || "#000000",
        fontFamily: fontFamily || "Poppins",
        darkModeEnabled: Boolean(darkModeEnabled),
      },

      branding: {
        logo: req.body["branding.logo.url"]
          ? { url: req.body["branding.logo.url"] }
          : undefined,
        favicon: req.body["branding.favicon.url"]
          ? { url: req.body["branding.favicon.url"] }
          : undefined,
      },

      homepage: {
        bannerTopImageWeb: req.body["homepage.bannerTopImageWeb.url"]
          ? { url: req.body["homepage.bannerTopImageWeb.url"] }
          : undefined,

        bannerTopImageMob: req.body["homepage.bannerTopImageMob.url"]
          ? { url: req.body["homepage.bannerTopImageMob.url"] }
          : undefined,

        bannerBottomImageWeb: req.body["homepage.bannerBottomImageWeb.url"]
          ? { url: req.body["homepage.bannerBottomImageWeb.url"] }
          : undefined,

        bannerBottomImageMob: req.body["homepage.bannerBottomImageMob.url"]
          ? { url: req.body["homepage.bannerBottomImageMob.url"] }
          : undefined,
      },
    });

    await settings.save();

    return res.status(201).json({
      success: true,
      message: "Merchant website settings created successfully",
      data: settings,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

// UPDATE API
export const updateMerchantSettings = async (req, res) => {
  try {
    const merchantId = req.merchant._id;

    const settings = await MerchantWebsiteSettings.findOne({ merchantId });
    if (!settings) {
      return res.status(404).json({
        success: false,
        message: "Settings not found",
      });
    }

    const { title, title2, title3, primaryColor, fontFamily, darkModeEnabled } =
      req.body;

    // -------- TEXT --------
    if (title !== undefined) settings.title = title;
    if (title2 !== undefined) settings.title2 = title2;
    if (title3 !== undefined) settings.title3 = title3;

    // -------- THEME --------
    if (primaryColor !== undefined) settings.theme.primaryColor = primaryColor;

    if (fontFamily !== undefined) settings.theme.fontFamily = fontFamily;

    if (darkModeEnabled !== undefined)
      settings.theme.darkModeEnabled = Boolean(darkModeEnabled);

    // -------- BRANDING --------
    if (req.body["branding.logo.url"] !== undefined) {
      settings.branding.logo = req.body["branding.logo.url"]
        ? { url: req.body["branding.logo.url"] }
        : undefined;
    }

    if (req.body["branding.favicon.url"] !== undefined) {
      settings.branding.favicon = req.body["branding.favicon.url"]
        ? { url: req.body["branding.favicon.url"] }
        : undefined;
    }

    // -------- HOMEPAGE IMAGES --------
    if (req.body["homepage.bannerTopImageWeb.url"] !== undefined) {
      settings.homepage.bannerTopImageWeb = req.body[
        "homepage.bannerTopImageWeb.url"
      ]
        ? { url: req.body["homepage.bannerTopImageWeb.url"] }
        : undefined;
    }

    if (req.body["homepage.bannerTopImageMob.url"] !== undefined) {
      settings.homepage.bannerTopImageMob = req.body[
        "homepage.bannerTopImageMob.url"
      ]
        ? { url: req.body["homepage.bannerTopImageMob.url"] }
        : undefined;
    }

    if (req.body["homepage.bannerBottomImageWeb.url"] !== undefined) {
      settings.homepage.bannerBottomImageWeb = req.body[
        "homepage.bannerBottomImageWeb.url"
      ]
        ? { url: req.body["homepage.bannerBottomImageWeb.url"] }
        : undefined;
    }

    if (req.body["homepage.bannerBottomImageMob.url"] !== undefined) {
      settings.homepage.bannerBottomImageMob = req.body[
        "homepage.bannerBottomImageMob.url"
      ]
        ? { url: req.body["homepage.bannerBottomImageMob.url"] }
        : undefined;
    }

    await settings.save();

    return res.json({
      success: true,
      message: "Merchant website settings updated successfully",
      data: settings,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

// get API
export const getMerchantSettings = async (req, res) => {
  try {
    let merchantId;

    if (req.merchant?._id) {
      merchantId = req.merchant._id;
    } else if (req.query.merchantId || req.body.merchantId) {
      merchantId = req.query.merchantId || req.body.merchantId;
    }

    if (!merchantId) {
      return res.status(400).json({
        success: false,
        message: "Merchant ID missing",
      });
    }

    const settings = await MerchantWebsiteSettings.findOne({ merchantId });

    if (!settings) {
      return res.status(404).json({
        success: false,
        message: "Settings not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};
