import { loadMerchantConfig } from "../configs/merchantConfigService.js";
import InstagramProduct from "../models/InstagramProduct.js";
import { fetchMediaById, fetchMediaComments } from "./instagramApi.js";

export async function findProductByMediaId(mediaId) {
  return InstagramProduct.findOne({
    instagram_media_id: mediaId,
    active: true,
  });
}

export async function upsertMapping({
  instagram_media_id,
  product_id,
  product_url,
  title,
  merchantId,
}) {
  return InstagramProduct.findOneAndUpdate(
    { instagram_media_id },
    { merchantId, product_id, product_url, title, active: true },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
}

export async function deactivateMapping(instagram_media_id, merchantId) {
  return await InstagramProduct.findOneAndUpdate(
    {
      instagram_media_id,
      merchantId,
      active: true,
    },
    {
      $set: {
        active: false,
      },
    },
    {
      new: true,
    },
  );
}

export async function getAllInstagramProducts(
  merchantId,
  { page = 1, limit = 10 } = {},
) {
  const skip = (page - 1) * limit;

  const filter = {
    merchantId,
    active: true,
  };

  const [items, total] = await Promise.all([
    InstagramProduct.find(filter)
      .populate(
        "product_id",
        "name description brand variants isActive createdAt updatedAt",
      )
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    InstagramProduct.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    items,
    pagination: {
      current_page: page,
      per_page: limit,
      total_records: total,
      total_pages: totalPages,
      has_next_page: page < totalPages,
      has_prev_page: page > 1,
    },
  };
}

export async function getInstagramPostWithProduct(mediaId, merchantId) {
  const merchantConfig = await loadMerchantConfig(merchantId);

  const [instagramPost, mapping, comments] = await Promise.all([
    fetchMediaById(mediaId, merchantConfig),

    InstagramProduct.findOne({
      instagram_media_id: mediaId,
      merchantId,

      active: true,
    })
      .populate({
        path: "product_id",
        select: "name brand description variants isActive",
      })
      .lean(),

    fetchMediaComments(mediaId, merchantConfig),
  ]);

  return {
    instagram: instagramPost,
    product: mapping?.product_id || null,
    productUrl: mapping?.product_url || null,
    title: mapping?.title || "",
    active: mapping?.active ?? false,
    comments: comments.map((comment) => ({
      comment_id: comment.id,
      comment_username: comment.username,
      comment_text: comment.text,
      commented_at: comment.timestamp,
    })),
  };
}
