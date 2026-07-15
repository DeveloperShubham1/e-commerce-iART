// services/whatsappApi.js
import axios from "axios";

export const normalizePhone = (phone, defaultCountryCode = "91") => {
  if (!phone) return null;
  let digits = String(phone).replace(/[^\d]/g, "");
  if (digits.length === 10) {
    digits = defaultCountryCode + digits;
  }
  return digits;
};

const GRAPH_API_VERSION = process.env.WHATSAPP_GRAPH_VERSION || "v21.0";

function buildUrl(merchantConfig) {
  const { whatsappPhoneNumberId } = merchantConfig;
  return `https://graph.facebook.com/${GRAPH_API_VERSION}/${whatsappPhoneNumberId}/messages`;
}

async function sendWhatsAppRequest(payload, merchantConfig) {
  const { accessToken } = merchantConfig;

  try {
    const response = await axios.post(buildUrl(merchantConfig), payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      timeout: 10000,
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error(
      "WhatsApp send error:",
      error?.response?.data || error.message,
    );
    return {
      success: false,
      error: error?.response?.data || error.message,
    };
  }
}

// ================= CORE SEND FUNCTIONS ================= //

/**
 * @param {object} params
 * @param {string} params.to - Recipient phone number
 * @param {string} params.templateName - Approved WhatsApp template name
 * @param {string} [params.languageCode]
 * @param {Array} [params.bodyParams] - Ordered list of {{1}}, {{2}}... values
 * @param {object} merchantConfig - Result of loadMerchantConfig(merchantId)
 */
export const sendTemplateMessage = async (
  { to, templateName, languageCode = "en_US", bodyParams = [] },
  merchantConfig,
) => {
  const toNumber = normalizePhone(to);
  if (!toNumber) {
    return { success: false, error: "Invalid recipient phone number" };
  }

  const payload = {
    messaging_product: "whatsapp",
    to: toNumber,
    type: "template",
    template: {
      name: templateName,
      language: { code: languageCode },
      components:
        bodyParams.length > 0
          ? [
              {
                type: "body",
                parameters: bodyParams.map((text) => ({
                  type: "text",
                  text: String(text),
                })),
              },
            ]
          : [],
    },
  };

  return sendWhatsAppRequest(payload, merchantConfig);
};

/**
 * @param {object} params
 * @param {string} params.to
 * @param {string} params.message
 * @param {object} merchantConfig
 */
export const sendTextMessage = async ({ to, message }, merchantConfig) => {
  const toNumber = normalizePhone(to);
  if (!toNumber) {
    return { success: false, error: "Invalid recipient phone number" };
  }

  const payload = {
    messaging_product: "whatsapp",
    to: toNumber,
    type: "text",
    text: { body: message, preview_url: true },
  };

  return sendWhatsAppRequest(payload, merchantConfig);
};

// ================= ORDER-SPECIFIC HELPERS ================= //

const safelySend = (fn, context) => {
  fn().catch((err) => {
    console.error(`WhatsApp notify failed [${context}]:`, err);
  });
};

/**
 * @param {object} params
 * @param {object} merchantConfig - Result of loadMerchantConfig(merchantId)
 */
export const notifyOrderPlaced = (
  {
    phone,
    customerName = "Customer",
    orderId,
    totalAmount,
    paymentStatus,
    paymentType,
    orderStatus,
    templateName = "order_placed_detailed",
  },
  merchantConfig,
) => {
  console.log(
    `WhatsApp notify: order placed for ${phone}, orderId=${orderId}, totalAmount=${totalAmount}, paymentStatus=${paymentStatus}, paymentType=${paymentType}, orderStatus=${orderStatus}`,
  );
  safelySend(
    () =>
      sendTemplateMessage(
        {
          to: phone,
          templateName,
          bodyParams: [
            orderId,
            totalAmount,
            paymentType?.toUpperCase() || "N/A",
            paymentStatus,
            orderStatus,
          ],
        },
        merchantConfig,
      ),
    "order_placed",
  );
};

/**
 * @param {object} params
 * @param {object} merchantConfig
 */
export const notifyOrderStatusUpdate = (
  {
    phone,
    orderId,
    orderStatus,
    paymentStatus,
    paymentType,
    isPaid,
    templateName = "order_status_update",
  },
  merchantConfig,
) => {
  safelySend(
    () =>
      sendTemplateMessage(
        {
          to: phone,
          templateName,
          bodyParams: [
            orderId,
            orderStatus,
            paymentStatus,
            paymentType?.toUpperCase() || "N/A",
            isPaid ? "Yes" : "No",
          ],
        },
        merchantConfig,
      ),
    "order_status_update",
  );
};
