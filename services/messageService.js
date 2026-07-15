import MessageLog from "../models/MessageLog.js";
import { findProductByMediaId } from "./productService.js";
import { replyToComment, sendInstagramDM } from "./instagramApi.js";
import { loadMerchantConfig } from "../configs/merchantConfigService.js";
import { createIgAuthToken } from "./authTokenService.js";

const SEND_DM = (process.env.SEND_DM ?? "true") === "true";
const SEND_REPLY = (process.env.SEND_REPLY ?? "true") === "true";

// ── Message builders ──────────────────────────────────────────────────────────

function buildReplyText() {
  return `Thanks for your interest! 😊 We've sent you the product link in your DM. Check it out! 📩`;
}

function buildDMText(dmProductUrl) {
  return `Hi! 👋\nThanks for your comment!\n\nHere's the product link you were interested in:\n👉 ${dmProductUrl}\n\nFeel free to reach out if you have any questions. 😊`;
}

function buildProductUrl(product, merchantConfig) {
  return (
    product.product_url ||
    `${merchantConfig.siteBaseUrl}/product/${product.product_id}`
  );
}

function buildDMProductUrl(baseUrl, igToken) {
  const sep = baseUrl.includes("?") ? "&" : "?";
  return `${baseUrl}${sep}source=ig_dm&token=${igToken}`;
}

// ── Main handler ──────────────────────────────────────────────────────────────

/**
 * Handles a single "comments" change event from the webhook payload.
 *
 * Flow:
 *  1. Reserve comment_id in MessageLog (idempotency guard)
 *  2. Load merchant config from MongoDB (tokens, IDs)
 *  3. Find InstagramProduct mapped to this media_id
 *  4. Send PUBLIC comment reply → "Thanks! Check your DM 📩"
 *  5. Mint a single-use auth token, build a token-bearing DM link
 *  6. Send PRIVATE DM          → product URL + token (source=ig_dm)
 *  7. Update MessageLog with final status
 *
 * IMPORTANT: the auth token must NEVER appear in a public reply. If the DM
 * fails, the fallback public reply uses the plain (token-less) product URL.
 */
