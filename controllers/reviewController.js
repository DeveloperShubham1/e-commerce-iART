import Review from "../models/Review.js";
import Order from "../models/Order.js";

// POST /api/reviews/add
export const addReview = async (req, res) => {
  try {
    const { orderId, rating, comment, customerPhone } = req.body;

    if (!orderId || !rating || !customerPhone) {
      return res.status(400).json({
        success: false,
        message: "Order ID, rating, and customer phone are required",
      });
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ success: false, message: "Rating must be between 1 and 5" });
    }

    // Check if order exists
    const order = await Order.findById(orderId);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    // Ensure the order belongs to this customer
    if (order.customer.phone !== customerPhone) {
      return res.status(403).json({
        success: false,
        message: "This order does not belong to the provided phone number",
      });
    }

    // Ensure order is delivered
    if (order.orderStatus !== "delivered") {
      return res.status(400).json({
        success: false,
        message: "You can only review an order after it has been delivered",
      });
    }

    // Prevent duplicate reviews for the same order
    const existingReview = await Review.findOne({ orderId });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "You have already submitted a review for this order",
      });
    }

    // Create review
    const review = await Review.create({
      orderId,
      merchantId: order.merchantId,
      customerPhone,
      rating,
      comment,
    });

    return res.status(201).json({
      success: true,
      message: "Review submitted successfully",
      review,
    });
  } catch (error) {
    console.error("Add review error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error submitting review",
    });
  }
};

export const getMerchantReviews = async (req, res) => {
  try {
    const { merchantId } = req.params;
    const { sortBy } = req.query; // optional query param like ?sortBy=date or ?sortBy=rating

    if (!merchantId) {
      return res
        .status(400)
        .json({ success: false, message: "Merchant ID is required" });
    }

    // Default sort: newest first (date desc) then rating desc
    let sortOptions = { createdAt: -1, rating: -1 };

    // Handle query-based sorting
    if (sortBy) {
      switch (sortBy.toLowerCase()) {
        case "ratingasc":
          sortOptions = { rating: 1, createdAt: -1 };
          break;
        case "ratingdesc":
          sortOptions = { rating: -1, createdAt: -1 };
          break;
        case "dateasc":
          sortOptions = { createdAt: 1, rating: -1 };
          break;
        case "datedesc":
          sortOptions = { createdAt: -1, rating: -1 };
          break;
        default:
          sortOptions = { createdAt: -1, rating: -1 };
          break;
      }
    }

    const reviews = await Review.find({ merchantId })
      .populate("orderId", "orderId totalAmount createdAt")
      .sort(sortOptions);

    return res.json({
      success: true,
      count: reviews.length,
      sortBy: sortBy || "datedesc + ratingdesc",
      reviews,
    });
  } catch (error) {
    console.error("Get merchant reviews error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error fetching reviews",
    });
  }
};
