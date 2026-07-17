import jwt from "jsonwebtoken";
import Merchants from "../models/Merchants.js"; // ensure the path and model name match

const authMerchant = async (req, res, next) => {
  try {
    // Get token from cookies
    const { merchantToken } = req.cookies;

    if (!merchantToken) {
      return res
        .status(401)
        .json({ success: false, message: "Not Authorized, token missing" });
    }

    // 🔍 Verify token
    const decoded = jwt.verify(merchantToken, process.env.JWT_SECRET);

    //Fetch merchant using decoded.merchantId
    const merchant = await Merchants.findById(decoded.merchantId).select(
      "-password -instagram -razorpaySecret -razorpayKey",
    );

    if (!merchant) {
      return res.status(401).json({
        success: false,
        message: "Merchant not found or unauthorized",
      });
    }

    // Attach merchant object to req
    req.merchant = merchant;

    next();
  } catch (error) {
    console.error("Auth error:", error.message);
    return res
      .status(401)
      .json({ success: false, message: "Invalid or expired token" });
  }
};

export default authMerchant;
