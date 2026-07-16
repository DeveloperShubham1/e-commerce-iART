import Merchant from "../models/Merchants.js";

/**
 * Loads a merchant's Instagram config, validating that both the
 * merchant-specific fields and the platform-level env config are present.
 */
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

  if (!process.env.META_APP_ID || !process.env.META_APP_SECRET) {
    throw new Error(
      "META_APP_ID or META_APP_SECRET missing from server config",
    );
  }

  return buildConfig(ig, merchant.MerchantName);
}

export function buildConfigFromMerchant(merchant) {
  const ig = merchant?.instagram;

  if (!ig) {
    throw new Error(
      `Merchant ${merchant?.MerchantName} has no instagram complete config`,
    );
  }

  return buildConfig(ig, merchant?.MerchantName);
}

/**
 * appId / appSecret / graphApiVersion / verifyToken are platform-level
 * (single shared Facebook App) and always come from env, never from the
 * merchant document.
 */
function buildConfig(ig, merchantName = "Unknown Merchant") {
  const requiredFields = [
    { key: "accessToken", label: "accessToken" },
    { key: "pageAccessToken", label: "pageAccessToken" },
    { key: "igBusinessId", label: "igBusinessId" },
    { key: "pageId", label: "pageId" },
  ];

  const missingFields = requiredFields.filter(
    ({ key }) => ig[key] === undefined || ig[key] === null || ig[key] === "",
  );

  if (missingFields.length > 0) {
    const missingFieldNames = missingFields.map(({ label }) => label).join(", ");
    throw new Error(
      `Merchant ${merchantName} is missing required Instagram fields: ${missingFieldNames}. Ensure these values are saved before continuing.`,
    );
  }

  return {
    accessToken: ig.accessToken,
    pageAccessToken: ig.pageAccessToken,
    igBusinessId: ig.igBusinessId,
    pageId: ig.pageId,
    whatsappPhoneNumberId: process.env.META_WHATSAPP_PHONE_NUMBER_ID, // whatsappPhoneNumberId: ig.whatsappPhoneNumberId, THIS MAY BE PER MERCHNAT
    appId: process.env.META_APP_ID,
    appSecret: process.env.META_APP_SECRET,
    verifyToken: process.env.META_VERIFY_TOKEN,
    siteBaseUrl: ig.siteBaseUrl || "https://example.com",
    graphApiVersion: process.env.META_GRAPH_VERSION || "v25.0",
  };
}

/**
 * Persists merchant-specific Instagram fields only.
 * appId / appSecret / verifyToken / graphApiVersion are intentionally
 * excluded — those are platform-level and live in .env, not per merchant.
 */
export async function saveMerchantInstagramConfig(merchantId, fields) {
  const allowed = [
    "accessToken",
    "pageAccessToken",
    "igBusinessId",
    "whatsappPhoneNumberId",
    "pageId",
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
