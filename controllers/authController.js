import jwt from "jsonwebtoken";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import Order from "../models/Order.js";
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
    const randomPassword = crypto.randomBytes(24).toString("hex");

    const hashedPassword = await bcrypt.hash(randomPassword, 10);
    user = await User.create({
      name: payload.username || "Instagram User",
      email: `ig_${payload.igsid}@guest.local`,
      password: hashedPassword, // never used to log in directly; hash it if your schema expects hashed passwords elsewhere
      instagramId: payload.igsid,
      isGuest: true,
      merchantData: [
        {
          merchantId: payload.merchantId,
        },
      ],
    });
  }

  const userToken = jwt.sign(
    { userId: user._id, merchantId: payload.merchantId },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    },
  );

  res.cookie("userToken", userToken, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.json({ success: true, isGuest: user.isGuest });
}

// export async function completeGuestProfile(req, res) {
//   try {
//     const userId = req.user?._id;

//     if (!userId) {
//       return res.status(401).json({
//         success: false,
//         message: "Unauthorized",
//       });
//     }

//     const { name, email, password, currentPassword } = req.body;

//     const user = await User.findById(userId);

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: "User not found",
//       });
//     }

//     // Email can only be changed by guest users
//     if (!user.isGuest && email && email !== user.email) {
//       return res.status(400).json({
//         success: false,
//         message: "Email cannot be changed.",
//       });
//     }

//     // Guest user flow
//     if (user.isGuest) {
//       if (!email || !password) {
//         return res.status(400).json({
//           success: false,
//           message: "Email and password are required.",
//         });
//       }

//       // Check email uniqueness
//       const existingUser = await User.findOne({
//         email,
//         _id: { $ne: userId },
//       });

//       if (existingUser) {
//         return res.status(409).json({
//           success: false,
//           message: "Email already in use.",
//         });
//       }

//       user.email = email;
//       user.password = await bcrypt.hash(password, 10);
//       user.isGuest = false;
//     } else {
//       // Existing user must provide current password to change password
//       if (password) {
//         if (!currentPassword) {
//           return res.status(400).json({
//             success: false,
//             message: "Current password is required.",
//           });
//         }

//         const isMatch = await bcrypt.compare(currentPassword, user.password);

//         if (!isMatch) {
//           return res.status(400).json({
//             success: false,
//             message: "Current password is incorrect.",
//           });
//         }

//         user.password = await bcrypt.hash(password, 10);
//       }
//     }

//     // Name can always be updated
//     if (name) {
//       user.name = name;
//     }

//     await user.save();

//     return res.status(200).json({
//       success: true,
//       message: user.isGuest
//         ? "Profile updated successfully."
//         : "Profile completed successfully.",
//       data: {
//         _id: user._id,
//         name: user.name,
//         email: user.email,
//         isGuest: user.isGuest,
//       },
//     });
//   } catch (error) {
//     console.error("Complete guest profile error:", error);

//     return res.status(500).json({
//       success: false,
//       message: error.message || "Internal server error.",
//     });
//   }
// }




// ... igExchange unchanged ...

export async function completeGuestProfile(req, res) {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { name, email, password, currentPassword } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (!user.isGuest && email && email !== user.email) {
      return res
        .status(400)
        .json({ success: false, message: "Email cannot be changed." });
    }

    if (user.isGuest) {
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: "Email and password are required.",
        });
      }

      const guestMerchantId = user.merchantData?.[0]?.merchantId;

      const existingUser = await User.findOne({
        email,
        merchantData: { $elemMatch: { merchantId: guestMerchantId } },
        _id: { $ne: userId },
      });

      // ===== MERGE PATH =====
      if (existingUser) {
        const isMatch = await bcrypt.compare(password, existingUser.password);

        if (!isMatch) {
          return res.status(409).json({
            success: false,
            message:
              "An account with this email already exists for this store. Enter that account's password to merge your cart and orders, or log in instead.",
            code: "EMAIL_EXISTS_FOR_MERCHANT",
          });
        }

        // --- Merge cart items ---
        const guestCartItems = user.cartItems || [];

        for (const guestItem of guestCartItems) {
          const match = existingUser.cartItems.find(
            (item) =>
              item.productId.toString() === guestItem.productId.toString() &&
              item.variantId.toString() === guestItem.variantId.toString() &&
              item.size === guestItem.size &&
              item.merchantId &&
              guestItem.merchantId &&
              item.merchantId.toString() === guestItem.merchantId.toString(),
          );

          if (match) {
            match.quantity += guestItem.quantity;
          } else {
            existingUser.cartItems.push(guestItem.toObject());
          }
        }

        if (name) {
          existingUser.name = name;
        }

        await existingUser.save();

        // --- Reassign guest's orders to the existing account ---
        // Scoped by merchantId too, in case userId ever collides across merchants
        await Order.updateMany(
          { userId: user._id, merchantId: guestMerchantId },
          { $set: { userId: existingUser._id } },
        );

        // --- Delete the now-empty guest document ---
        await User.deleteOne({ _id: user._id });

        const token = jwt.sign(
          { userId: existingUser._id, merchantId: guestMerchantId },
          process.env.JWT_SECRET,
          { expiresIn: "7d" },
        );

        res.cookie("userToken", token, {
          httpOnly: true,
          secure: true,
          sameSite: "none",
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        const cartItems = (existingUser.cartItems || []).filter(
          (item) =>
            item.merchantId &&
            item.merchantId.toString() === guestMerchantId.toString(),
        );

        return res.status(200).json({
          success: true,
          message: "Account merged successfully.",
          merged: true,
          data: {
            _id: existingUser._id,
            name: existingUser.name,
            email: existingUser.email,
            isGuest: false,
          },
          cartItems,
        });
      }

      // ===== NORMAL PATH: no collision =====
      try {
        user.email = email;
        user.password = await bcrypt.hash(password, 10);
        user.isGuest = false;
        await user.save();
      } catch (err) {
        if (err.code === 11000) {
          return res.status(409).json({
            success: false,
            message:
              "An account with this email already exists for this store. Please log in instead.",
            code: "EMAIL_EXISTS_FOR_MERCHANT",
          });
        }
        throw err;
      }
    } else {
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
