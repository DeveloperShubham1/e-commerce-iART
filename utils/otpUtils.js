export const OTP_EXPIRY_MINUTES = 5;
export const RESEND_COOLDOWN_SECONDS = 30;
export const MAX_OTP_ATTEMPTS = 5;

/**
 * Generates the OTP.
 * NOTE: Hardcoded to "1234" for now, as requested.
 * Swap this out later for a real random generator, e.g.:
 *   return Math.floor(1000 + Math.random() * 9000).toString();
 */
export const generateOtp = () => {
  return "1234";
};

/**
 * Sends the OTP to the user's phone.
 * NOTE: Currently a no-op (just logs). Plug in Twilio / MSG91 /
 * Fast2SMS / etc. here later — the rest of the controller code
 * won't need to change.
 */
export const sendOtpToPhone = async (phone, otp) => {
  console.log(`[DEV-ONLY] OTP for ${phone}: ${otp}`);
  return true;
};

/**
 * Basic Indian 10-digit mobile number check.
 * Adjust/remove if you need to support other countries.
 */
export const isValidPhone = (phone) => {
  return /^[6-9]\d{9}$/.test(phone);
};