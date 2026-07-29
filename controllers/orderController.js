import Razorpay from "razorpay";
import crypto from "crypto";
import Order from "../models/Order.js";
import User from "../models/User.js";
import Product from "../models/Product.js";
import Address from "../models/Address.js";
import Merchants from "../models/Merchants.js";
import mongoose from "mongoose";
import { getDateMatch } from "../utils/getDateMatch.js";
import {
  notifyOrderPlaced,
  notifyOrderStatusUpdate,
} from "../services/whatsappservice.js";
import { loadMerchantConfig } from "../configs/merchantConfigService.js";
//Generate unique order ID based on date & time

const generateOrderId = () => {
  const now = new Date();
  const yyyy = now.getFullYear().toString().slice(-2);
  const MM = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${yyyy}${MM}${dd}${hh}${mm}${ss}-${rand}`;
};

// ================= CREATE COD ORDER ================= //
export const placeOrder = async (req, res) => {
  try {
    const userId = req.user._id;
    const { merchantId, items, address, paymentImage = [] } = req.body;

    if (!merchantId || !items?.length || !address) {
      return res.status(400).json({
        success: false,
        message: "merchantId, items and address are required",
      });
    }

    const merchant = await Merchants.findById(merchantId);
    if (!merchant) {
      return res.status(404).json({
        success: false,
        message: "Merchant not found",
      });
    }

    const addressInfo = await Address.findById(address);
    if (!addressInfo) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    if (!Array.isArray(paymentImage)) {
      return res.status(400).json({
        success: false,
        message: "paymentImage must be an array of image URLs.",
      });
    }

    const canManageStock =
      merchant.isSubscribed && merchant.features?.stockManagement;

    let totalAmount = 0;
    const itemDetails = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      if (product.merchantId.toString() !== merchantId.toString()) {
        return res.status(400).json({
          success: false,
          message: `${product.name} does not belong to this merchant`,
        });
      }

      const variant = product.variants.find(
        (v) => v._id.toString() === item.variantId,
      );

      if (!variant) {
        return res.status(400).json({
          success: false,
          message: "Variant not found",
        });
      }

      const sizeObj = variant.sizes.find((s) => s.size === item.size);
      if (!sizeObj) {
        return res.status(400).json({
          success: false,
          message: `Size ${item.size} not available`,
        });
      }

      // if (sizeObj.stock < item.quantity) {
      //   return res.status(400).json({
      //     success: false,
      //     message: `Only ${sizeObj.stock} items left for ${product.name}`,
      //   });
      // }

      if (canManageStock && sizeObj.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Only ${sizeObj.stock} items left for ${product.name}`,
        });
      }

      const mrp = sizeObj.price;
      const discountPercent = sizeObj.offerPrice || 0;
      const discountedPrice = mrp - Math.round((mrp * discountPercent) / 100);

      totalAmount += discountedPrice * item.quantity;

      itemDetails.push({
        productId: product._id,
        variantId: variant._id,
        size: item.size,
        quantity: item.quantity,
        mrp,
        discountPercent,
        price: discountedPrice,
        color: variant.color,
      });

      if (canManageStock) {
        sizeObj.stock -= item.quantity;
      }

      await product.save(); // ✅ persist stock change
    }

    const order = await Order.create({
      orderId: generateOrderId(),
      userId,
      merchantId,
      address,
      items: itemDetails,
      totalAmount,
      paymentType: "cod",
      paymentStatus: "pending",
      orderStatus: "pending",
      paymentImage,
    });

    // ✅ CLEAR CART AFTER ORDER SUCCESS
    await User.findByIdAndUpdate(userId, {
      $set: { cartItems: [] },
    });

    const merchantConfig = await loadMerchantConfig(order.merchantId);

    // 📲 Notify customer
    notifyOrderPlaced(
      {
        phone: addressInfo.phone || req.user.phone,
        orderId: order.orderId,
        totalAmount: order.totalAmount,
        paymentType: "cod",
        paymentStatus: "pending",
        orderStatus: "pending",
      },
      merchantConfig,
    );

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order,
    });
  } catch (error) {
    console.error("Place order error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= CREATE UPI ORDER ================= //

export const placeUpiOrder = async (req, res) => {
  try {
    const userId = req.user._id;
    const { merchantId, items, address, paymentImage = [] } = req.body;

    if (!merchantId || !items?.length || !address) {
      return res.status(400).json({
        success: false,
        message: "merchantId, items and address are required",
      });
    }

    if (!Array.isArray(paymentImage)) {
      return res.status(400).json({
        success: false,
        message: "paymentImage must be an array of image URLs.",
      });
    }

    if (paymentImage.length === 0) {
      return res.status(400).json({
        success: false,
        message: "A payment screenshot is required for UPI orders",
      });
    }

    const merchant = await Merchants.findById(merchantId);
    if (!merchant) {
      return res.status(404).json({
        success: false,
        message: "Merchant not found",
      });
    }

    if (!merchant.upi?.enabled) {
      return res.status(400).json({
        success: false,
        message: "UPI payment is not available for this merchant",
      });
    }

    const addressInfo = await Address.findById(address);
    if (!addressInfo) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    const canManageStock =
      merchant.isSubscribed && merchant.features?.stockManagement;

    let totalAmount = 0;
    const itemDetails = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      if (product.merchantId.toString() !== merchantId.toString()) {
        return res.status(400).json({
          success: false,
          message: `${product.name} does not belong to this merchant`,
        });
      }

      const variant = product.variants.find(
        (v) => v._id.toString() === item.variantId,
      );

      if (!variant) {
        return res.status(400).json({
          success: false,
          message: "Variant not found",
        });
      }

      const sizeObj = variant.sizes.find((s) => s.size === item.size);
      if (!sizeObj) {
        return res.status(400).json({
          success: false,
          message: `Size ${item.size} not available`,
        });
      }

      if (canManageStock && sizeObj.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Only ${sizeObj.stock} items left for ${product.name}`,
        });
      }

      const mrp = sizeObj.price;
      const discountPercent = sizeObj.offerPrice || 0;
      const discountedPrice = mrp - Math.round((mrp * discountPercent) / 100);

      totalAmount += discountedPrice * item.quantity;

      itemDetails.push({
        productId: product._id,
        variantId: variant._id,
        size: item.size,
        quantity: item.quantity,
        mrp,
        discountPercent,
        price: discountedPrice,
        color: variant.color,
      });

      if (canManageStock) {
        sizeObj.stock -= item.quantity;
      }

      await product.save(); // ✅ persist stock change
    }

    const order = await Order.create({
      orderId: generateOrderId(),
      userId,
      merchantId,
      address,
      items: itemDetails,
      totalAmount,
      paymentType: "upi",
      paymentStatus: "pending", // awaiting merchant verification of the screenshot
      orderStatus: "pending",
      paymentImage,
    });

    // ✅ CLEAR CART AFTER ORDER SUCCESS
    await User.findByIdAndUpdate(userId, {
      $set: { cartItems: [] },
    });

    const merchantConfig = await loadMerchantConfig(order.merchantId);

    // 📲 Notify customer
    notifyOrderPlaced(
      {
        phone: addressInfo.phone || req.user.phone,
        orderId: order.orderId,
        totalAmount: order.totalAmount,
        paymentType: "upi",
        paymentStatus: "pending",
        orderStatus: "pending",
      },
      merchantConfig,
    );

    res.status(201).json({
      success: true,
      message: "Order placed successfully — awaiting payment verification",
      order,
    });
  } catch (error) {
    console.error("Place UPI order error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// export const updateOrderStatus = async (req, res) => {
//   try {
//     const { orderId } = req.params; // Mongo _id
//     const { paymentStatus, orderStatus, status, isPaid, trackingPartner } =
//       req.body;

//     if (!orderId) {
//       return res.status(400).json({
//         success: false,
//         message: "Order ID (_id) is required",
//       });
//     }

//     // 🔹 Fetch existing order first
//     const existingOrder = await Order.findById(orderId);

//     if (!existingOrder) {
//       return res.status(404).json({
//         success: false,
//         message: "Order not found",
//       });
//     }

//     const merchant = await Merchants.findById(existingOrder.merchantId);

//     const canManageStock =
//       merchant?.isSubscribed && merchant?.features?.stockManagement;

//     // 🔹 RESTOCK LOGIC (only once)
//     if (
//       canManageStock &&
//       orderStatus === "cancelled" &&
//       existingOrder.orderStatus !== "cancelled"
//     ) {
//       for (const item of existingOrder.items) {
//         const productId = item.productId._id || item.productId;
//         const { size, quantity } = item;

//         await Product.updateOne(
//           {
//             _id: productId,
//             "variants.sizes.size": size,
//           },
//           {
//             $inc: {
//               "variants.$[].sizes.$[s].stock": quantity,
//             },
//           },
//           {
//             arrayFilters: [{ "s.size": size }],
//           },
//         );
//       }
//     }

//     // 🔹 Build update fields
//     const updateFields = {};
//     if (paymentStatus) updateFields.paymentStatus = paymentStatus;
//     if (orderStatus) updateFields.orderStatus = orderStatus;
//     if (status) updateFields.status = status;
//     if (trackingPartner) updateFields.trackingPartner = trackingPartner;
//     if (typeof isPaid === "boolean") updateFields.isPaid = isPaid;

//     updateFields.updatedAt = new Date();

//     // 🔹 Update order
//     const updatedOrder = await Order.findByIdAndUpdate(
//       orderId,
//       { $set: updateFields },
//       { new: true },
//     ).populate({
//       path: "address",
//     });

//     const merchantConfig = await loadMerchantConfig(updatedOrder.merchantId);

//     if (orderStatus || paymentStatus || typeof isPaid === "boolean") {
//       notifyOrderStatusUpdate(
//         {
//           phone: updatedOrder.address?.phone,
//           orderId: updatedOrder.orderId,
//           orderStatus: updatedOrder.orderStatus,
//           paymentStatus: updatedOrder.paymentStatus,
//           paymentType: updatedOrder.paymentType,
//           isPaid: updatedOrder.isPaid,
//         },
//         merchantConfig,
//       );
//     }

//     return res.status(200).json({
//       success: true,
//       message:
//         orderStatus === "cancelled" && canManageStock
//           ? "Order cancelled & items restocked successfully"
//           : "Order updated successfully",

//       order: updatedOrder,
//     });
//   } catch (error) {
//     console.error("Update order error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Something went wrong while updating order",
//     });
//   }
// };

// ================= CREATE ONLINE PAYMENT ORDER ================= //

export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params; // Mongo _id
    const {
      paymentStatus,
      orderStatus,
      status,
      isPaid,
      trackingPartner,
      amountPaid, // 🔹 NEW: how much the merchant has actually received so far
    } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID (_id) is required",
      });
    }

    // 🔹 Fetch existing order first
    const existingOrder = await Order.findById(orderId);

    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // 🔹 Validate amountPaid, if provided
    if (amountPaid !== undefined) {
      if (typeof amountPaid !== "number" || Number.isNaN(amountPaid)) {
        return res.status(400).json({
          success: false,
          message: "amountPaid must be a number",
        });
      }
      if (amountPaid < 0) {
        return res.status(400).json({
          success: false,
          message: "amountPaid cannot be negative",
        });
      }
      if (amountPaid > existingOrder.totalAmount) {
        return res.status(400).json({
          success: false,
          message: `amountPaid cannot exceed the order total (₹${existingOrder.totalAmount})`,
        });
      }
    }

    const merchant = await Merchants.findById(existingOrder.merchantId);

    const canManageStock =
      merchant?.isSubscribed && merchant?.features?.stockManagement;

    // 🔹 RESTOCK LOGIC (only once)
    if (
      canManageStock &&
      orderStatus === "cancelled" &&
      existingOrder.orderStatus !== "cancelled"
    ) {
      for (const item of existingOrder.items) {
        const productId = item.productId._id || item.productId;
        const { size, quantity } = item;

        await Product.updateOne(
          {
            _id: productId,
            "variants.sizes.size": size,
          },
          {
            $inc: {
              "variants.$[].sizes.$[s].stock": quantity,
            },
          },
          {
            arrayFilters: [{ "s.size": size }],
          },
        );
      }
    }

    // 🔹 Build update fields
    const updateFields = {};
    if (orderStatus) updateFields.orderStatus = orderStatus;
    if (status) updateFields.status = status;
    if (trackingPartner) updateFields.trackingPartner = trackingPartner;

    if (amountPaid !== undefined) {
      updateFields.amountPaid = amountPaid;

      // Auto-derive paymentStatus/isPaid from the new amountPaid, UNLESS the
      // caller explicitly passed their own paymentStatus/isPaid in this same
      // request — an explicit value always wins over the derived one.
      if (paymentStatus === undefined) {
        if (amountPaid >= existingOrder.totalAmount) {
          updateFields.paymentStatus = "paid";
        } else if (amountPaid > 0) {
          updateFields.paymentStatus = "partial";
        } else {
          updateFields.paymentStatus = "pending";
        }
      }
      if (typeof isPaid !== "boolean") {
        updateFields.isPaid = amountPaid >= existingOrder.totalAmount;
      }
    }

    // Explicit values always take precedence over anything derived above
    if (paymentStatus) updateFields.paymentStatus = paymentStatus;
    if (typeof isPaid === "boolean") updateFields.isPaid = isPaid;

    updateFields.updatedAt = new Date();

    // 🔹 Update order
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { $set: updateFields },
      { new: true },
    ).populate({
      path: "address",
    });

    const merchantConfig = await loadMerchantConfig(updatedOrder.merchantId);

    if (
      orderStatus ||
      paymentStatus ||
      typeof isPaid === "boolean" ||
      amountPaid !== undefined
    ) {
      notifyOrderStatusUpdate(
        {
          phone: updatedOrder.address?.phone,
          orderId: updatedOrder.orderId,
          orderStatus: updatedOrder.orderStatus,
          paymentStatus: updatedOrder.paymentStatus,
          paymentType: updatedOrder.paymentType,
          isPaid: updatedOrder.isPaid,
          amountPaid: updatedOrder.amountPaid,
          pendingAmount: updatedOrder.pendingAmount,
        },
        merchantConfig,
      );
    }

    return res.status(200).json({
      success: true,
      message:
        orderStatus === "cancelled" && canManageStock
          ? "Order cancelled & items restocked successfully"
          : "Order updated successfully",

      order: updatedOrder,
    });
  } catch (error) {
    console.error("Update order error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while updating order",
    });
  }
};

export const createOnlineOrder = async (req, res) => {
  try {
    const userId = req.user._id;
    const { merchantId, items, address } = req.body;

    if (!merchantId || !items?.length || !address) {
      return res.status(400).json({
        success: false,
        message: "merchantId, items and address are required",
      });
    }

    const merchant = await Merchants.findById(merchantId);
    if (!merchant) {
      return res.status(404).json({
        success: false,
        message: "Merchant not found",
      });
    }
    if (
      !merchant.isRazorpayenabled ||
      !merchant.razorpayKey ||
      !merchant.razorpaySecret
    ) {
      return res.status(400).json({
        success: false,
        message: "Razorpay payment is not available for this merchant.",
      });
    }

    const canManageStock =
      merchant.isSubscribed && merchant.features?.stockManagement;

    let totalAmount = 0;
    const itemDetails = [];

    // 🔍 Validate products & calculate amount
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product)
        return res
          .status(404)
          .json({ success: false, message: "Product not found" });

      const variant = product.variants.id(item.variantId);
      if (!variant)
        return res
          .status(400)
          .json({ success: false, message: "Variant not found" });

      const sizeObj = variant.sizes.find((s) => s.size === item.size);
      if (!sizeObj)
        return res.status(400).json({
          success: false,
          message: `Size ${item.size} not available`,
        });

      if (canManageStock && sizeObj.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Only ${sizeObj.stock} left for ${product.name}`,
        });
      }

      const mrp = sizeObj.price;
      const discountPercent = sizeObj.offerPrice || 0;
      const price = mrp - Math.round((mrp * discountPercent) / 100);

      totalAmount += price * item.quantity;

      itemDetails.push({
        productId: product._id,
        variantId: variant._id,
        size: item.size,
        quantity: item.quantity,
        color: variant.color,
        mrp,
        discountPercent,
        price,
      });
    }

    // 🆔 Create internal orderId
    const orderId = `ORD-${Date.now()}`;

    // 💳 Razorpay instance
    const razorpay = new Razorpay({
      key_id: merchant?.razorpayKey,
      key_secret: merchant?.razorpaySecret,
    });

    // 🧾 Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: totalAmount * 100,
      currency: "INR",
      receipt: orderId,
    });

    // 💾 SAVE ORDER (IMPORTANT)
    const order = await Order.create({
      orderId,
      razorpayOrderId: razorpayOrder.id,
      merchantId,
      userId,
      address,
      items: itemDetails,
      totalAmount,
      paymentType: "online",
      paymentStatus: "pending",
      isPaid: false,
    });

    return res.status(201).json({
      success: true,
      message: "Order created. Proceed to payment",
      razorpayOrder,
      orderId: order.orderId,
      key: merchant.razorpayKey,
    });
  } catch (error) {
    console.error("Create online order error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= VERIFY PAYMENT ================= //
export const verifyPayment = async (req, res) => {
  try {
    const userId = req.user._id;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment data",
      });
    }

    const order = await Order.findOne({
      razorpayOrderId: razorpay_order_id,
    }).populate("address");
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    // 🔒 Prevent double verification
    if (order.isPaid) {
      return res.json({
        success: true,
        message: "Payment already verified",
        order,
      });
    }

    const merchant = await Merchants.findById(order.merchantId);
    if (!merchant) {
      return res
        .status(404)
        .json({ success: false, message: "Merchant not found" });
    }

    // 🔐 Verify Razorpay signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", merchant.razorpaySecret)
      .update(body)
      .digest("hex");

    // ❌ PAYMENT FAILED → DELETE ORDER
    if (expectedSignature !== razorpay_signature) {
      await Order.findByIdAndDelete(order._id);

      return res.status(400).json({
        success: false,
        message: "Payment verification failed. Order deleted.",
      });
    }

    /* ================= PAYMENT SUCCESS ================= */

    order.paymentStatus = "paid";
    order.isPaid = true;
    order.paymentId = razorpay_payment_id;
    order.orderStatus = "confirmed";
    await order.save();

    const merchantConfig = await loadMerchantConfig(order.merchantId);

    // 📲 Notify customer
    notifyOrderPlaced(
      {
        phone: order.address?.phone,
        orderId: order.orderId,
        totalAmount: order.totalAmount,
        paymentType: order.paymentType,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
      },
      merchantConfig,
    );

    // 🛒 Clear user cart
    await User.findByIdAndUpdate(userId, {
      $set: { cartItems: [] },
    });

    // 📦 Deduct stock
    for (const item of order.items) {
      const product = await Product.findById(item.productId);
      if (!product) continue;

      const variant = product.variants.id(item.variantId);
      if (!variant) continue;

      const sizeObj = variant.sizes.find((s) => s.size === item.size);
      if (!sizeObj) continue;

      sizeObj.stock = Math.max(0, sizeObj.stock - item.quantity);
      await product.save();
    }

    res.json({
      success: true,
      message: "Payment verified successfully",
      order,
    });
  } catch (error) {
    console.error("Verify payment error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllOrdersByMerchant = async (req, res) => {
  try {
    const merchantId = req.merchant._id;

    let {
      type = "All",
      fromDate,
      toDate,
      from,
      to,
      page = 1,
      limit = 10,
      orderStatus,
      search, // 🔍 NEW
    } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);
    const skip = (page - 1) * limit;

    fromDate = fromDate || from;
    toDate = toDate || to;

    /* ================= BASE QUERY ================= */

    let query = {
      merchantId,
      $or: [
        { paymentType: "cod" },
        { paymentType: "upi" },
        { paymentType: "online", isPaid: true, paymentStatus: "paid" },
      ],
    };

    const now = new Date();

    /* ================= DATE FILTER ================= */

    if (type === "Custom" && fromDate && toDate) {
      const startDate = new Date(fromDate);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(toDate);
      endDate.setHours(23, 59, 59, 999);

      query.createdAt = { $gte: startDate, $lte: endDate };
    } else if (type === "Today") {
      const startOfDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
      );
      query.createdAt = { $gte: startOfDay };
    } else if (type === "Week") {
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(now.getDate() - 7);
      query.createdAt = { $gte: sevenDaysAgo };
    } else if (type === "Month") {
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(now.getDate() - 30);
      query.createdAt = { $gte: thirtyDaysAgo };
    }

    /* ================= ORDER STATUS FILTER ================= */

    if (orderStatus) {
      query.orderStatus = { $in: orderStatus.split(",") };
    }

    /* ================= SEARCH FILTER ================= */

    if (search) {
      const regex = new RegExp(search, "i");

      // Find matching users first
      const users = await User.find(
        {
          $or: [{ name: regex }, { email: regex }],
        },
        "_id",
      );

      const userIds = users.map((u) => u._id);

      query.$and = [
        {
          $or: [
            { orderId: regex },
            ...(userIds.length ? [{ userId: { $in: userIds } }] : []),
          ],
        },
      ];
    }

    /* ================= DB QUERIES ================= */

    const totalOrders = await Order.countDocuments(query);

    const orders = await Order.find(query)
      .populate("items.productId")
      .populate("address")
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: orders.length,
      totalOrders,
      currentPage: page,
      totalPages: Math.ceil(totalOrders / limit),
      orders,
      message: "Orders fetched successfully",
    });
  } catch (error) {
    console.error("Get all orders error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
    });
  }
};

