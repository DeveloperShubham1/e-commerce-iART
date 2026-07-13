// services/authTokenService.js
import jwt from "jsonwebtoken";
import crypto from "crypto";
import IgAuthToken from "../models/IgAuthToken.js";

const TTL_SECONDS = 60 * 60;

export async function createIgAuthToken({ merchantId, igsid, username, commentId, productId }) {
  const jti = crypto.randomBytes(16).toString("hex");
  const expiresAt = new Date(Date.now() + TTL_SECONDS * 1000);

  await IgAuthToken.create({
    jti, merchant_id: merchantId, igsid, username,
    comment_id: commentId, product_id: productId, expiresAt,
  });

  return jwt.sign({ jti, purpose: "ig_dm_autologin" }, process.env.JWT_SECRET, {
    expiresIn: TTL_SECONDS,
  });
}

export async function consumeIgAuthToken(token) {
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null; // expired or tampered
  }
  if (decoded.purpose !== "ig_dm_autologin") return null;

  const record = await IgAuthToken.findOne({ jti: decoded.jti });
  if (!record || record.used || record.expiresAt < new Date()) return null;

  record.used = true;
  await record.save();

  return {
    merchantId: record.merchant_id,
    igsid: record.igsid,
    username: record.username,
    commentId: record.comment_id,
    productId: record.product_id,
  };
}