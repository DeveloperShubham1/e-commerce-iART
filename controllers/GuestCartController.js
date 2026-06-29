import GuestCart from "../models/GuestCart.js";
import User from "../models/User.js";
import Product from "../models/Product.js";
import { v4 as uuidv4 } from "uuid";

// export const addToGuestCart = async (req, res) => {
//   try {
//     const { guestId, item } = req.body;
//     const { productId, variantId, size, quantity } = item;

//     // 1️⃣ Fetch product from DB
//     const product = await Product.findById(productId);
//     if (!product) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Product not found" });
//     }

//     // 2️⃣ Find variant
//     const variant = product.variants.id(variantId);
//     if (!variant) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Variant not found" });
//     }

//     // 3️⃣ Price logic
//     const price = variant.price;
//     const offerPrice = variant.offerPrice || null;

//     // 4️⃣ Find or create guest cart
//     let cart = guestId ? await GuestCart.findOne({ guestId }) : null;

//     if (!cart) {
//       cart = new GuestCart({
//         guestId: guestId || uuidv4(),
//         cartItems: [],
//       });
//     }

//     // 5️⃣ Check if item already exists
//     const existingItem = cart.cartItems.find(
//       (i) =>
//         i.productId.toString() === productId &&
//         i.variantId.toString() === variantId &&
//         i.size === size
//     );

//     if (existingItem) {
//       existingItem.quantity += quantity;
//     } else {
//       cart.cartItems.push({
//         productId,
//         variantId,
//         size,
//         quantity,
//         price,
//         offerPrice,
//       });
//     }

//     await cart.save();

//     res.json({
//       success: true,
//       guestId: cart.guestId,
//       cartItems: cart.cartItems,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: "Add to cart failed" });
//   }
// };

export const addToGuestCart = async (req, res) => {
  try {
    const { guestId, item } = req.body;
    const { productId, variantId, size, quantity = 1 } = item;

    if (!productId || !variantId || !size) {
      return res
        .status(400)
        .json({ success: false, message: "Missing fields" });
    }

    const product = await Product.findById(productId);
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });

    const variant = product.variants.id(variantId);
    if (!variant)
      return res
        .status(404)
        .json({ success: false, message: "Variant not found" });

    const sizeData = variant.sizes.find((s) => s.size === size);
    if (!sizeData)
      return res
        .status(404)
        .json({ success: false, message: "Please select a Size" });

    if (sizeData.stock < quantity) {
      return res
        .status(400)
        .json({ success: false, message: "Insufficient stock" });
    }

    let cart = guestId ? await GuestCart.findOne({ guestId }) : null;

    if (!cart) {
      cart = new GuestCart({
        guestId: guestId || uuidv4(),
        cartItems: [],
      });
    }

    const existingItem = cart.cartItems.find(
      (i) =>
        i.productId.equals(productId) &&
        i.variantId.equals(variantId) &&
        i.size === size
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.cartItems.push({
        productId,
        variantId,
        size,
        quantity,
        price: sizeData.price, // ✅ REQUIRED FIELD
        offerPrice: sizeData.offerPrice, // ✅ OPTIONAL
      });
    }

    await cart.save();

    res.json({
      success: true,
      guestId: cart.guestId,
      cartItems: cart.cartItems,
    });
  } catch (error) {
    console.error("Guest cart error:", error);
    res.status(500).json({ success: false, message: "Add to cart failed" });
  }
};

export const mergeCart = async (req, res) => {
  const { guestId } = req.body;
  const userId = req.user._id; // from auth middleware

  if (!guestId) return res.json({ success: true });

  const guestCart = await GuestCart.findOne({ guestId });
  if (!guestCart) return res.json({ success: true });

  const user = await User.findById(userId);

  guestCart.cartItems.forEach((guestItem) => {
    const userItem = user.cartItems.find(
      (i) =>
        i.productId.toString() === guestItem.productId.toString() &&
        i.variantId.toString() === guestItem.variantId.toString() &&
        i.size === guestItem.size
    );

    if (userItem) {
      userItem.quantity += guestItem.quantity;
    } else {
      user.cartItems.push(guestItem);
    }
  });

  await user.save();
  await GuestCart.deleteOne({ guestId });

  res.json({ success: true, cartItems: user.cartItems });
};

