import express from "express";
import {
  isAuth,
  login,
  logout,
  register,
} from "../controllers/userController.js";

import authUser from "../middlewares/authUser.js";
import { getCategories } from "../controllers/categoryController.js";
import {
  getOrdersByUserId,
  placeOrder,
  placeUpiOrder,
} from "../controllers/orderController.js";
import { productListByUser } from "../controllers/productController.js";
import {
  getMerchantSettings,
  getPaymentConfigforUser,
  getHomeData,
} from "../controllers/merchantController.js";
import {
  igExchange,
  completeGuestProfile,
} from "../controllers/authController.js";

import {
  sendOtp,
  verifyOtp,
  resendOtp,
  updateProfile,
  verifyPhoneUpdate,
  resendPhoneUpdateOtp,
} from "../controllers/userOtpController.js";

const userRouter = express.Router();

// otp route
userRouter.post("/otp/send", sendOtp);
userRouter.post("/otp/verify", verifyOtp);
userRouter.post("/otp/resend", resendOtp);

// update profile

userRouter.patch("/profile", authUser, updateProfile);
userRouter.post("/verify-phone-update", authUser, verifyPhoneUpdate);
userRouter.post("/resend-phone-update-otp", authUser, resendPhoneUpdateOtp);

userRouter.post("/register", register);
userRouter.post("/login", login);
userRouter.get("/is-auth", authUser, isAuth);
userRouter.get("/logout", authUser, logout);
userRouter.get("/ig-exchange", igExchange);
userRouter.put("/update-profile", authUser, completeGuestProfile);

//  user action
userRouter.get("/categories", getCategories);
userRouter.get("/product/list", productListByUser);
userRouter.post("/order/cod", authUser, placeOrder);
userRouter.post("/order/upi", authUser, placeUpiOrder);
userRouter.get("/orders", authUser, getOrdersByUserId);
userRouter.get("/settings", getMerchantSettings);
userRouter.get("/home", authUser, getHomeData);
userRouter.get("/payment-config", getPaymentConfigforUser);

export default userRouter;
