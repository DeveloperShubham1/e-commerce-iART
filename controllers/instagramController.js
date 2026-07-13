import {
  fetchMediaDetails,
  fetchAllComments,
  fetchAllInstagramMessages,
  fetchMediaById,
} from "../services/instagramApi.js";
import { loadMerchantConfig } from "../configs/merchantConfigService.js";


export const getPosts = async (req, res) => {
  try {
    const merchantId = req.merchant._id;

    const merchantConfig = await loadMerchantConfig(merchantId);

    if (!merchantConfig) {
      return res.status(404).json({
        success: false,
        message: "Instagram configuration not found",
      });
    }

    const posts = await fetchMediaDetails(merchantConfig);

    res.status(200).json({
      success: true,
      count: posts.length,
      data: posts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET /comments
export const getComments = async (req, res) => {
  try {
    const merchantId = req.merchant._id;

    const merchantConfig = await loadMerchantConfig(merchantId);

    if (!merchantConfig) {
      return res.status(404).json({
        success: false,
        message: "Instagram configuration not found",
      });
    }
    const posts = await fetchMediaDetails(merchantConfig);
    const comments = await fetchAllComments(posts, merchantConfig);

    res.status(200).json({
      success: true,
      data: comments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET /messages
export const getMessages = async (req, res) => {
  try {
    const merchantId = req.merchant._id;

    const merchantConfig = await loadMerchantConfig(merchantId);

    if (!merchantConfig) {
      return res.status(404).json({
        success: false,
        message: "Instagram configuration not found",
      });
    }

    const messages = await fetchAllInstagramMessages(merchantConfig);

    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET /post/:id
export const getPostById = async (req, res) => {
  try {
    const { id } = req.params;

    const post = await fetchMediaById(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    res.status(200).json({
      success: true,
      data: post,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
