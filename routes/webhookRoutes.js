import express from "express";
import {
  verifyWebhook,
  receiveWebhook,
} from "../controllers/webhookController.js";
import { verifySignature } from "../middlewares/verifySignature.js";

const router = express.Router();

// Each merchant registers their own callback URL in their Meta App Dashboard:
//   https://yourserver.com/webhook/{merchantId}
//
// GET  → Meta calls this once to verify the webhook subscription
//         checks hub.verify_token against Merchant.instagram.verifyToken
//
// POST → Meta sends real comment events here
//         verifySignature middleware checks X-Hub-Signature-256
//         against Merchant.instagram.appSecret before anything else runs

router.get("/webhook/:merchantId", verifyWebhook);

router.post(
  "/webhook/:merchantId",
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf; // capture raw bytes for HMAC verification
    },
  }),
  verifySignature,
  receiveWebhook,
);

export default router;
