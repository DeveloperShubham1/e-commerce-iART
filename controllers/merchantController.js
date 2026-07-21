import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import Merchant from "../models/Merchants.js";
import MerchantWebsiteSettings from "../models/MerchantSettings.js";
import multer from "multer";
import multerS3 from "multer-s3";
import s3 from "../configs/s3.js"; // your S3 instance
import axios from "axios";
import { maskToken, maskInstagram } from "../utils/helper.js";
import {
  fetchFacebookPages,
  fetchInstagramBusinessAccount,
} from "../services/instagramApi.js";

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
    const existingMerchant = await Merchant.findOne({
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
    const newMerchant = new Merchant({
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
      { expiresIn: "5d" },
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

    const merchant = await Merchant.findOne({ email: normalizedEmail });
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
      { expiresIn: "5d" },
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

    const merchant = await Merchant.findById(req.merchant._id);
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

    const merchant = await Merchant.findByIdAndUpdate(
      merchantId,
      { $set: updateFields },
      { new: true },
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

export const updatePaymentConfig = async (req, res) => {
  try {
    const merchantId = req.merchant?._id;

    const merchant = await Merchant.findById(merchantId);

    if (!merchant) {
      return res.status(404).json({
        success: false,
        message: "Merchant not found.",
      });
    }

    const {
      razorpayKey,
      razorpaySecret,
      isRazorpayenabled,
      upiEnabled,
      codEnabled,
      upiId,
      qrCodeImage,
    } = req.body;

    const updateData = {
      isRazorpayenabled: isRazorpayenabled === true,
      "upi.codEnabled": codEnabled === true,
      "upi.enabled": upiEnabled === true,
      "upi.upiId": upiId || null,
      "upi.qrCodeImage": qrCodeImage || null,
    };

    // Update only if a new key is entered
    if (razorpayKey && !razorpayKey.startsWith("****")) {
      updateData.razorpayKey = razorpayKey.trim();
    }

    // Update only if a new secret is entered
    if (razorpaySecret && !razorpaySecret.startsWith("*")) {
      updateData.razorpaySecret = razorpaySecret.trim();
    }

    const updatedMerchant = await Merchant.findByIdAndUpdate(
      merchantId,
      { $set: updateData },
      { new: true },
    ).select("razorpayKey razorpaySecret isRazorpayenabled upi");

    return res.status(200).json({
      success: true,
      message: "Payment configuration updated successfully.",
      data: {
        isRazorpayenabled: updatedMerchant.isRazorpayenabled,
        razorpayKey: updatedMerchant.razorpayKey
          ? `****${updatedMerchant.razorpayKey.slice(-4)}`
          : "",
        razorpaySecret: updatedMerchant.razorpaySecret
          ? "****************"
          : "",
        upi: updatedMerchant.upi,
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong.",
      error: error.message,
    });
  }
};

export const getPaymentConfig = async (req, res) => {
  try {
    const merchantId = req.merchant?._id;

    const merchant = await Merchant.findById(merchantId).select(
      "razorpayKey razorpaySecret isRazorpayenabled upi",
    );

    if (!merchant) {
      return res.status(404).json({
        success: false,
        message: "Merchant not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Payment configuration fetched successfully.",
      data: {
        isRazorpayenabled: merchant.isRazorpayenabled,
        razorpayKey: merchant.razorpayKey
          ? `****${merchant.razorpayKey.slice(-4)}`
          : "",
        razorpaySecret: merchant.razorpaySecret ? "****************" : "",
        upi: merchant.upi,
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong.",
      error: error.message,
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

// UPDATE API for settings
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

// get API for settings
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

    const merchant = await Merchant.findById(merchantId);

    if (!merchant) {
      return res.status(404).json({
        success: false,
        message: "Merchant not found",
      });
    }

    const settings = await MerchantWebsiteSettings.findOne({ merchantId });

    if (!settings) {
      return res.status(404).json({
        success: false,
        message: "Settings not found",
      });
    }

    // Convert mongoose document to plain object
    const settingsData = settings.toObject();

    // Add contact information from Merchant model
    settingsData.contact = {
      email: merchant.email || "",
      phone: merchant.phone || "",
      address: merchant.address || "",
      merchantName: merchant.merchantName || "",
      ownerName: merchant.ownerName || "",
    };

    return res.status(200).json({
      success: true,
      data: settingsData,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

// GET /api/merchant/:merchantId/instagram
export async function getInstagramConfig(req, res) {
  let merchantId = req.merchant._id;

  try {
    const merchant = await Merchant.findById(merchantId).select(
      "MerchantName instagram",
    );

    if (!merchant) {
      return res
        .status(404)
        .json({ success: false, message: "Merchant not found" });
    }

    const ig = merchant.instagram?.toObject() || {};
    const appId = process.env.META_APP_ID || "";
    const igBusinessId = merchant.instagram?.igBusinessId || "";
    const graphApiVersion = process.env.META_GRAPH_VERSION || "v25.0";
    const tokenExpiresAt = merchant.instagram?.tokenExpiresAt || "";
    const isConnected = merchant.instagram?.isConnected || "";
    const siteBaseUrl = merchant.instagram?.siteBaseUrl;
    // if (ig.accessToken) ig.accessToken = maskToken(ig.accessToken);
    // if (ig.pageAccessToken) ig.pageAccessToken = maskToken(ig.pageAccessToken);
    // if (ig.appSecret) ig.appSecret = maskToken(ig.appSecret);

    // return res.json({
    //   success: true, instagram: ig
    // });
    return res.json({
      success: true,
      instagram: {
        appId,
        igBusinessId,
        graphApiVersion,
        tokenExpiresAt,
        isConnected,
        siteBaseUrl,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// PUT /api/merchant/:merchantId/instagram
export async function updateInstagramConfig(req, res) {
  try {
    const {
      accessToken,
      pageAccessToken,
      igBusinessId,
      pageId,
      appSecret,
      verifyToken,
      graphApiVersion,
      siteBaseUrl,
      appId,
      InstagramAppSecret,
      whatsappPhoneNumberId,
    } = req.body;

    let merchantId = req.merchant._id;

    const update = {};
    if (accessToken !== undefined)
      update["instagram.accessToken"] = accessToken.trim();
    if (pageAccessToken !== undefined)
      update["instagram.pageAccessToken"] = pageAccessToken.trim();
    if (igBusinessId !== undefined)
      update["instagram.igBusinessId"] = igBusinessId.trim();
    if (pageId !== undefined) update["instagram.pageId"] = pageId.trim();
    if (appSecret !== undefined)
      update["instagram.appSecret"] = appSecret.trim();
    if (verifyToken !== undefined)
      update["instagram.verifyToken"] = verifyToken.trim();
    if (graphApiVersion !== undefined)
      update["instagram.graphApiVersion"] = graphApiVersion.trim();
    if (siteBaseUrl !== undefined)
      update["instagram.siteBaseUrl"] = siteBaseUrl.trim();
    if (appId !== undefined) update["instagram.appId"] = appId.trim();
    if (InstagramAppSecret !== undefined)
      update["instagram.InstagramAppSecret"] = InstagramAppSecret.trim();
    if (whatsappPhoneNumberId !== undefined)
      update["instagram.whatsappPhoneNumberId"] = whatsappPhoneNumberId.trim();

    if (Object.keys(update).length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No fields provided to update" });
    }

    const merchant = await Merchant.findByIdAndUpdate(
      merchantId,
      { $set: update },
      { new: true, runValidators: true },
    ).select("MerchantName instagram");

    if (!merchant) {
      return res
        .status(404)
        .json({ success: false, message: "Merchant not found" });
    }

    return res.json({
      success: true,
      message: "Instagram config updated",
      // instagram: maskInstagram(merchant.instagram),
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function verifyInstagramToken(req, res) {
  let merchantId = req.merchant._id;
  try {
    const merchant = await Merchant.findById(merchantId);
    if (!merchant) {
      return res
        .status(404)
        .json({ success: false, message: "Merchant not found" });
    }

    const token = merchant.instagram?.accessToken;
    const appSecret = merchant.instagram?.appSecret;
    const appId = merchant.instagram?.appId || process.env.APP_ID;

    if (!token) {
      return res.status(400).json({
        success: false,
        message:
          "No accessToken saved. Save it first via PUT /:merchantId/instagram",
      });
    }
    if (!appSecret) {
      return res.status(400).json({
        success: false,
        message:
          "No appSecret saved. Save it first via PUT /:merchantId/instagram",
      });
    }
    if (!appId) {
      return res.status(500).json({
        success: false,
        message:
          "APP_ID missing — save it via PUT /:merchantId/instagram or set APP_ID in .env",
      });
    }

    // App Access Token = APP_ID|APP_SECRET
    // This authenticates the debug_token request itself (not the token being inspected).
    const appAccessToken = `${appId}|${appSecret}`;

    const debugRes = await axios.get("https://graph.facebook.com/debug_token", {
      params: {
        input_token: token,
        access_token: appAccessToken,
      },
      timeout: 15000,
    });

    const data = debugRes.data?.data;

    // ── Invalid / expired ─────────────────────────────────────────
    if (!data?.is_valid) {
      await Merchant.findByIdAndUpdate(merchantId, {
        $set: { "instagram.isConnected": false },
      });
      return res.status(400).json({
        success: false,
        message:
          "Token is invalid or expired. Please reconnect your Instagram account.",
        is_valid: false,
        error_code: data?.error?.code,
        error_message: data?.error?.message,
      });
    }

    // ── Parse granular_scopes ─────────────────────────────────────
    // granular_scopes is an array like:
    // [ { scope: "instagram_basic", target_ids: ["17841444067130098"] }, ... ]
    // We extract the key account IDs automatically so merchants
    // never have to look them up and type them manually.
    const granularScopes = data.granular_scopes || [];
    const grantedScopes = data.scopes || [];

    // Build a flat map:  scope_name → target_ids[]
    const scopeMap = {};
    granularScopes.forEach(({ scope, target_ids }) => {
      scopeMap[scope] = target_ids || [];
    });

    // Extract the three key IDs from the scope map
    const igBusinessId = scopeMap["instagram_basic"]?.[0] || null;
    const pageId = scopeMap["pages_show_list"]?.[0] || null;
    const businessManagerId = scopeMap["business_management"]?.[0] || null;

    // ── Build update ──────────────────────────────────────────────
    const update = {
      "instagram.isConnected": true,
      "instagram.tokenExpiresAt": data.data_access_expires_at
        ? new Date(data.data_access_expires_at * 1000)
        : null,

      // Auto-save extracted IDs (only overwrite if we got a value)
      ...(igBusinessId && { "instagram.igBusinessId": igBusinessId }),
      ...(pageId && { "instagram.pageId": pageId }),
      ...(businessManagerId && {
        "instagram.businessManagerId": businessManagerId,
      }),

      // Store scopes for UI display / permission checks
      "instagram.grantedScopes": grantedScopes,
      "instagram.granularScopes": scopeMap,
    };

    await Merchant.findByIdAndUpdate(merchantId, { $set: update });

    // ── Response ──────────────────────────────────────────────────
    return res.json({
      success: true,
      message: "Token is valid. Account IDs extracted and saved automatically.",
      is_valid: true,

      // Extracted IDs — shown so admin can confirm they're correct
      // extracted: {
      //   igBusinessId,
      //   pageId,
      //   businessManagerId,
      // },

      // Token info
      // app_id: data.app_id,
      expires_at: data.data_access_expires_at
        ? new Date(data.data_access_expires_at * 1000)
        : null,
      //   scopes: grantedScopes,

      // Full scope map for reference
      // granularScopes: scopeMap,
    });
  } catch (err) {
    const metaError = err?.response?.data?.error;
    return res.status(500).json({
      success: false,
      message: metaError?.message || err.message,
      error_type: metaError?.type,
      error_code: metaError?.code,
    });
  }
}

//  POST /api/merchant/:merchantId/instagram/subscribe-webhook
export async function subscribeWebhook(req, res) {
  try {
    const merchantId = req.merchant._id;

    const merchant = await Merchant.findById(merchantId);
    if (!merchant) {
      return res
        .status(404)
        .json({ success: false, message: "Merchant not found" });
    }

    const {
      pageAccessToken,
      igBusinessId,
      graphApiVersion = "v25.0",
    } = merchant.instagram || {};

    if (!pageAccessToken) {
      return res.status(400).json({
        success: false,
        message: "pageAccessToken is missing. Save it first via PUT /instagram",
      });
    }

    if (!igBusinessId) {
      return res.status(400).json({
        success: false,
        message:
          "igBusinessId is missing. Call POST /instagram/verify-token first to extract it automatically",
      });
    }

    // ✅ graph.instagram.com — correct host for Instagram Login (instagram_basic scopes)
    // graph.facebook.com would return code 3 "Application does not have the capability"
    // because this token is scoped to Instagram, not a Facebook Page.
    const subscribeRes = await axios.post(
      `https://graph.instagram.com/${graphApiVersion}/${igBusinessId}/subscribed_apps`,
      null,
      {
        params: {
          access_token: pageAccessToken,
          subscribed_fields: "comments",
        },
        timeout: 15000,
      },
    );

    if (subscribeRes.data?.success) {
      // Save subscription state so dashboard can show connected status
      await Merchant.findByIdAndUpdate(merchantId, {
        $set: {
          "instagram.webhookSubscribed": true,
          "instagram.webhookSubscribedAt": new Date(),
        },
      });

      return res.json({
        success: true,
        message: "Webhook subscription activated for comments",
      });
    }

    return res.status(400).json({
      success: false,
      message: "Meta returned success: false",
      meta_response: subscribeRes.data,
    });
  } catch (err) {
    console.error("subscribeWebhook error:", err.response?.data || err.message);
    return res.status(500).json({
      success: false,
      message: err.response?.data?.error?.message || err.message,
      meta_error: err.response?.data || null,
    });
  }
}

// GET /api/merchant/:merchantId/instagram/subscription-status
export async function getSubscriptionStatus(req, res) {
  try {
    const merchantId = req.merchant._id;

    const merchant = await Merchant.findById(merchantId);
    if (!merchant) {
      return res
        .status(404)
        .json({ success: false, message: "Merchant not found" });
    }

    const {
      pageAccessToken,
      igBusinessId,
      graphApiVersion = "v25.0",
    } = merchant.instagram || {};

    if (!pageAccessToken || !igBusinessId) {
      return res.status(400).json({
        success: false,
        message:
          "pageAccessToken and igBusinessId are required. Call verify-token first.",
      });
    }

    // ✅ graph.instagram.com — same host as subscribe call
    const response = await axios.get(
      `https://graph.instagram.com/${graphApiVersion}/${igBusinessId}/subscribed_apps`,
      {
        params: { access_token: pageAccessToken },
        timeout: 15000,
      },
    );

    const subscriptions = response.data?.data || [];
    const isSubscribed = subscriptions.some((s) =>
      s.subscribed_fields?.includes("comments"),
    );

    // Sync DB state if it's out of sync with Meta's actual state
    if (isSubscribed !== merchant.instagram.webhookSubscribed) {
      await Merchant.findByIdAndUpdate(merchantId, {
        $set: { "instagram.webhookSubscribed": isSubscribed },
      });
    }

    return res.json({
      success: true,
      subscribed: isSubscribed,
      subscriptions,
    });
  } catch (err) {
    console.error(
      "getSubscriptionStatus error:",
      err.response?.data || err.message,
    );
    return res.status(500).json({
      success: false,
      message: err.response?.data?.error?.message || err.message,
      meta_error: err.response?.data || null,
    });
  }
}

// DELETE /api/merchant/:merchantId/instagram
export async function disconnectInstagram(req, res) {
  let merchantId = req.merchant._id;
  try {
    const merchant = await Merchant.findByIdAndUpdate(
      merchantId,
      {
        $set: {
          instagram: {
            accessToken: null,
            pageAccessToken: null,
            igBusinessId: null,
            pageId: null,
            appSecret: null,
            verifyToken: null,
            graphApiVersion: "v25.0",
            siteBaseUrl: null,
            tokenExpiresAt: null,
            isConnected: false,
            webhookSubscribed: false,
            webhookSubscribedAt: null,
          },
        },
      },
      { new: true },
    ).select("MerchantName instagram");

    if (!merchant) {
      return res
        .status(404)
        .json({ success: false, message: "Merchant not found" });
    }

    return res.json({
      success: true,
      message: "Instagram integration disconnected",
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
//Auto-refresh endpoint
export async function refreshInstagramToken(req, res) {
  let merchantId = req.merchant._id;
  try {
    const merchant = await Merchant.findById(merchantId);
    if (!merchant) {
      return res
        .status(404)
        .json({ success: false, message: "Merchant not found" });
    }

    const currentToken = merchant.instagram?.accessToken;
    if (!currentToken) {
      return res.status(400).json({
        success: false,
        message: "No accessToken saved. Nothing to refresh.",
      });
    }

    const appId = process.env.META_APP_ID || merchant.instagram?.appId;
    const appSecret =
      process.env.META_APP_SECRET || merchant.instagram?.appSecret;

    if (!appId || !appSecret) {
      return res.status(500).json({
        success: false,
        message: "APP_ID or APP_SECRET missing from server config",
      });
    }

    const refreshRes = await axios.get(
      "https://graph.facebook.com/v25.0/oauth/access_token",
      {
        params: {
          grant_type: "fb_exchange_token",
          client_id: appId,
          client_secret: appSecret,
          fb_exchange_token: currentToken,
        },
        timeout: 15000,
      },
    );

    const { access_token, expires_in, token_type } = refreshRes.data;

    if (!access_token) {
      return res.status(400).json({
        success: false,
        message: "Meta did not return a new token",
        meta_response: refreshRes.data,
      });
    }

    // If Meta doesn't return expires_in, assume 60 days (standard long-lived token lifetime)
    const expirySeconds = expires_in || 60 * 24 * 60 * 60;
    const tokenExpiresAt = new Date(Date.now() + expirySeconds * 1000);

    await Merchant.findByIdAndUpdate(merchantId, {
      $set: {
        "instagram.accessToken": access_token,
        "instagram.tokenExpiresAt": tokenExpiresAt,
        "instagram.isConnected": true,
      },
    });

    return res.json({
      success: true,
      message: "Token refreshed successfully",
      token_type,
      expires_in_days: Math.floor(expirySeconds / 86400),
      tokenExpiresAt,
      // return raw so you can inspect if something looks wrong
      // meta_response: refreshRes.data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
      meta_error: err?.response?.data,
    });
  }
}

async function refreshAndPersistInstagramToken(merchantId, instagram) {
  const currentToken = instagram?.accessToken;

  if (!currentToken) {
    throw new Error("No Instagram access token available to refresh.");
  }

  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;

  if (!appId || !appSecret) {
    throw new Error("APP_ID or APP_SECRET missing from server config");
  }

  const graphApiVersion = process.env.META_GRAPH_VERSION || "v25.0";

  const refreshRes = await axios.get(
    `https://graph.facebook.com/${graphApiVersion}/oauth/access_token`,
    {
      params: {
        grant_type: "fb_exchange_token",
        client_id: appId,
        client_secret: appSecret,
        fb_exchange_token: currentToken,
      },
      timeout: 15000,
    },
  );

  const { access_token, expires_in } = refreshRes.data;

  if (!access_token) {
    const err = new Error("Meta did not return a new token");
    err.meta_response = refreshRes.data;
    throw err;
  }

  const expirySeconds = expires_in || 60 * 24 * 60 * 60;
  const tokenExpiresAt = new Date(Date.now() + expirySeconds * 1000);

  const updatedMerchant = await Merchant.findByIdAndUpdate(
    merchantId,
    {
      $set: {
        "instagram.accessToken": access_token,
        "instagram.tokenExpiresAt": tokenExpiresAt,
        "instagram.isConnected": true,
      },
    },
    {
      new: true,
      runValidators: true,
    },
  ).select("MerchantName instagram");

  return updatedMerchant;
}

// export async function updateInstagramConnectSdk(req, res) {
//   try {
//     const {
//       accessToken,
//       appSecret,
//       verifyToken,
//       graphApiVersion = "v25.0",
//       siteBaseUrl,
//       appId,
//       InstagramAppSecret,
//       whatsappPhoneNumberId,
//     } = req.body;

//     if (!accessToken) {
//       return res.status(400).json({
//         success: false,
//         message: "Access Token is required",
//       });
//     }

//     const merchantId = req.merchant._id;

//     const merchantConfig = {
//       accessToken,
//       graphApiVersion,
//     };

//     const pages = await fetchFacebookPages(merchantConfig);

//     if (!pages.length) {
//       return res.status(400).json({
//         success: false,
//         message: "No Facebook Pages found.",
//       });
//     }

//     const page = pages[0];
//     const pageId = page.id;
//     const pageAccessToken = page.access_token;

//     const igResponse = await fetchInstagramBusinessAccount(pageId, {
//       ...merchantConfig,
//       pageAccessToken,
//     });

//     const igBusinessId = igResponse?.instagram_business_account?.id || "";

//     const update = {
//       "instagram.accessToken": accessToken,
//       "instagram.pageAccessToken": pageAccessToken,
//       "instagram.pageId": pageId,
//       "instagram.igBusinessId": igBusinessId,
//       "instagram.graphApiVersion": graphApiVersion,
//     };

//     if (siteBaseUrl) update["instagram.siteBaseUrl"] = siteBaseUrl.trim();

//     await Merchant.findByIdAndUpdate(
//       merchantId,
//       { $set: update },
//       { new: true, runValidators: true },
//     );

//     let tokenExpiresAt = null;
//     try {
//       const merchantAfterSave =
//         await Merchant.findById(merchantId).select("instagram");
//       const refreshed = await refreshAndPersistInstagramToken(
//         merchantId,
//         merchantAfterSave.instagram,
//       );
//       tokenExpiresAt = refreshed.instagram.tokenExpiresAt;
//     } catch (refreshErr) {
//       console.error(
//         "Instagram connected, but initial token refresh failed:",
//         refreshErr,
//       );
//     }

//     return res.json({
//       success: true,
//       message: "Instagram connected successfully.",
//       data: { tokenExpiresAt },
//     });
//   } catch (err) {
//     console.error(err);

//     return res.status(500).json({
//       success: false,
//       message: err.message,
//     });
//   }
// }
export async function updateInstagramConnectSdk(req, res) {
  try {
    const {
      accessToken,
      verifyToken,
      graphApiVersion = process.env.META_GRAPH_VERSION || "v25.0",
      siteBaseUrl,
      whatsappPhoneNumberId,
    } = req.body;

    if (!accessToken) {
      return res.status(400).json({
        success: false,
        message: "Access Token is required",
      });
    }

    if (!process.env.META_APP_ID || !process.env.META_APP_SECRET) {
      return res.status(500).json({
        success: false,
        message: "META_APP_ID or META_APP_SECRET missing from server config",
      });
    }

    const merchantId = req.merchant._id;

    /**
     * STEP 1: Exchange the incoming (possibly short-lived) user token for
     * a long-lived one FIRST. Page tokens inherit their lifetime from the
     * user token they're derived from — so this must happen before we
     * call /me/accounts, or the resulting pageAccessToken will also be
     * short-lived.
     */
    const exchangeRes = await axios.get(
      `https://graph.facebook.com/${graphApiVersion}/oauth/access_token`,
      {
        params: {
          grant_type: "fb_exchange_token",
          client_id: process.env.META_APP_ID,
          client_secret: process.env.META_APP_SECRET,
          fb_exchange_token: accessToken,
        },
        timeout: 15000,
      },
    );

    const longLivedUserToken = exchangeRes.data?.access_token;

    if (!longLivedUserToken) {
      return res.status(400).json({
        success: false,
        message: "Failed to exchange token for a long-lived version.",
        meta_response: exchangeRes.data,
      });
    }

    const expirySeconds = exchangeRes.data.expires_in || 60 * 24 * 60 * 60;
    const tokenExpiresAt = new Date(Date.now() + expirySeconds * 1000);

    const merchantConfig = {
      accessToken: longLivedUserToken, // ← now long-lived
      graphApiVersion,
    };

    /**
     * STEP 2: Fetch Facebook Pages — pageAccessToken is now derived from
     * the long-lived user token, so it inherits that long lifetime too.
     */
    const pages = await fetchFacebookPages(merchantConfig);

    if (!pages.length) {
      return res.status(400).json({
        success: false,
        message: "No Facebook Pages found.",
      });
    }

    const page = pages[0];
    const pageId = page.id;
    const pageAccessToken = page.access_token;

    /**
     * STEP 3: Fetch Instagram Business Account
     */
    const igResponse = await fetchInstagramBusinessAccount(pageId, {
      ...merchantConfig,
      pageAccessToken,
    });

    const igBusinessId = igResponse?.instagram_business_account?.id || "";

    /**
     * STEP 4: Save everything — including the long-lived token + expiry
     * directly, no separate refresh call needed on connect.
     */
    const update = {
      "instagram.accessToken": longLivedUserToken,
      "instagram.pageAccessToken": pageAccessToken,
      "instagram.pageId": pageId,
      "instagram.igBusinessId": igBusinessId,
      "instagram.graphApiVersion": graphApiVersion,
      "instagram.tokenExpiresAt": tokenExpiresAt,
      "instagram.isConnected": true,
    };

    if (verifyToken) update["instagram.verifyToken"] = verifyToken.trim();
    if (siteBaseUrl) update["instagram.siteBaseUrl"] = siteBaseUrl.trim();
    if (whatsappPhoneNumberId)
      update["instagram.whatsappPhoneNumberId"] = whatsappPhoneNumberId.trim();

    await Merchant.findByIdAndUpdate(
      merchantId,
      { $set: update },
      { new: true, runValidators: true },
    );

    return res.json({
      success: true,
      message: "Instagram connected successfully.",
      data: { tokenExpiresAt },
    });
  } catch (err) {
    console.error(err);

    if (err.response?.data) {
      return res.status(err.response.status || 500).json({
        success: false,
        message: "Failed to connect Instagram account",
        meta_response: err.response.data,
      });
    }

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}

export const getPaymentConfigforUser = async (req, res) => {
  try {
    const merchantId = req.query.merchantId;

    const merchant = await Merchant.findById(merchantId).select(
      "razorpayKey razorpaySecret isRazorpayenabled upi",
    );

    if (!merchant) {
      return res.status(404).json({
        success: false,
        message: "Merchant not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Payment configuration fetched successfully.",
      data: {
        isRazorpayenabled: merchant.isRazorpayenabled,
        // razorpayKey: merchant.razorpayKey
        //   ? `****${merchant.razorpayKey.slice(-4)}`
        //   : "",
        // razorpaySecret: merchant.razorpaySecret ? "****************" : "",
        upi: merchant.upi,
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong.",
      error: error.message,
    });
  }
};
