import {
  upsertMapping,
  deactivateMapping,
  getAllInstagramProducts,
  getInstagramPostWithProduct,
} from "../services/productService.js";
import MessageLog from "../models/MessageLog.js";
import InstagramPost from "../models/InstagramProduct.js";
import {
  syncNewCommentsForMedia,
  syncNewCommentsForAllMedia,
} from "../services/commentSyncService.js";

export async function createOrUpdateMapping(req, res) {
  let merchantId = req.merchant._id;

  const { instagram_media_id, product_id, product_url, title } = req.body;

  if (!instagram_media_id || !product_id || !product_url) {
    return res.status(400).json({
      error: "instagram_media_id, product_id, and product_url are required",
    });
  }

  const mapping = await upsertMapping({
    merchantId,
    instagram_media_id,
    product_id,
    product_url,
    title,
  });

  res.status(200).json({
    success: true,
    message: "Mapping created/updated successfully",
  });
}

export async function removeMapping(req, res) {
  try {
    const merchantId = req.merchant._id;
    const { mediaId } = req.params;

    const mapping = await deactivateMapping(mediaId, merchantId);

    if (!mapping) {
      return res.status(404).json({
        success: false,
        message: "Instagram post mapping not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Instagram post product removed successfully.",
      data: mapping,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

export async function getMessageHistory(req, res) {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    MessageLog.find().sort({ created_at: -1 }).skip(skip).limit(limit),
    MessageLog.countDocuments(),
  ]);

  res.json({ items, total, page, limit });
}

export async function getInstagramProducts(req, res) {
  try {
    const merchantId = req.merchant._id;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const result = await getAllInstagramProducts(merchantId, {
      page,
      limit,
    });

    res.status(200).json({
      success: true,
      data: result.items,
      pagination: result.pagination,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}

export async function getInstagramPostProduct(req, res) {
  try {
    const merchantId = req.merchant._id;
    const { mediaId } = req.params;

    const data = await getInstagramPostWithProduct(mediaId, merchantId);

    if (!data.instagram && !data.product) {
      return res.status(404).json({
        success: false,
        message: "Instagram post or product not found",
      });
    }

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}

export async function syncInstagramComments(req, res) {
  try {
    const merchantId = req.merchant._id;
    const { mediaId } = req.params;

    const merchantConfig = await loadMerchantConfig(merchantId);
    const summary = await syncNewCommentsForMedia(
      mediaId,
      merchantId,
      merchantConfig,
    );

    return res.status(200).json({ success: true, ...summary });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error: " + error.message,
    });
  }
}

export async function syncAllInstagramComments(req, res) {
  try {
    const merchantId = req.merchant._id;

    const summary = await syncNewCommentsForAllMedia(merchantId);

    return res.status(200).json({ success: true, ...summary });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error: " + error.message,
    });
  }
}
