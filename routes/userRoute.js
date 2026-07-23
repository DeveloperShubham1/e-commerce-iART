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
  placeUpiOrder
} from "../controllers/orderController.js";
import { productListByUser } from "../controllers/productController.js";
import {
  getMerchantSettings,
  getPaymentConfigforUser,
} from "../controllers/merchantController.js";
import {
  igExchange,
  completeGuestProfile,
} from "../controllers/authController.js";

const userRouter = express.Router();

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
userRouter.get("/payment-config", getPaymentConfigforUser);

export default userRouter;
