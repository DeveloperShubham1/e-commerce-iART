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
} from "../controllers/orderController.js";
import { productListByUser } from "../controllers/productController.js";
import { getMerchantSettings } from "../controllers/merchantController.js";

const userRouter = express.Router();

userRouter.post("/register", register);
userRouter.post("/login", login);
userRouter.get("/is-auth", authUser, isAuth);
userRouter.get("/logout", authUser, logout);

//  user action
userRouter.get("/categories", getCategories);
userRouter.get("/product/list", productListByUser);
userRouter.post("/order/cod", authUser, placeOrder);
userRouter.get("/orders", authUser, getOrdersByUserId);
userRouter.get("/settings", getMerchantSettings);

export default userRouter;
