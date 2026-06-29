const path = require("path");
require("dotenv").config({
  path: path.join(__dirname, ".env"),
});

const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";

const SECRET_KEY =
  process.env.SECRET_KEY || "dev-secret-key-change-me";

const GRAPH_API_VERSION =
  process.env.GRAPH_API_VERSION || "v25.0";

const BASE_URL = `https://graph.instagram.com/${GRAPH_API_VERSION}`;
const FACEBOOK_BASE_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

function validateConfig() {
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

function validateWebhookConfig() {
  const missing = [];

  if (!VERIFY_TOKEN) missing.push("VERIFY_TOKEN");
  if (!PAGE_ACCESS_TOKEN) missing.push("PAGE_ACCESS_TOKEN");
  if (!ACCESS_TOKEN) missing.push("ACCESS_TOKEN");

  if (missing.length) {
    console.log(
      `Missing webhook config values: ${missing.join(", ")}`
    );
    return false;
  }

  return true;
}

module.exports = {
  ACCESS_TOKEN,
  PAGE_ACCESS_TOKEN,
  VERIFY_TOKEN,
  ADMIN_USERNAME,
  ADMIN_PASSWORD,
  SECRET_KEY,
  GRAPH_API_VERSION,
  BASE_URL,
  FACEBOOK_BASE_URL,
  validateConfig,
  validateWebhookConfig,
};