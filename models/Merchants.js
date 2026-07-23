import mongoose from "mongoose";

const MerchantSchema = new mongoose.Schema({
  MerchantName: { type: String, required: true },
  OwnerName: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  whatsappNumber: { type: String },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },

  // razorpay config
  razorpayKey: { type: String, default: null },
  razorpaySecret: { type: String, default: null },
  isRazorpayenabled: { type: Boolean, default: false },

  // UPI Payment
  upi: {
    enabled: {
      type: Boolean,
      default: false,
    },

    codEnabled: {
      type: Boolean,
      default: false,
    },

    upiId: {
      type: String,
      default: null,
    },

    upiAdvancePayment: {
      type: Number,
      default: null,
    },

    qrCodeImage: {
      type: String,
      default: null,
    },
  },

  isSubscribed: { type: Boolean, default: false },
  features: {
    stockManagement: { type: Boolean, default: false },
  },
  subscription: {
    planName: { type: String },
    startDate: { type: Date },
    endDate: { type: Date },
  },

  instagram: {
    // ── Tokens ───────────────────────────────────────────────────
    accessToken: { type: String, default: null }, // Facebook User token (~60 days)
    pageAccessToken: { type: String, default: null }, // Facebook Page token
    whatsappPhoneNumberId: { type: String, default: null }, // WhatsApp Business Account phone number ID

    // ── App config ───────────────────────────────────────────────
    appId: { type: String, default: null }, // Meta App ID  e.g. 1488658929655138
    appSecret: { type: String, default: null }, // Meta App Secret (X-Hub-Signature-256)
    verifyToken: { type: String, default: null }, // Webhook verify token
    graphApiVersion: { type: String, default: "v25.0" },
    InstagramAppSecret: { type: String, default: null },

    // ── Account IDs — auto-extracted from granular_scopes ────────
    // These are populated automatically when verifyToken is called,
    // parsed from the debug_token granular_scopes response.
    // No manual entry needed.
    igBusinessId: { type: String, default: null }, // from instagram_basic.target_ids[0]
    pageId: { type: String, default: null }, // from pages_show_list.target_ids[0]
    businessManagerId: { type: String, default: null }, // from business_management.target_ids[0]

    // ── Granted scopes — stored for reference / UI display ───────
    // Flat list of scope names e.g. ["instagram_manage_comments", ...]
    grantedScopes: { type: [String], default: [] },

    // Structured: scope name → target_ids array
    // Stored as Mixed so we can keep the exact shape Meta returns.
    // e.g. { instagram_basic: ["17841444067130098"], pages_show_list: ["1114357148435095"] }
    granularScopes: { type: mongoose.Schema.Types.Mixed, default: {} },

    // ── Site ─────────────────────────────────────────────────────
    siteBaseUrl: { type: String, default: null },

    // ── Token validity ───────────────────────────────────────────
    tokenExpiresAt: { type: Date, default: null },
    isConnected: { type: Boolean, default: false },

    // ── Webhook subscription ─────────────────────────────────────
    webhookSubscribed: { type: Boolean, default: false },
    webhookSubscribedAt: { type: Date, default: null },
  },

  logo: { type: String },
  address: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Merchants", MerchantSchema);
