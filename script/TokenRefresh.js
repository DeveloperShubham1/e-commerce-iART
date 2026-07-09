import cron from "node-cron";
import axios from "axios";
import Merchant from "../models/Merchants.js";

// Run every day at 12:00 AM
cron.schedule("0 0 * * *", async () => {
  console.log("Running Instagram token refresh job...");

  try {
    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const merchants = await Merchant.find({
      "instagram.isConnected": true,
      "instagram.accessToken": { $exists: true, $ne: "" },
      "instagram.tokenExpiresAt": { $lte: sevenDaysFromNow },
    });

    console.log(
      `Found ${merchants.length} merchant(s) whose token expires within 7 days`,
    );

    for (const merchant of merchants) {
      try {
        const { accessToken, appId, appSecret } = merchant.instagram;

        if (!accessToken || !appId || !appSecret) {
          console.log(
            `Skipping ${merchant.MerchantName}: Missing access token or app credentials`,
          );
          continue;
        }

        const refreshRes = await axios.get(
          "https://graph.facebook.com/v25.0/oauth/access_token",
          {
            params: {
              grant_type: "fb_exchange_token",
              client_id: appId,
              client_secret: appSecret,
              fb_exchange_token: accessToken,
            },
            timeout: 15000,
          },
        );

        console.log(
          `Meta refresh response for ${merchant.MerchantName}:`,
          refreshRes.data,
        );

        const { access_token, expires_in, token_type } = refreshRes.data;

        if (!access_token) {
          console.log(
            `No new access token returned for ${merchant.MerchantName}`,
          );
          continue;
        }

        // Meta sometimes doesn't return expires_in
        const expirySeconds = expires_in || 60 * 24 * 60 * 60;

        const tokenExpiresAt = new Date(Date.now() + expirySeconds * 1000);

        await Merchant.findByIdAndUpdate(merchant._id, {
          $set: {
            "instagram.accessToken": access_token,
            "instagram.tokenExpiresAt": tokenExpiresAt,
            "instagram.isConnected": true,
          },
        });

        console.log(`✅ Token refreshed for ${merchant.MerchantName}`);

        console.log(`Next Expiry: ${tokenExpiresAt.toISOString()}`);
      } catch (err) {
        console.error(
          `❌ Failed to refresh token for ${merchant.MerchantName}`,
        );

        console.error(err.response?.data || err.message);
      }
    }
  } catch (err) {
    console.error("Instagram refresh cron failed:", err.message);
  }
});
