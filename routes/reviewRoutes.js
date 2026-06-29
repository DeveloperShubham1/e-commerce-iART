import express from "express";
import { addReview, getMerchantReviews } from "../controllers/reviewController.js";

const router = express.Router();

router.post("/add", addReview);
router.get("/merchant/:merchantId", getMerchantReviews);

export default router;
