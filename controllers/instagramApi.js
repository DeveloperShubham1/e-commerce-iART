const axios = require("axios");

const {
  ACCESS_TOKEN,
  PAGE_ACCESS_TOKEN,
  BASE_URL,
  FACEBOOK_BASE_URL,
} = require("./config");

const PAGE_ID = "1114357148435095";

async function makeGetRequest(endpoint, params = {}, debugLabel = null) {
  try {
    const response = await axios.get(`${BASE_URL}${endpoint}`, {
      params: {
        ...params,
        access_token: ACCESS_TOKEN,
      },
      timeout: 30000,
    });

    if (debugLabel) {
      console.log("\n-----", debugLabel, "-----");
      console.log(response.data);
      console.log("--------------------------");
    }

    return response.data;
  } catch (err) {
    console.log("Instagram API Error");

    if (err.response) {
      console.log(err.response.data);
    } else {
      console.log(err.message);
    }

    return null;
  }
}

async function makeFacebookGetRequest(
  endpoint,
  params = {},
  debugLabel = null,
) {
  try {
    const response = await axios.get(`${FACEBOOK_BASE_URL}${endpoint}`, {
      params: {
        ...params,
        access_token: PAGE_ACCESS_TOKEN,
      },
      timeout: 30000,
    });

    if (debugLabel) {
      console.log("\n-----", debugLabel, "-----");
      console.log(response.data);
      console.log("--------------------------");
    }

    return response.data;
  } catch (err) {
    console.log("Facebook API Error");

    if (err.response) {
      console.log(err.response.data);
    } else {
      console.log(err.message);
    }

    return null;
  }
}

async function fetchAccountDetails() {
  return await makeGetRequest("/me", {
    fields: "user_id,username",
  });
}

async function fetchMediaInsights(mediaId) {
  const data = await makeGetRequest(`/${mediaId}/insights`, {
    metric: "reach,saved,shares,views",
  });

  if (!data) return {};

  const insights = {};

  data.data.forEach((item) => {
    insights[item.name] = item.values?.[0]?.value || "";
  });

  return insights;
}

async function fetchMediaDetails() {
  const data = await makeGetRequest("/me/media", {
    fields:
      "id,caption,media_type,permalink,timestamp,like_count,comments_count",
  });

  if (!data) return [];

  const media = data.data;

  for (const post of media) {
    const insights = await fetchMediaInsights(post.id);

    post.reach = insights.reach || "";
    post.saved = insights.saved || "";
    post.shares = insights.shares || "";
    post.views = insights.views || "";
  }

  return media;
}

async function fetchMediaComments(mediaId) {
  const data = await makeFacebookGetRequest(
    `/${mediaId}/comments`,
    {
      fields: "id,text,username,timestamp",
    },
    "Comments Debug",
  );

  return data?.data || [];
}

async function fetchAllComments(mediaList) {
  const comments = [];

  for (const media of mediaList) {
    const mediaComments = await fetchMediaComments(media.id);

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

async function fetchInstagramConversations() {
  const data = await makeFacebookGetRequest(
    `/${PAGE_ID}/conversations`,
    {
      platform: "instagram",
      fields: "id,updated_time,messages{id,created_time,from,to,message}",
    },
    "Conversation Debug",
  );

  return data?.data || [];
}

async function fetchConversationMessages(conversationId) {
  const data = await makeFacebookGetRequest(`/${conversationId}/messages`, {
    fields: "id,message,from,created_time",
  });

  return data?.data || [];
}

async function fetchAllInstagramMessages() {
  const conversations = await fetchInstagramConversations();

  const allMessages = [];

  for (const conversation of conversations) {
    let messages = conversation.messages?.data;

    if (!messages || messages.length === 0) {
      messages = await fetchConversationMessages(conversation.id);
    }

    messages.forEach((message) => {
      allMessages.push({
        conversation_id: conversation.id,
        message_id: message.id,
        from_username: message.from?.username,
        from_id: message.from?.id,
        message: message.message,
        created_time: message.created_time,
      });
    });
  }

  return allMessages;
}

module.exports = {
  fetchAccountDetails,
  fetchMediaDetails,
  fetchMediaInsights,
  fetchMediaComments,
  fetchAllComments,
  fetchInstagramConversations,
  fetchConversationMessages,
  fetchAllInstagramMessages,
};