export const getOrdersByMerchantAndPhone = async (req, res) => {
  try {
    const merchantId = req.merchant._id;
    const { phone } = req.params;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Customer phone number is required",
      });
    }

    const orders = await Order.find({
      merchantId,
      "customer.phone": phone,
    })
      .populate("items.productId", "name images price")
      .sort({ createdAt: -1 });

    res.json({ success: true, count: orders.length, orders });
  } catch (error) {
    console.error("Get orders by phone error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getOrderByRazorpayId = async (req, res) => {
  try {
    const { razorpayOrderId } = req.params;
    const order = await Order.findOne({ razorpayOrderId });
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });

    res.json({ success: true, order });
  } catch (error) {
    console.error("Get order by Razorpay ID error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getOrderByPaymentId = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const order = await Order.findOne({ paymentId });
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });

    res.json({ success: true, order });
  } catch (error) {
    console.error("Get order by payment ID error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Check if order exists
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Delete the order
    await Order.findByIdAndDelete(orderId);

    return res.status(200).json({
      success: true,
      message: "Order deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting order:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get Orders by User ID : /api/order/user-orders
export const getOrdersByUserId = async (req, res) => {
  try {
    const userId = req.user?._id || req.body.userId;
    const merchantId = req.user?.merchantId;

    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 10, 1);
    const skip = (page - 1) * limit;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const query = {
      userId,
      merchantId,
      $or: [
        { paymentType: "cod" },
        { paymentType: "upi" },
        {
          paymentType: "online",
          isPaid: true,
          paymentStatus: "paid",
        },
      ],
    };

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate("items.productId")
        .populate("address")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),

      Order.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      message: "Orders fetched successfully",
      orders,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Get Orders Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error: error.message,
    });
  }
};

