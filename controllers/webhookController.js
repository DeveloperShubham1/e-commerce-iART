import Merchant from "../models/Merchants.js";
import WebhookEvent from "../models/WebhookEvent.js";
import { handleCommentEvent } from "../services/messageService.js";

/**
 * GET /webhook/:merchantId
 *
 * Meta calls this when the merchant saves their webhook config in
 * their own Meta App Dashboard. Each merchant registers:
 *   Callback URL: https://yourserver.com/webhook/{their_merchant_id}
 *   Verify Token: the value stored in Merchant.instagram.verifyToken
 *
 * We look up the merchant and compare hub.verify_token against
 * their own stored verifyToken — not a global .env value.
 */
export async function verifyWebhook(req, res) {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  const merchantId = req.params.merchantId;

  if (mode !== "subscribe" || !token) {
    return res.sendStatus(403);
  }

  try {
    const merchant = await Merchant.findById(merchantId).select(
      "instagram.verifyToken MerchantName",
    );

    if (!merchant) {
      console.log(`Webhook verify failed: merchant ${merchantId} not found`);
      return res.sendStatus(404);
    }

    const storedToken = merchant.instagram?.verifyToken;

    if (!storedToken) {
      console.log(
        `Webhook verify failed: merchant ${merchant.MerchantName} has no verifyToken configured`,
      );
      return res.sendStatus(403);
    }

    if (token !== storedToken) {
      console.log(
        `Webhook verify failed: token mismatch for merchant ${merchant.MerchantName}`,
      );
      return res.sendStatus(403);
    }

    console.log(`Webhook verified for merchant: ${merchant.MerchantName}`);
    return res.status(200).send(challenge);
  } catch (err) {
    console.log("Webhook verify error:", err.message);
    return res.sendStatus(500);
  }
}

/**
 * POST /webhook/:merchantId
 *
 * Receives real-time comment events from Meta for a specific merchant's
 * Instagram account. Signature has already been verified against this
 * merchant's own APP_SECRET by verifySignature middleware.
 *
 * Acks immediately with 200, then processes async — Meta will
 * retry if it doesn't get a fast response.
 */
export async function receiveWebhook(req, res) {
  res.sendStatus(200); // ack immediately

  console.log("Received webhook event for merchant:", JSON.stringify(req.body));

  const body = req.body;
  const merchantId = req.params.merchantId; // set by verifySignature middleware

  let eventLog;
  try {
    eventLog = await WebhookEvent.create({
      event_type: body.object,
      merchant_id: merchantId,
      raw_payload: body,
    });
  } catch (err) {
    console.log("Failed to log webhook event:", err.message);
  }

  try {
    await processWebhookBody(body, merchantId);
    if (eventLog) {
      eventLog.processed = true;
      await eventLog.save();
    }
  } catch (err) {
    console.log("Error processing webhook body:", err.message);
    if (eventLog) {
      eventLog.processing_error = err.message;
      await eventLog.save();
    }
  }
}

async function processWebhookBody(body, merchantId) {
  if (body.object !== "instagram") return;

  for (const entry of body.entry || []) {
    for (const change of entry.changes || []) {
      console.log(`Processing change for merchant ${merchantId}:`, change);
      if (change.field === "comments") {
        // Pass merchantId so handleCommentEvent can load the
        // correct merchant config for this specific account
        await handleCommentEvent(change.value, merchantId);
      }
    }
  }
}
