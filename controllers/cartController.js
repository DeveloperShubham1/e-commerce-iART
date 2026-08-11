import User from "../models/User.js";
import Product from "../models/Product.js";

// Create api for add cart
export const addToCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const merchantId = req?.user?.merchantId;

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
        i.size === size,
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
        merchantId,
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
        i.size === size,
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
        ),
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
    const merchantId = req.user.merchantId;

    const user = await User.findById(userId).select("cartItems");

    const cartItems = (user?.cartItems || []).filter(
      (item) => item.merchantId.toString() === merchantId.toString(),
    );

    if (cartItems.length === 0) {
      return res.status(200).json({ success: true, cartItems: [] });
    }

    // Get unique productIds present in the cart
    const productIds = [
      ...new Set(cartItems.map((item) => item.productId.toString())),
    ];

    // Fetch only the needed products
    const products = await Product.find({ _id: { $in: productIds } })
      .select("variants")
      .lean();

    // Build a quick lookup map: productId -> product
    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    const enrichedCartItems = cartItems.map((item) => {
      const itemObj = item.toObject ? item.toObject() : item;

      const product = productMap.get(item.productId.toString());
      if (!product) {
        // Product no longer exists — flag it and keep old values as fallback
        return { ...itemObj, isAvailable: false };
      }

      const variant = product.variants.id
        ? product.variants.id(item.variantId) // if not lean(), Mongoose subdoc helper
        : product.variants.find(
            (v) => v._id.toString() === item.variantId.toString(),
          );

      if (!variant) {
        return { ...itemObj, isAvailable: false };
      }

      const sizeEntry = variant.sizes.find((s) => s.size === item.size);

      if (!sizeEntry) {
        return { ...itemObj, isAvailable: false };
      }

      return {
        ...itemObj,
        price: sizeEntry.price,
        offerPrice: sizeEntry.offerPrice,
        stock: sizeEntry.stock,
        isAvailable: sizeEntry.stock >= item.quantity,
      };
    });

    return res.status(200).json({
      success: true,
      cartItems: enrichedCartItems,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch cart",
      error: error.message,
    });
  }
};