export const updateGuestCartItem = async (req, res) => {
  try {
    const { guestId, productId, variantId, size, quantity } = req.body;

    // ---------------------------
    // 1️⃣ VALIDATION
    // ---------------------------
    if (!guestId || !productId || !variantId || !size) {
      return res
        .status(400)
        .json({ success: false, message: "Missing fields" });
    }

    if (quantity < 1) {
      return res
        .status(400)
        .json({ success: false, message: "Quantity must be at least 1" });
    }

    // ---------------------------
    // 2️⃣ FIND GUEST CART
    // ---------------------------
    const cart = await GuestCart.findOne({ guestId });
    if (!cart)
      return res
        .status(404)
        .json({ success: false, message: "Guest cart not found" });

    // ---------------------------
    // 3️⃣ FIND ITEM
    // ---------------------------
    const cartItem = cart.cartItems.find(
      (i) =>
        i.productId.equals(productId) &&
        i.variantId.equals(variantId) &&
        i.size === size
    );

    if (!cartItem)
      return res
        .status(404)
        .json({ success: false, message: "Item not found in cart" });

    // ---------------------------
    // 4️⃣ STOCK CHECK (MATCH USER API)
    // ---------------------------
    const product = await Product.findById(productId);
    const variant = product?.variants.id(variantId);
    const sizeData = variant?.sizes.find((s) => s.size === size);

    if (!sizeData)
      return res.status(404).json({ success: false, message: "Invalid size" });

    if (sizeData.stock < quantity) {
      return res
        .status(400)
        .json({ success: false, message: "Insufficient stock" });
    }

    // ---------------------------
    // 5️⃣ UPDATE QUANTITY
    // ---------------------------
    cartItem.quantity = quantity;

    await cart.save();

    res.json({
      success: true,
      cartItems: cart.cartItems,
    });
  } catch (error) {
    console.error("Update guest cart error:", error);
    res.status(500).json({ success: false, message: "Failed to update cart" });
  }
};

export const removeFromGuestCart = async (req, res) => {
  try {
    const { guestId, productId, variantId, size } = req.body;

    // ---------------------------
    // 1️⃣ VALIDATION
    // ---------------------------
    if (!guestId || !productId || !variantId || !size) {
      return res
        .status(400)
        .json({ success: false, message: "Missing fields" });
    }

    // ---------------------------
    // 2️⃣ FIND CART
    // ---------------------------
    const cart = await GuestCart.findOne({ guestId });
    if (!cart)
      return res
        .status(404)
        .json({ success: false, message: "Guest cart not found" });

    // ---------------------------
    // 3️⃣ REMOVE ITEM
    // ---------------------------
    cart.cartItems = cart.cartItems.filter(
      (i) =>
        !(
          i.productId.equals(productId) &&
          i.variantId.equals(variantId) &&
          i.size === size
        )
    );

    await cart.save();

    res.json({
      success: true,
      message: "Item removed from cart",
      cartItems: cart.cartItems,
    });
  } catch (error) {
    console.error("Remove guest cart error:", error);
    res.status(500).json({ success: false, message: "Failed to remove item" });
  }
};

export const getGuestCart = async (req, res) => {
  try {
    const { guestId } = req.params;

    if (!guestId) {
      return res.status(400).json({
        success: false,
        message: "Guest ID is required",
      });
    }

    const guestCart = await GuestCart.findOne({ guestId });

    // Same behavior as reference response
    if (!guestCart) {
      return res.json({
        success: true,
        guestId,
        cartItems: [],
      });
    }

    res.json({
      success: true,
      guestId: guestCart.guestId,
      cartItems: guestCart.cartItems,
    });
  } catch (error) {
    console.error("Get Guest Cart Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch guest cart",
      error: error.message,
    });
  }
};
