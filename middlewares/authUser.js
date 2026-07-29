import jwt from "jsonwebtoken";
import User from "../models/User.js";

const authUser = async (req, res, next) => {
  try {
    // Get token from cookies
    const { userToken } = req.cookies;

    if (!userToken) {
      return res
        .status(401)
        .json({ success: false, message: "Not Authorized, token missing" });
    }

    // Verify token
    const decoded = jwt.verify(userToken, process.env.JWT_SECRET);


    if (decoded.guest) {
      req.guest = { igsid: decoded.igsid, username: decoded.username };
      return next();
    }

    // Fetch user using decoded.userId
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found or unauthorized",
      });
    }

    // Attach user object to req
    req.user = user.toObject();
    req.user.merchantId = decoded.merchantId;

    next();
  } catch (error) {
    console.error("Auth error:", error.message);
    return res
      .status(401)
      .json({ success: false, message: "Invalid or expired token" });
  }
};

export default authUser;
