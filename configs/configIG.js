import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.join(__dirname, "../.env"),
});

export const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
export const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
export const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

export const SECRET_KEY =
  process.env.SECRET_KEY || "dev-secret-key-change-me";

// Meta App Secret - used to verify X-Hub-Signature-256 on incoming webhooks.
// This is a different value from SECRET_KEY (your own app's secret),
// so it gets its own var rather than being folded into SECRET_KEY.
export const APP_SECRET = process.env.APP_SECRET;

export const GRAPH_API_VERSION =
  process.env.GRAPH_API_VERSION || "v25.0";

export const BASE_URL = `https://graph.instagram.com/${GRAPH_API_VERSION}`;
export const FACEBOOK_BASE_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

export const PAGE_ID = process.env.PAGE_ID;
export const IG_BUSINESS_ID = process.env.IG_BUSINESS_ID;

export const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/ig_product_bot";
export const PORT = process.env.PORT || 4000;

export const SITE_BASE_URL =
  process.env.SITE_BASE_URL || "https://example.com";

export function validateConfig() {
  if (!ACCESS_TOKEN) {
    console.log("Missing ACCESS_TOKEN in .env");
    return false;
  }

  if (!PAGE_ACCESS_TOKEN) {
    console.log("Missing PAGE_ACCESS_TOKEN in .env");
    return false;
  }

  return true;
}

export function validateWebhookConfig() {
  const missing = [];

  if (!VERIFY_TOKEN) missing.push("VERIFY_TOKEN");
  if (!PAGE_ACCESS_TOKEN) missing.push("PAGE_ACCESS_TOKEN");
  if (!ACCESS_TOKEN) missing.push("ACCESS_TOKEN");
  if (!APP_SECRET) missing.push("APP_SECRET");

  if (missing.length) {
    console.log(`Missing webhook config values: ${missing.join(", ")}`);
    return false;
  }

  return true;
}
