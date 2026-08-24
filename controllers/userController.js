import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Order from "../models/Order.js";
import mongoose from "mongoose";

// ============================= REGISTER =============================
export const register = async (req, res) => {
  try {
    const { name, email, password, merchantId } = req.body;

    if (!name || !email || !password || !merchantId) {
      return res.status(400).json({
        success: false,
        message: "Missing details",
      });
    }

    // Check if this exact email + merchant combination already exists
    const existingUser = await User.findOne({
      email,
      merchantData: { $elemMatch: { merchantId } },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    // Always create a brand new document for this email + merchant pair
    const hashedPassword = await bcrypt.hash(password, 10);

    let user;
    try {
      user = await User.create({
        name,
        email,
        password: hashedPassword,
        merchantData: [{ merchantId }],
      });
    } catch (err) {
      // Compound unique index (email + merchantData.merchantId) catches
      // the race condition if two requests hit at the same time
      if (err.code === 11000) {
        return res.status(400).json({
          success: false,
          message: "User already exists",
        });
      }
      throw err;
    }

    const token = jwt.sign(
      { userId: user._id, merchantId },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.cookie("userToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      success: true,
      message: "User registered successfully.",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
      cartItems: user.cartItems,
    });
  } catch (error) {
    console.error("Register Error:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================= LOGIN =============================
export const login = async (req, res) => {
  try {
    const { email, password, merchantId } = req.body;

    if (!email || !password || !merchantId)
      return res.status(400).json({
        success: false,
        message: "Email, password and merchant required",
      });

    // Since email is no longer globally unique, this query must always be
    // scoped by BOTH email and merchantId (matches the compound index).
    const user = await User.findOne({
      email,
      merchantData: { $elemMatch: { merchantId } },
    });

    if (!user)
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });

    const token = jwt.sign(
      { userId: user._id, merchantId },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.cookie("userToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const cartItems = (user.cartItems || []).filter(
      (item) =>
        item.merchantId && item.merchantId.toString() === merchantId.toString(),
    );

    return res.status(200).json({
      success: true,
      user: {
        name: user.name,
        email: user.email,
      },
      cartItems,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================= AUTH CHECK =============================
export const isAuth = async (req, res) => {
  try {
    const token = req.cookies.userToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    // Since a user can be de-linked from a merchant after the token was
    // issued, re-verify the token's merchantId is still valid for this user.
    const stillLinked = (user.merchantData || []).some(
      (item) =>
        item.merchantId &&
        item.merchantId.toString() === decoded.merchantId.toString(),
    );

    if (!stillLinked) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated for this merchant",
      });
    }

    const filteredCartItems = (user.cartItems || []).filter(
      (item) =>
        item.merchantId &&
        item.merchantId.toString() === decoded.merchantId.toString(),
    );

    const userResponse = user.toObject();
    userResponse.cartItems = filteredCartItems;

    return res.status(200).json({
      success: true,
      user: userResponse,
    });
  } catch (error) {
    console.error(error);

    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }
};

// ============================= LOGOUT =============================
export const logout = async (req, res) => {
  try {
    res.clearCookie("userToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });

    return res
      .status(200)
      .json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================= CUSTOMERS LIST =============================
export const getCustomersList = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const perPage = Math.max(parseInt(req.query.per_page) || 10, 1);
    const search = (req.query.search || "").trim();
    const includeGuests = req.query.includeGuests === "true";
    const merchantId = req.merchant._id;
    const merchant = req.merchant;

    const filter = {};

    if (!includeGuests) {
      filter.isGuest = false;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    if (merchantId) {
      filter["merchantData.merchantId"] = new mongoose.Types.ObjectId(
        merchantId,
      );
    }

    // Full customer list is only available when the merchant is subscribed
    // AND has newCustomerManagement enabled. Otherwise, only show customers
    // who have placed at least one order with this merchant.
    const canSeeAllCustomers =
      merchant?.isSubscribed && merchant?.features?.newCustomerManagement;

    if (!canSeeAllCustomers) {
      const buyerIds = await Order.distinct("userId", {
        merchantId: new mongoose.Types.ObjectId(merchantId),
      });
      filter._id = { $in: buyerIds };
    }

    const totalRecords = await User.countDocuments(filter);

    const users = await User.find(filter)
      .populate("merchantData.merchantId", "MerchantName email")
      .populate("cartItems.productId", "name sku brand description variants")
      .select({
        name: 1,
        email: 1,
        phone: 1,
        isGuest: 1,
        createdAt: 1,
        merchantData: 1,
        cartItems: 1,
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage)
      .lean();

    const customerIds = users.map((u) => u._id);

    const orderStats = await Order.aggregate([
      {
        $match: {
          userId: {
            $in: customerIds,
          },
        },
      },
      {
        $group: {
          _id: "$userId",
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: "$amountPaid" },
          lastOrder: { $max: "$createdAt" },
        },
      },
    ]);

    const statsMap = {};

    orderStats.forEach((item) => {
      statsMap[item._id.toString()] = item;
    });

    const data = users.map((user) => {
      const stats = statsMap[user._id.toString()] || {};

      return {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        isGuest: user.isGuest,

        merchantCount: user.merchantData.length,

        merchant: user.merchantData[0]?.merchantId,

        // Cart contents are only exposed to merchants with full customer
        // access (subscribed + newCustomerManagement). Restricted merchants
        // get empty cart data even if the user actually has items in cart.
        cartItems: canSeeAllCustomers ? user.cartItems.length : 0,

        cart: canSeeAllCustomers
          ? user.cartItems.map((item) => ({
              _id: item._id,
              productId: item.productId,
              merchantId: item.merchantId,
              variantId: item.variantId,
              size: item.size,
              quantity: item.quantity,
              price: item.price,
              offerPrice: item.offerPrice,
            }))
          : [],

        totalOrders: stats.totalOrders || 0,

        totalSpent: stats.totalSpent || 0,

        lastOrder: stats.lastOrder || null,

        createdAt: user.createdAt,
      };
    });

    const totalPages = Math.ceil(totalRecords / perPage);

    return res.status(200).json({
      success: true,
      customers: data,
      pagination: {
        current_page: page,
        per_page: perPage,
        total_records: totalRecords,
        total_pages: totalPages,
        has_next_page: page < totalPages,
        has_prev_page: page > 1,
      },
    });
  } catch (error) {
    console.error("Get customers error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch customers.",
    });
  }
};
