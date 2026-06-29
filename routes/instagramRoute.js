const {
  fetchMediaDetails,
  fetchAllComments,
  fetchAllInstagramMessages,
} = require("../controllers/instagramApi");
import express from "express";

const instagramRouter = express.Router();

instagramRouter.get("/posts", async (req, res) => {
  const posts = await fetchMediaDetails();
  res.json(posts);
});

instagramRouter.get("/comments", async (req, res) => {
  const posts = await fetchMediaDetails();
  const comments = await fetchAllComments(posts);
  res.json(comments);
});

instagramRouter.get("/messages", async (req, res) => {
  const messages = await fetchAllInstagramMessages();
  res.json(messages);
});

export default instagramRouter;
