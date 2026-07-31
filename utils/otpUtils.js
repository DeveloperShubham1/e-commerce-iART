import axios from "axios";
import bcrypt from "bcryptjs";
import Otp from "../models/Otp.js";

export const OTP_EXPIRY_MINUTES = 5;
export const RESEND_COOLDOWN_SECONDS = 30;
export const MAX_OTP_ATTEMPTS = 5;

const API_KEY = process.env.TWO_FACTOR_API_KEY;
const TEMPLATE_NAME = process.env.TWO_FACTOR_OTP_TEMPLATE; // optional until DLT is done
const BASE_URL = "https://2factor.in/API/V1";

export const generateOtp = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

export const isValidPhone = (phone) => {
  return /^[6-9]\d{9}$/.test(phone);
};

/**
 * Sends the OTP via 2Factor and persists a hashed record so it can be
 * verified later without regenerating it.
 */
export const sendOtpToPhone = async (phone, otp) => {
  if (!API_KEY) {
    const err = new Error("TWO_FACTOR_API_KEY is not configured");
    err.statusCode = 500;
    throw err;
  }

  const recent = await Otp.findOne({ phone, verified: false }).sort({ createdAt: -1 });
  if (recent && Date.now() - recent.createdAt.getTime() < RESEND_COOLDOWN_SECONDS * 1000) {
    const wait = RESEND_COOLDOWN_SECONDS - Math.floor((Date.now() - recent.createdAt.getTime()) / 1000);
    const err = new Error(`Please wait ${wait}s before requesting another OTP`);
    err.statusCode = 429;
    throw err;
  }

  const url = TEMPLATE_NAME
    ? `${BASE_URL}/${API_KEY}/SMS/${phone}/${otp}/${TEMPLATE_NAME}`
    : `${BASE_URL}/${API_KEY}/SMS/${phone}/${otp}`;

  const { data } = await axios.get(url);

  if (data.Status !== "Success") {
    const err = new Error(data.Details || "Failed to send OTP");
    err.statusCode = 502;
    throw err;
  }

  const otpHash = await bcrypt.hash(otp, 10);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await Otp.create({ phone, otpHash, sessionId: data.Details, expiresAt });

  return true;
};

/**
 * Verifies the OTP entered by the user against the stored hash.
 * Replaces the old `otp !== generateOtp()` check everywhere.
 */
export const verifyOtpForPhone = async (phone, otpEntered) => {
  const record = await Otp.findOne({ phone, verified: false }).sort({ createdAt: -1 });

  if (!record) {
    const err = new Error("No pending OTP found for this number. Please request a new one.");
    err.statusCode = 404;
    throw err;
  }

  if (record.expiresAt.getTime() < Date.now()) {
    const err = new Error("OTP has expired. Please request a new one.");
    err.statusCode = 410;
    throw err;
  }

  if (record.attempts >= MAX_OTP_ATTEMPTS) {
    const err = new Error("Too many incorrect attempts. Please request a new OTP.");
    err.statusCode = 429;
    throw err;
  }

  const match = await bcrypt.compare(String(otpEntered), record.otpHash);
  if (!match) {
    record.attempts += 1;
    await record.save();
    const err = new Error("Invalid OTP");
    err.statusCode = 400;
    throw err;
  }

  record.verified = true;
  await record.save();

  return true;
};