export async function handleCommentEvent(commentPayload, merchantId) {
  const {
    id: comment_id,
    media,
    from,
    text,
  } = normalizeCommentPayload(commentPayload);

  if (!comment_id) {
    console.log("Skipping comment event - missing comment id", commentPayload);
    return;
  }

  // ── Step 1: Reserve comment_id (idempotency) ──────────────────────
  let logEntry;
  try {
    logEntry = await MessageLog.create({
      comment_id,
      merchant_id: merchantId,
      media_id: media?.id,
      commenter_id: from?.id,
      commenter_username: from?.username,
      comment_text: text,
      status: "pending",
    });
  } catch (err) {
    if (err.code === 11000) {
      console.log(
        `Comment ${comment_id} already processed - skipping (idempotent)`,
      );
      return;
    }
    throw err;
  }

  try {
    // ── Step 2: Load merchant's credentials from MongoDB ──────────────
    const merchantConfig = await loadMerchantConfig(merchantId);

    // ── Step 3: Find product mapped to this media ─────────────────────
    const product = media?.id
      ? await findProductByMediaId(media.id, merchantId)
      : null;

    if (!product) {
      logEntry.status = "no_product_match";
      await logEntry.save();
      console.log(
        `No product mapped for media ${media?.id} (merchant: ${merchantId})`,
      );
      return;
    }

    // Plain, token-less URL — safe for public fallback replies.
    const productUrl = buildProductUrl(product, merchantConfig);
    logEntry.product_id = product.product_id;
    logEntry.product_url = productUrl;

    // ── Step 4: Mint single-use auth token for the DM link ─────────────
    // If this fails for any reason, fall back to the plain URL in the DM
    // rather than blocking the whole flow — user still gets the link,
    // they'll just hit the normal login instead of being auto-logged-in.
    let dmProductUrl = productUrl;
    try {
      if (from?.id) {
        const igToken = await createIgAuthToken({
          merchantId,
          igsid: from.id,
          username: from.username,
          commentId: comment_id,
          productId: product.product_id,
        });
        dmProductUrl = buildDMProductUrl(productUrl, igToken);
      } else {
        console.log(
          `No commenter id present for comment ${comment_id} - sending DM without auth token`,
        );
      }
    } catch (err) {
      logEntry.token_error = extractErrMsg(err);
      console.log(
        `Failed to create ig auth token for comment ${comment_id}:`,
        logEntry.token_error,
      );
    }

    let replyOk = !SEND_REPLY;
    let dmOk = !SEND_DM;

    // ── Step 5: Send PUBLIC comment reply first ───────────────────────
    // "Thanks for your interest! Check your DM 📩"
    // This goes first so the commenter sees instant acknowledgement
    // even if the DM takes a moment.
    if (SEND_REPLY) {
      try {
        await replyToComment(comment_id, buildReplyText(), merchantConfig);
        logEntry.reply_sent = true;
        replyOk = true;
        console.log(
          `Comment reply sent for ${comment_id} (merchant: ${merchantId})`,
        );
      } catch (err) {
        logEntry.reply_error = extractErrMsg(err);
        console.log(
          `Failed to reply to comment ${comment_id}:`,
          logEntry.reply_error,
        );
      }
    }

    // ── Step 6: Send PRIVATE DM with token-bearing product link ────────
    // Uses PAGE_ID in the path (not igBusinessId) + accessToken.
    // recipient.comment_id opens the messaging window for this commenter.
    if (SEND_DM) {
      try {
        await sendInstagramDM(
          comment_id,
          buildDMText(dmProductUrl),
          merchantConfig,
        );
        logEntry.dm_sent = true;
        dmOk = true;
        console.log(
          `DM sent for comment ${comment_id} (merchant: ${merchantId})`,
        );
      } catch (err) {
        logEntry.dm_error = extractErrMsg(err);
        console.log(
          `Failed to send DM for comment ${comment_id}:`,
          logEntry.dm_error,
        );

        // DM failed — update the comment reply to include the link directly
        // so the user isn't left without the product URL.
        // NOTE: deliberately uses the plain `productUrl`, never `dmProductUrl`
        // — the auth token must never be posted publicly on the comment.
        if (SEND_REPLY && replyOk) {
          try {
            await replyToComment(
              comment_id,
              `Thanks for your interest! Here's the product link: ${productUrl} 🛍️`,
              merchantConfig,
            );
            console.log(
              `Fallback reply with link sent for comment ${comment_id}`,
            );
          } catch (fallbackErr) {
            console.log(
              `Fallback reply also failed:`,
              extractErrMsg(fallbackErr),
            );
          }
        }
      }
    }

    // ── Step 7: Final status ──────────────────────────────────────────
    logEntry.status =
      replyOk && dmOk
        ? "success"
        : replyOk || dmOk
          ? "partial_failure"
          : "failed";

    await logEntry.save();
  } catch (err) {
    logEntry.status = "failed";
    logEntry.dm_error = logEntry.dm_error || extractErrMsg(err);
    await logEntry.save();
    console.log(
      `Unexpected error processing comment ${comment_id}:`,
      err.message,
    );
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function normalizeCommentPayload(payload) {
  return {
    id: payload.id,
    text: payload.text,
    from: payload.from,
    media: payload.media,
  };
}

function extractErrMsg(err) {
  return err?.response?.data ? JSON.stringify(err.response.data) : err.message;
}

// import MessageLog from "../models/MessageLog.js";
// import { findProductByMediaId } from "./productService.js";
// import { replyToComment, sendInstagramDM } from "./instagramApi.js";
// import { loadMerchantConfig } from "../configs/merchantConfigservice.js";

// const SEND_DM = (process.env.SEND_DM ?? "true") === "true";
// const SEND_REPLY = (process.env.SEND_REPLY ?? "true") === "true";

// // ── Message builders ──────────────────────────────────────────────────────────

// function buildReplyText() {
//   // Public comment reply — tells user to check DM
//   return `Thanks for your interest! 😊 We've sent you the product link in your DM. Check it out! 📩`;
// }

// function buildDMText(productUrl) {
//   // Private DM — contains the actual product link
//   return `Hi! 👋\nThanks for your comment!\n\nHere's the product link you were interested in:\n👉 ${productUrl}\n\nFeel free to reach out if you have any questions. 😊`;
// }

// function buildProductUrl(product, merchantConfig) {
//   return (
//     product.product_url ||
//     `${merchantConfig.siteBaseUrl}/product/${product.product_id}`
//   );
// }

// // ── Main handler ──────────────────────────────────────────────────────────────

// /**
//  * Handles a single "comments" change event from the webhook payload.
//  *
//  * Flow:
//  *  1. Reserve comment_id in MessageLog (idempotency guard)
//  *  2. Load merchant config from MongoDB (tokens, IDs)
//  *  3. Find InstagramProduct mapped to this media_id
//  *  4. Send PUBLIC comment reply → "Thanks! Check your DM 📩"
//  *  5. Send PRIVATE DM          → actual product URL
//  *  6. Update MessageLog with final status
//  */
// export async function handleCommentEvent(commentPayload, merchantId) {
//   const {
//     id: comment_id,
//     media,
//     from,
//     text,
//   } = normalizeCommentPayload(commentPayload);

//   if (!comment_id) {
//     console.log("Skipping comment event - missing comment id", commentPayload);
//     return;
//   }

//   // ── Step 1: Reserve comment_id (idempotency) ──────────────────────
//   let logEntry;
//   try {
//     logEntry = await MessageLog.create({
//       comment_id,
//       merchant_id: merchantId,
//       media_id: media?.id,
//       commenter_id: from?.id,
//       commenter_username: from?.username,
//       comment_text: text,
//       status: "pending",
//     });
//   } catch (err) {
//     if (err.code === 11000) {
//       console.log(
//         `Comment ${comment_id} already processed - skipping (idempotent)`,
//       );
//       return;
//     }
//     throw err;
//   }

//   try {
//     // ── Step 2: Load merchant's credentials from MongoDB ──────────────
//     const merchantConfig = await loadMerchantConfig(merchantId);

//     // ── Step 3: Find product mapped to this media ─────────────────────
//     const product = media?.id
//       ? await findProductByMediaId(media.id, merchantId)
//       : null;

//     if (!product) {
//       logEntry.status = "no_product_match";
//       await logEntry.save();
//       console.log(
//         `No product mapped for media ${media?.id} (merchant: ${merchantId})`,
//       );
//       return;
//     }

//     const productUrl = buildProductUrl(product, merchantConfig);
//     logEntry.product_id = product.product_id;
//     logEntry.product_url = productUrl;

//     let replyOk = !SEND_REPLY;
//     let dmOk = !SEND_DM;

//     // ── Step 4: Send PUBLIC comment reply first ───────────────────────
//     // "Thanks for your interest! Check your DM 📩"
//     // This goes first so the commenter sees instant acknowledgement
//     // even if the DM takes a moment.
//     if (SEND_REPLY) {
//       try {
//         await replyToComment(comment_id, buildReplyText(), merchantConfig);
//         logEntry.reply_sent = true;
//         replyOk = true;
//         console.log(
//           `Comment reply sent for ${comment_id} (merchant: ${merchantId})`,
//         );
//       } catch (err) {
//         logEntry.reply_error = extractErrMsg(err);
//         console.log(
//           `Failed to reply to comment ${comment_id}:`,
//           logEntry.reply_error,
//         );
//       }
//     }

//     // ── Step 5: Send PRIVATE DM with product link ─────────────────────
//     // Uses PAGE_ID in the path (not igBusinessId) + accessToken.
//     // recipient.comment_id opens the messaging window for this commenter.
//     if (SEND_DM) {
//       try {
//         await sendInstagramDM(
//           comment_id,
//           buildDMText(productUrl),
//           merchantConfig,
//         );
//         logEntry.dm_sent = true;
//         dmOk = true;
//         console.log(
//           `DM sent for comment ${comment_id} (merchant: ${merchantId})`,
//         );
//       } catch (err) {
//         logEntry.dm_error = extractErrMsg(err);
//         console.log(
//           `Failed to send DM for comment ${comment_id}:`,
//           logEntry.dm_error,
//         );

//         // DM failed — update the comment reply to include the link directly
//         // so the user isn't left without the product URL
//         if (SEND_REPLY && replyOk) {
//           try {
//             await replyToComment(
//               comment_id,
//               `Thanks for your interest! Here's the product link: ${productUrl} 🛍️`,
//               merchantConfig,
//             );
//             console.log(
//               `Fallback reply with link sent for comment ${comment_id}`,
//             );
//           } catch (fallbackErr) {
//             console.log(
//               `Fallback reply also failed:`,
//               extractErrMsg(fallbackErr),
//             );
//           }
//         }
//       }
//     }

//     // ── Step 6: Final status ──────────────────────────────────────────
//     logEntry.status =
//       replyOk && dmOk
//         ? "success"
//         : replyOk || dmOk
//           ? "partial_failure"
//           : "failed";

//     await logEntry.save();
//   } catch (err) {
//     logEntry.status = "failed";
//     logEntry.dm_error = logEntry.dm_error || extractErrMsg(err);
//     await logEntry.save();
//     console.log(
//       `Unexpected error processing comment ${comment_id}:`,
//       err.message,
//     );
//   }
// }

// // ── Helpers ───────────────────────────────────────────────────────────────────

// function normalizeCommentPayload(payload) {
//   return {
//     id: payload.id,
//     text: payload.text,
//     from: payload.from,
//     media: payload.media,
//   };
// }

// function extractErrMsg(err) {
//   return err?.response?.data ? JSON.stringify(err.response.data) : err.message;
// }
