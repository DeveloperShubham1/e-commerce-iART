import express from "express";
import {
  addToGuestCart,
  mergeCart,
  updateGuestCartItem,
  removeFromGuestCart,
  getGuestCart,
} from "../controllers/GuestCartController.js";

import authUser from "../middlewares/authUser.js";

const guestRouter = express.Router();

guestRouter.post("/add", addToGuestCart);

guestRouter.post("/merge", authUser, mergeCart);

guestRouter.put("/update", updateGuestCartItem);

guestRouter.delete("/remove", removeFromGuestCart);

guestRouter.get("/get/:guestId", getGuestCart);

export default guestRouter;
