import User from "../models/User.js";
import Product from "../models/Product.js";

// Create api for add cart
export const addToCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId, variantId, size, quantity = 1 } = req.body;

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

    const user = await User.findById(userId);

    const existingItem = user.cartItems.find(
      (i) =>
        i.productId.equals(productId) &&
        i.variantId.equals(variantId) &&
        i.size === size
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      user.cartItems.push({
        productId,
        variantId,
        size,
        quantity,
        price: sizeData.price,
        offerPrice: sizeData.offerPrice,
      });
    }

    await user.save();

    res.json({
      success: true,
      message: "Item added to cart",
      cartItems: user.cartItems,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// update api for update cart

// export const updateCartItem = async (req, res) => {
//   try {
//     const userId = req.user._id;

//     const { productId, variantId, size, quantity } = req.body;

//     const user = await User.findById(userId);

//     const item = user.cartItems.find(
//       (i) =>
//         i.productId.equals(productId) &&
//         i.variantId.equals(variantId) &&
//         i.size === size
//     );

//     if (!item) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Cart item not found" });
//     }

//     if (quantity <= 0) {
//       user.cartItems = user.cartItems.filter((i) => i !== item);
//     } else {
//       item.quantity = quantity;
//     }

//     await user.save();

//     res.json({
//       success: true,
//       message: "Cart updated",
//       cartItems: user.cartItems,
//     });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

export const updateCartItem = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId, variantId, size, quantity } = req.body;

    const user = await User.findById(userId);

    const item = user.cartItems.find(
      (i) =>
        i.productId.equals(productId) &&
        i.variantId.equals(variantId) &&
        i.size === size
    );

    if (!item) {
      return res
        .status(404)
        .json({ success: false, message: "Cart item not found" });
    }

    // ---------------------------
    // ✅ STOCK CHECK (ADDED)
    // ---------------------------
    if (quantity > 0) {
      const product = await Product.findById(productId);
      const variant = product?.variants.id(variantId);
      const sizeData = variant?.sizes.find((s) => s.size === size);

      if (!sizeData) {
        return res
          .status(404)
          .json({ success: false, message: "Invalid size" });
      }

      if (sizeData.stock < quantity) {
        return res
          .status(400)
          .json({ success: false, message: "Insufficient stock" });
      }
    }

    // ---------------------------
    // UPDATE / REMOVE ITEM
    // ---------------------------
    if (quantity <= 0) {
      user.cartItems = user.cartItems.filter((i) => i !== item);
    } else {
      item.quantity = quantity;
    }

    await user.save();

    res.json({
      success: true,
      message: "Cart updated",
      cartItems: user.cartItems,
    });
  } catch (err) {
    console.error("Update cart error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// api for delete cart
export const removeCartItem = async (req, res) => {
  try {
    const userId = req.user._id;

    const { productId, variantId, size } = req.body;
    const user = await User.findById(userId);
    user.cartItems = user.cartItems.filter(
      (i) =>
        !(
          i.productId.equals(productId) &&
          i.variantId.equals(variantId) &&
          i.size === size
        )
    );
    await user.save();
    res.json({
      success: true,
      message: "Item removed from cart",
      cartItems: user.cartItems,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// get api for getcarts
export const getCart = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      cartItems: user.cartItems,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch cart",
      error: error.message,
    });
  }
};