export const getSalesTrend = async (req, res) => {
  try {
    const merchantId = req.merchant._id;
    let { type = "month", fromDate, toDate } = req.query;

    const IST_TIMEZONE = "Asia/Kolkata";

    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const formatShortDate = (d) =>
      `${String(d.getDate()).padStart(2, "0")}/${String(
        d.getMonth() + 1,
      ).padStart(2, "0")}/${String(d.getFullYear()).slice(-2)}`;

    const now = new Date(
      new Date().toLocaleString("en-US", { timeZone: IST_TIMEZONE }),
    );

    const getDaysDiff = (start, end) =>
      Math.ceil((end - start) / (1000 * 60 * 60 * 24));

    let dateMatch = {};
    let use12Buckets = false;
    let customStart, customEnd, totalDays, isMultiYear;

    switch (type) {
      case "today": {
        const startOfToday = new Date(now);
        startOfToday.setHours(0, 0, 0, 0);

        const endOfToday = new Date(now);
        endOfToday.setHours(23, 59, 59, 999);

        dateMatch.createdAt = {
          $gte: startOfToday,
          $lte: endOfToday,
        };
        break;
      }

      case "week":
      case "month":
      case "year":
        dateMatch = getDateMatch({ type, timezone: IST_TIMEZONE });
        break;

      case "custom": {
        if (!fromDate || !toDate) {
          return res.status(400).json({
            success: false,
            message: "fromDate and toDate are required for custom type",
          });
        }

        customStart = new Date(fromDate);
        customStart.setHours(0, 0, 0, 0);

        customEnd = new Date(toDate);
        customEnd.setHours(23, 59, 59, 999);

        totalDays = getDaysDiff(customStart, customEnd);
        isMultiYear = customStart.getFullYear() !== customEnd.getFullYear();
        use12Buckets = totalDays > 31;

        dateMatch.createdAt = {
          $gte: customStart,
          $lte: customEnd,
        };
        break;
      }
    }

    const getGroupBy = () => {
      switch (type) {
        case "today":
          return {
            slot: {
              $floor: {
                $divide: [
                  { $hour: { date: "$createdAt", timezone: IST_TIMEZONE } },
                  3,
                ],
              },
            },
          };

        case "week":
        case "month":
          return {
            year: { $year: { date: "$createdAt", timezone: IST_TIMEZONE } },
            month: { $month: { date: "$createdAt", timezone: IST_TIMEZONE } },
            day: {
              $dayOfMonth: { date: "$createdAt", timezone: IST_TIMEZONE },
            },
          };

        case "year":
          return {
            year: { $year: { date: "$createdAt", timezone: IST_TIMEZONE } },
            month: { $month: { date: "$createdAt", timezone: IST_TIMEZONE } },
          };

        case "custom":
          if (use12Buckets) {
            return {
              bucket: {
                $floor: {
                  $multiply: [
                    {
                      $divide: [
                        {
                          $subtract: [
                            { $toLong: "$createdAt" },
                            customStart.getTime(),
                          ],
                        },
                        customEnd.getTime() - customStart.getTime(),
                      ],
                    },
                    12,
                  ],
                },
              },
            };
          }

          return {
            year: { $year: { date: "$createdAt", timezone: IST_TIMEZONE } },
            month: { $month: { date: "$createdAt", timezone: IST_TIMEZONE } },
            day: {
              $dayOfMonth: { date: "$createdAt", timezone: IST_TIMEZONE },
            },
          };

        default:
          return {};
      }
    };

    const groupBy = getGroupBy();

    const orderStats = await Order.aggregate([
      {
        $match: {
          merchantId: new mongoose.Types.ObjectId(merchantId),
          paymentStatus: "paid",
          orderStatus: "delivered",
          ...dateMatch,
        },
      },
      { $unwind: "$items" },
      {
        $group: {
          _id: groupBy,
          sales: { $sum: "$totalAmount" },
          sold: { $sum: "$items.quantity" },
        },
      },
    ]);

    const productStats = await Product.aggregate([
      {
        $match: {
          merchantId: new mongoose.Types.ObjectId(merchantId),
          ...dateMatch,
        },
      },
      {
        $group: {
          _id: groupBy,
          added: { $sum: 1 },
        },
      },
    ]);

    const buckets = [];
    const formatKey = (d) =>
      `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

    if (type === "today") {
      for (let i = 0; i < 8; i++) {
        buckets.push({
          key: i,
          period: `${i * 3}:00 - ${(i + 1) * 3}:00`,
          sales: 0,
          sold: 0,
          added: 0,
        });
      }
    } else if (type === "week") {
      const dayOfWeek = now.getDay() || 7;
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - dayOfWeek + 1);

      for (let i = 0; i < 7; i++) {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);

        buckets.push({
          key: formatKey(d),
          period: `${d.getDate()} ${monthNames[d.getMonth()]}`,
          sales: 0,
          sold: 0,
          added: 0,
        });
      }
    } else if (type === "month") {
      const year = now.getFullYear();
      const month = now.getMonth();
      const days = new Date(year, month + 1, 0).getDate();

      for (let i = 1; i <= days; i++) {
        buckets.push({
          key: i,
          period: `${i} ${monthNames[month]}`,
          sales: 0,
          sold: 0,
          added: 0,
        });
      }
    } else if (type === "year") {
      for (let i = 0; i < 12; i++) {
        buckets.push({
          key: i + 1,
          period: monthNames[i],
          sales: 0,
          sold: 0,
          added: 0,
        });
      }
    } else if (type === "custom") {
      if (use12Buckets) {
        const partSize = Math.ceil(totalDays / 12);

        for (let i = 0; i < 12; i++) {
          const start = new Date(customStart);
          start.setDate(customStart.getDate() + i * partSize);

          const end = new Date(start);
          end.setDate(start.getDate() + partSize - 1);

          buckets.push({
            key: i,
            period: `${formatShortDate(start)} - ${formatShortDate(end)}`,
            sales: 0,
            sold: 0,
            added: 0,
          });
        }
      } else {
        for (
          let d = new Date(customStart);
          d <= customEnd;
          d.setDate(d.getDate() + 1)
        ) {
          buckets.push({
            key: formatKey(d),
            period: isMultiYear
              ? `${d.getDate()} ${monthNames[d.getMonth()]} ${d.getFullYear()}`
              : `${d.getDate()} ${monthNames[d.getMonth()]}`,
            sales: 0,
            sold: 0,
            added: 0,
          });
        }
      }
    }

    const mergeData = (arr, field) => {
      arr.forEach((item) => {
        let key;

        if (type === "today") key = item._id.slot;
        else if (type === "custom" && use12Buckets) key = item._id.bucket;
        else if (type === "week" || type === "custom")
          key = `${item._id.year}-${item._id.month}-${item._id.day}`;
        else if (type === "month") key = item._id.day;
        else if (type === "year") key = item._id.month;

        const bucket = buckets.find((b) => b.key === key);
        if (bucket) {
          if (field === "order") {
            bucket.sales = item.sales;
            bucket.sold = item.sold;
          } else {
            bucket.added = item.added;
          }
        }
      });
    };

    mergeData(orderStats, "order");
    mergeData(productStats, "product");

    /* -------------------------------
       Totals
    ------------------------------- */
    const totals = {};
    buckets.forEach((b) => {
      totals[type] = (totals[type] || 0) + b.sales;
    });

    return res.json({
      success: true,
      data: buckets,
      totals,
    });
  } catch (error) {
    console.error("Sales Trend Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch sales trend",
    });
  }
};

export const getTopSellingProducts = async (req, res) => {
  try {
    const merchantId = req.merchant._id;
    const { type, fromDate, toDate } = req.query;

    const dateMatch = getDateMatch({ type, fromDate, toDate });

    const topProducts = await Order.aggregate([
      {
        $match: {
          merchantId: new mongoose.Types.ObjectId(merchantId),
          paymentStatus: "paid",
          orderStatus: "delivered",
          ...dateMatch,
        },
      },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId",
          units: { $sum: "$items.quantity" },
          revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
        },
      },
      { $sort: { units: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      {
        $project: {
          name: "$product.name",
          units: 1,
          revenue: 1,
        },
      },
    ]);

    res.json({
      success: true,
      data: topProducts.map((p, i) => ({
        rank: i + 1,
        name: p.name,
        units: p.units,
        revenue: `₹${Math.round(p.revenue).toLocaleString("en-IN")}`,
      })),
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch top products" });
  }
};

export const getPaymentAnalytics = async (req, res) => {
  try {
    const merchantId = req.merchant._id;
    let { type = "month", fromDate, toDate } = req.query;

    const IST_TIMEZONE = "Asia/Kolkata";

    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const now = new Date(
      new Date().toLocaleString("en-US", { timeZone: IST_TIMEZONE }),
    );
    const formatShortDate = (d) =>
      `${String(d.getDate()).padStart(2, "0")}/${String(
        d.getMonth() + 1,
      ).padStart(2, "0")}/${String(d.getFullYear()).slice(-2)}`;

    const getDaysDiff = (start, end) =>
      Math.ceil((end - start) / (1000 * 60 * 60 * 24));

    let dateMatch = {};
    let customStart, customEnd, totalDays;
    let use12Buckets = false;
    let isMultiYear = false;

    switch (type) {
      case "today": {
        const start = new Date(now);
        start.setHours(0, 0, 0, 0);

        const end = new Date(now);
        end.setHours(23, 59, 59, 999);

        dateMatch.createdAt = { $gte: start, $lte: end };
        break;
      }

      case "week":
      case "month":
      case "year":
        dateMatch = getDateMatch({ type, timezone: IST_TIMEZONE });
        break;

      case "custom": {
        if (!fromDate || !toDate) {
          return res.status(400).json({
            success: false,
            message: "fromDate and toDate are required",
          });
        }

        customStart = new Date(fromDate);
        customStart.setHours(0, 0, 0, 0);

        customEnd = new Date(toDate);
        customEnd.setHours(23, 59, 59, 999);

        totalDays = getDaysDiff(customStart, customEnd);
        use12Buckets = totalDays > 31;
        isMultiYear = customStart.getFullYear() !== customEnd.getFullYear();

        dateMatch.createdAt = { $gte: customStart, $lte: customEnd };
        break;
      }
    }

    /* -------------------------------
       Group By
    ------------------------------- */
    const getGroupBy = () => {
      switch (type) {
        case "today":
          return {
            slot: {
              $floor: {
                $divide: [
                  { $hour: { date: "$createdAt", timezone: IST_TIMEZONE } },
                  3,
                ],
              },
            },
            paymentType: "$paymentType",
          };

        case "year":
          return {
            month: { $month: { date: "$createdAt", timezone: IST_TIMEZONE } },
            paymentType: "$paymentType",
          };

        case "custom":
          if (use12Buckets) {
            return {
              bucket: {
                $floor: {
                  $multiply: [
                    {
                      $divide: [
                        {
                          $subtract: [
                            { $toLong: "$createdAt" },
                            customStart.getTime(),
                          ],
                        },
                        customEnd.getTime() - customStart.getTime(),
                      ],
                    },
                    12,
                  ],
                },
              },
              paymentType: "$paymentType",
            };
          }

        default:
          return {
            year: { $year: { date: "$createdAt", timezone: IST_TIMEZONE } },
            month: { $month: { date: "$createdAt", timezone: IST_TIMEZONE } },
            day: {
              $dayOfMonth: { date: "$createdAt", timezone: IST_TIMEZONE },
            },
            paymentType: "$paymentType",
          };
      }
    };

    const stats = await Order.aggregate([
      {
        $match: {
          merchantId: new mongoose.Types.ObjectId(merchantId),
          orderStatus: "delivered",
          paymentStatus: "paid",
          ...dateMatch,
        },
      },
      {
        $group: {
          _id: getGroupBy(),
          revenue: { $sum: "$totalAmount" },
        },
      },
    ]);

    /* -------------------------------
       Buckets
    ------------------------------- */
    const buckets = [];
    const formatKey = (d) =>
      `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

    if (type === "today") {
      for (let i = 0; i < 8; i++) {
        buckets.push({
          key: i,
          period: `${i * 3}:00 - ${(i + 1) * 3}:00`,
          cod: 0,
          online: 0,
        });
      }
    }

    if (type === "week") {
      const start = new Date(now);
      start.setDate(now.getDate() - (now.getDay() || 7) + 1);

      for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);

        buckets.push({
          key: formatKey(d),
          period: d.toLocaleDateString("en-IN", { weekday: "short" }),
          cod: 0,
          online: 0,
        });
      }
    }

    if (type === "month") {
      const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

      for (let i = 1; i <= days; i++) {
        buckets.push({
          key: i,
          period: `${i} ${monthNames[now.getMonth()]}`,
          cod: 0,
          online: 0,
        });
      }
    }

    if (type === "year") {
      for (let i = 0; i < 12; i++) {
        buckets.push({
          key: i + 1,
          period: monthNames[i],
          cod: 0,
          online: 0,
        });
      }
    }

    if (type === "custom") {
      if (use12Buckets) {
        const partSize = Math.ceil(totalDays / 12);

        for (let i = 0; i < 12; i++) {
          const start = new Date(customStart);
          start.setDate(customStart.getDate() + i * partSize);

          const end = new Date(start);
          end.setDate(start.getDate() + partSize - 1);

          buckets.push({
            key: i,
            period: `${formatShortDate(start)} - ${formatShortDate(end)}`,
            cod: 0,
            online: 0,
          });
        }
      } else {
        for (
          let d = new Date(customStart);
          d <= customEnd;
          d.setDate(d.getDate() + 1)
        ) {
          buckets.push({
            key: formatKey(d),
            period: isMultiYear
              ? `${d.getDate()} ${monthNames[d.getMonth()]} ${d.getFullYear()}`
              : `${d.getDate()} ${monthNames[d.getMonth()]}`,
            cod: 0,
            online: 0,
          });
        }
      }
    }

    /* -------------------------------
       Merge Data
    ------------------------------- */
    stats.forEach((s) => {
      let key;

      if (type === "today") key = s._id.slot;
      else if (type === "year") key = s._id.month;
      else if (type === "custom" && use12Buckets) key = s._id.bucket;
      else key = `${s._id.year}-${s._id.month}-${s._id.day}`;

      const bucket = buckets.find((b) => b.key === key);
      if (!bucket) return;

      if (s._id.paymentType === "cod") bucket.cod += s.revenue;
      else bucket.online += s.revenue;
    });

    /* -------------------------------
       Summary
    ------------------------------- */
    const totalOnline = buckets.reduce((a, b) => a + b.online, 0);
    const totalCod = buckets.reduce((a, b) => a + b.cod, 0);
    const total = totalOnline + totalCod;

    return res.json({
      success: true,
      data: {
        summary: {
          onlineAmount: totalOnline,
          codAmount: totalCod,
          onlinePercent: total ? Math.round((totalOnline / total) * 100) : 0,
          codPercent: total ? Math.round((totalCod / total) * 100) : 0,
        },
        timeline: buckets,
      },
    });
  } catch (err) {
    console.error("Payment Analytics Error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch payment analytics",
    });
  }
};
