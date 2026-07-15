import Merchant from "../models/Merchants.js";

export async function loadMerchantConfig(merchantId) {
  const merchant = await Merchant.findById(merchantId).select(
    "instagram MerchantName",
  );

  if (!merchant) {
    throw new Error(`Merchant ${merchantId} not found`);
  }

  const ig = merchant.instagram;

  if (!ig?.isConnected) {
    throw new Error(
      `Merchant ${merchant.MerchantName} has not connected their Instagram account`,
    );
  }

  if (
    !ig.accessToken ||
    !ig.pageAccessToken ||
    !ig.igBusinessId ||
    !ig.pageId ||
    !ig.whatsappPhoneNumberId
  ) {
    throw new Error(
      `Merchant ${merchant.MerchantName} is missing required Instagram fields. ` +
        `Ensure accessToken, pageAccessToken, igBusinessId, whatsappPhoneNumberId and pageId are saved.`,
    );
  }

  return buildConfig(ig);
}

export function buildConfigFromMerchant(merchant) {
  const ig = merchant?.instagram;

  if (!ig) {
    throw new Error(
      `Merchant ${merchant?.MerchantName} has no instagram config`,
    );
  }

  return buildConfig(ig);
}

function buildConfig(ig) {
  return {
    accessToken: ig.accessToken,
    pageAccessToken: ig.pageAccessToken,
    igBusinessId: ig.igBusinessId,
    pageId: ig.pageId,
    whatsappPhoneNumberId: ig.whatsappPhoneNumberId,
    appId: ig.appId,
    appSecret: ig.appSecret,
    siteBaseUrl: ig.siteBaseUrl || "https://example.com",
    graphApiVersion: ig.graphApiVersion || "v25.0",
  };
}

export async function saveMerchantInstagramConfig(merchantId, fields) {
  const allowed = [
    "accessToken",
    "pageAccessToken",
    "igBusinessId",
    "whatsappPhoneNumberId",
    "pageId",
    "appId",
    "appSecret",
    "verifyToken",
    "graphApiVersion",
    "siteBaseUrl",
    "tokenExpiresAt",
    "isConnected",
    "webhookSubscribed",
    "webhookSubscribedAt",
  ];

  const update = {};
  for (const key of allowed) {
    if (fields[key] !== undefined) {
      const value =
        typeof fields[key] === "string" ? fields[key].trim() : fields[key];
      update[`instagram.${key}`] = value;
    }
  }

  if (Object.keys(update).length === 0) {
    throw new Error("No valid fields provided to update");
  }

  return Merchant.findByIdAndUpdate(
    merchantId,
    { $set: update },
    { new: true, runValidators: true },
  ).select("MerchantName instagram");
}
