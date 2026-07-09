import axios from "axios";
import { GRAPH_API_VERSION } from "../configs/configIG.js";
import { withRetry } from "../utils/retry.js";

// ─────────────────────────────────────────────────────────────────────────────
// All functions accept a `merchantConfig` object as their last parameter.
// This object comes from Merchant.instagram in MongoDB (via merchantConfigService.js)
// and carries the per-merchant tokens + IDs for each API call.
//
// Shape:
// {
//   accessToken:     string,  // Facebook User token  → graph.instagram.com calls
//   pageAccessToken: string,  // Facebook Page token  → graph.facebook.com calls
//   igBusinessId:    string,  // IG Business Account ID
//   pageId:          string,  // Facebook Page ID
//   siteBaseUrl:     string,  // merchant's store URL
//   graphApiVersion: string,  // e.g. "v25.0" (falls back to .env default)
// }
//
// Nothing is read from .env here except GRAPH_API_VERSION as a fallback default.
// ─────────────────────────────────────────────────────────────────────────────

function igBaseUrl(mc) {
  return `https://graph.instagram.com/${mc?.graphApiVersion || GRAPH_API_VERSION}`;
}

function fbBaseUrl(mc) {
  return `https://graph.facebook.com/${mc?.graphApiVersion || GRAPH_API_VERSION}`;
}

async function makeGetRequest(endpoint, params = {}, mc) {
  try {
    const response = await axios.get(
      // `${fbBaseUrl(mc)}/${mc.igBusinessId}${endpoint}`,
      `${fbBaseUrl(mc)}${endpoint}`,
      {
        params: {
          ...params,
          access_token: mc.accessToken,
        },
        timeout: 30000,
      },
    );

    return response.data;
  } catch (err) {
    console.error("Instagram API Error:", err.response?.data || err.message);

    return null;
  }
}

async function makeFacebookGetRequest(endpoint, params = {}, mc) {
  try {
    const url = `${fbBaseUrl(mc)}${endpoint}`;

    const response = await axios.get(url, {
      params: {
        ...params,
        access_token: mc.accessToken,
      },
      timeout: 30000,
    });

    return response.data;
  } catch (err) {
    console.error("Facebook API Error:", err.response?.data || err.message);

    return null;
  }
}

// graph.facebook.com POST — uses accessToken
// Confirmed working:
//   DM:    POST /{PAGE_ID}/messages       → accessToken
//   Reply: POST /{comment_id}/replies     → accessToken
async function makeFacebookPostRequest(endpoint, body = {}, mc) {
  const response = await axios.post(`${fbBaseUrl(mc)}${endpoint}`, body, {
    params: { access_token: mc.accessToken },
    timeout: 30000,
  });
  return response.data;
}

// ── Read endpoints ────────────────────────────────────────────────────────────

export async function fetchAccountDetails(mc) {
  return makeGetRequest("/me", { fields: "user_id,username" }, mc);
}

export async function fetchMediaInsights(mediaId, mc) {
  try {
    const response = await axios.get(
      `https://graph.facebook.com/${
        mc.graphApiVersion || GRAPH_API_VERSION
      }/${mediaId}/insights`,
      {
        params: {
          metric: "reach,saved,shares,views",
          access_token: mc.accessToken,
        },
      },
    );

    const insights = {};

    response.data.data.forEach((item) => {
      insights[item.name] = item.values?.[0]?.value || 0;
    });

    return insights;
  } catch (err) {
    console.error("Insights Error:", err.response?.data || err.message);

    return {};
  }
}

export async function fetchMediaDetails(mc) {
  const data = await makeGetRequest(
    `/${mc.igBusinessId}/media`,
    {
      fields:
        "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count",
      limit: 100,
    },
    mc,
  );

  if (!data?.data) return [];

  const media = await Promise.all(
    data.data.map(async (post) => {
      const insights = await fetchMediaInsights(post.id, mc);

      return {
        ...post,
        reach: insights.reach || 0,
        saved: insights.saved || 0,
        shares: insights.shares || 0,
        views: insights.views || 0,
      };
    }),
  );

  return media;
}

