import express from "express";
import authUser from "../middlewares/authUser.js";
import {
  addToCart,
  updateCartItem,
  removeCartItem,
  getCart,
} from "../controllers/cartController.js";

const cartRouter = express.Router();

cartRouter.post("/add", authUser, addToCart);

cartRouter.put("/update", authUser, updateCartItem);

cartRouter.delete("/remove", authUser, removeCartItem);

cartRouter.get("/", authUser, getCart);

export default cartRouter;
