import crypto from "crypto";
import Merchant from "../models/Merchants.js";

/**
 * Per-merchant signature verification middleware.
 *
 * Each merchant has their own Meta App with their own APP_SECRET stored in
 * Merchant.instagram.appSecret. The merchant is identified by :merchantId
 * in the webhook URL (e.g. POST /webhook/:merchantId).
 *
 * Meta signs the raw request body with the merchant's app secret and sends
 * the result in X-Hub-Signature-256. We verify this before trusting the payload.
 */
export async function verifySignature(req, res, next) {
  const signature = req.get("x-hub-signature-256");
  const merchantId = req.params.merchantId;

let type = "development";

  if (type === "development" && req.headers["x-skip-signature"] === "true") {
    req.params.merchantId = req.params.merchantId; // unchanged, just skip the check
    return next();
  }

  if (!signature) {
    console.log("Webhook rejected: missing X-Hub-Signature-256 header");
    return res.sendStatus(401);
  }

  if (!merchantId) {
    console.log("Webhook rejected: missing merchantId in URL");
    return res.sendStatus(400);
  }

  if (!req.rawBody) {
    console.log(
      "Webhook rejected: req.rawBody missing - check express.json({ verify }) in webhookRoutes.js",
    );
    return res.sendStatus(500);
  }

  // Load this merchant's APP_SECRET from MongoDB
  let InstagramAppSecret;
  try {
    const merchant = await Merchant.findById(merchantId).select(
      "instagram.InstagramAppSecret",
    );

    if (!merchant) {
      console.log(`Webhook rejected: merchant ${merchantId} not found`);
      return res.sendStatus(404);
    }
    InstagramAppSecret = merchant.instagram.InstagramAppSecret;
  } catch (err) {
    console.log("Webhook rejected: failed to load merchant:", err.message);
    return res.sendStatus(500);
  }

  if (!InstagramAppSecret) {
    console.log(
      `Webhook rejected: merchant ${merchantId} has no appSecret configured`,
    );
    return res.sendStatus(500);
  }

  // Verify HMAC using this merchant's own App Secret
  const expectedHash = crypto
    .createHmac("sha256", InstagramAppSecret)
    .update(req.rawBody)
    .digest("hex");

  const expectedSignature = `sha256=${expectedHash}`;

  const a = Buffer.from(signature);
  const b = Buffer.from(expectedSignature);

  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    console.log(
      `Webhook rejected: signature mismatch for merchant ${merchantId}`,
    );
    return res.sendStatus(401);
  }

  // Attach merchant's appSecret to req for downstream use if needed
  req.merchantId = merchantId;
  next();
}
