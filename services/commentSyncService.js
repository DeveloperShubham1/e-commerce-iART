import MessageLog from "../models/MessageLog.js";
import InstagramProduct from "../models/InstagramProduct.js";
import { fetchMediaComments } from "./instagramApi.js";
import { loadMerchantConfig } from "../configs/merchantConfigService.js";
import { handleCommentEvent } from "./messageService.js";

export async function syncNewCommentsForMedia(
  mediaId,
  merchantId,
  merchantConfig,
) {
  const comments = await fetchMediaComments(mediaId, merchantConfig);

  if (!comments.length) {
    return { mediaId, total: 0, processed: 0, skipped: 0, results: [] };
  }

  const commentIds = comments.map((c) => c.id);

  const alreadyProcessed = await MessageLog.find({
    comment_id: { $in: commentIds },
  })
    .select("comment_id")
    .lean();

  const processedSet = new Set(alreadyProcessed.map((d) => d.comment_id));
  const newComments = comments.filter((c) => !processedSet.has(c.id));

  const results = [];

  for (const comment of newComments) {
    const commentPayload = {
      id: comment.id,
      text: comment.text,
      from: comment.from
        ? { id: comment.from.id, username: comment.from.username }
        : { username: comment.username },
      media: { id: mediaId },
    };

    try {
      await handleCommentEvent(commentPayload, merchantId);
      results.push({ comment_id: comment.id, status: "processed" });
    } catch (err) {
      results.push({
        comment_id: comment.id,
        status: "error",
        error: err.message,
      });
    }
  }

  return {
    mediaId,
    total: comments.length,
    processed: newComments.length,
    skipped: comments.length - newComments.length,
    results,
  };
}

export async function syncNewCommentsForAllMedia(merchantId) {
  const merchantConfig = await loadMerchantConfig(merchantId);

  const mappings = await InstagramProduct.find({
    merchantId,
    active: true,
  })
    .select("instagram_media_id title")
    .lean();

  if (!mappings.length) {
    return { totalMedia: 0, mediaResults: [] };
  }

  const mediaResults = [];

  // Sequential, not Promise.all — avoids bursting past the 750/hr
  // private-reply limit and the messaging send-rate limits per merchant.
  for (const mapping of mappings) {
    try {
      const result = await syncNewCommentsForMedia(
        mapping.instagram_media_id,
        merchantId,
        merchantConfig,
      );
      mediaResults.push({ title: mapping.title, ...result });
    } catch (err) {
      mediaResults.push({
        title: mapping.title,
        mediaId: mapping.instagram_media_id,
        status: "error",
        error: err.message,
      });
    }
  }

  const totals = mediaResults.reduce(
    (acc, r) => ({
      total: acc.total + (r.total || 0),
      processed: acc.processed + (r.processed || 0),
      skipped: acc.skipped + (r.skipped || 0),
    }),
    { total: 0, processed: 0, skipped: 0 },
  );

  return {
    totalMedia: mappings.length,
    ...totals,
    // mediaResults,
    message: "Sync completed for all media items.",
  };
}
