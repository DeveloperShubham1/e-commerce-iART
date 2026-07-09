import express from "express";

import {
  getPosts,
  getComments,
  getMessages,
  getPostById,
} from "../controllers/instagramController.js";
import authMerchant from "../middlewares/merchantAuth.js";

const instagramRouter = express.Router();

instagramRouter.get("/posts", authMerchant, getPosts);

instagramRouter.get("/comments", authMerchant, getComments);

instagramRouter.get("/messages", authMerchant, getMessages);

instagramRouter.get("/post/:id", authMerchant, getPostById);

export default instagramRouter;