export async function fetchMediaById(mediaId, mc) {
  const data = await makeGetRequest(
    `/${mediaId}`,
    {
      fields:
        "id,caption,media_type,permalink,timestamp,like_count,comments_count",
    },
    mc,
  );
  if (!data) return null;
  const insights = await fetchMediaInsights(mediaId, mc);
  return {
    ...data,
    reach: insights.reach || "",
    saved: insights.saved || "",
    shares: insights.shares || "",
    views: insights.views || "",
  };
}

export async function fetchMediaComments(mediaId, mc) {
  const data = await makeFacebookGetRequest(
    `/${mediaId}/comments`,
    { fields: "id,text,username,timestamp" },
    mc,
  );
  return data?.data || [];
}

export async function fetchAllComments(mediaList, mc) {
  const comments = [];
  for (const media of mediaList) {
    const mediaComments = await fetchMediaComments(media.id, mc);
    mediaComments.forEach((comment) => {
      comments.push({
        post_id: media.id,
        post_link: media.permalink,
        comment_id: comment.id,
        comment_username: comment.username,
        comment_text: comment.text,
        commented_at: comment.timestamp,
      });
    });
  }
  return comments;
}

export async function fetchInstagramConversations(mc) {
  const response = await makeFacebookGetRequest(
    `/${mc.pageId}/conversations`,
    {
      platform: "instagram",
      fields: "id",
      limit: 25,
    },
    mc,
  );

  return response?.data || [];
}

export async function fetchConversationMessages(conversationId, mc) {
  const data = await makeFacebookGetRequest(
    `/${conversationId}/messages`,
    {
      fields: "id,message,from,created_time",
      limit: 100,
    },
    mc,
  );

  return data?.data || [];
}

export async function fetchAllInstagramMessages(mc) {
  const conversations = await fetchInstagramConversations(mc);

  if (!Array.isArray(conversations)) {
    return [];
  }

  const allMessages = [];

  for (const conversation of conversations) {
    const messages = await fetchConversationMessages(conversation.id, mc);

    for (const message of messages) {
      allMessages.push({
        conversation_id: conversation.id,
        message_id: message.id,
        from_username: message.from?.username || "",
        from_id: message.from?.id || "",
        message: message.message || "",
        created_time: message.created_time,
      });
    }
  }

  return allMessages;
}

// ── Write endpoints ───────────────────────────────────────────────────────────

const MOCK_MODE = process.env.IG_MOCK_MODE === "true";

/**
 * Send PUBLIC comment reply.
 * POST /v25.0/{comment_id}/replies
 * Body: { message }
 * Token: accessToken
 *
 * Used to acknowledge the comment publicly:
 * "Thanks! We've sent you the product link in your DM 📩"
 */
export async function replyToComment(commentId, message, mc) {
  if (MOCK_MODE) {
    console.log(`[MOCK] replyToComment(${commentId}): ${text}`);
    return { id: "mock_reply_id" };
  }

  return withRetry(
    () => makeFacebookPostRequest(`/${commentId}/replies`, { message }, mc),
    { retries: 3, baseDelayMs: 800 },
  );
}

/**
 * Send PRIVATE DM with product link.
 * POST /v25.0/{PAGE_ID}/messages
 * Body: { recipient: { comment_id }, message: { text } }
 * Token: accessToken
 *
 * IMPORTANT: path uses mc.pageId (PAGE_ID = 1114357148435095),
 * NOT mc.igBusinessId. Using igBusinessId here returns:
 * "(#100) You cannot send messages to this id"
 *
 * recipient.comment_id (not user id) is the Private Reply API —
 * it opens the DM window from a comment without needing
 * an existing conversation thread.
 */
export async function sendInstagramDM(commentId, text, mc) {
  if (MOCK_MODE) {
    console.log(`[MOCK] sendInstagramDM(${commentId}): ${text}`);
    return { message_id: "mock_dm_id" };
  }
  return withRetry(
    () =>
      makeFacebookPostRequest(
        `/${mc.pageId}/messages`,
        {
          recipient: { comment_id: commentId },
          message: { text },
        },
        mc,
      ),
    { retries: 3, baseDelayMs: 800 },
  );
}
