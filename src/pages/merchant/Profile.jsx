import { useEffect, useState } from "react";
import {
  useInstagramConfig,
  useUpdateInstagramConfig,
  useVerifyInstagramToken,
  useConnectInstagramSDK
} from "../../services/merchant";
import { loadFacebookSDK } from "../../utils/facebook";

// --- small inline icons (no new dependency) ---
const IgGlyph = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="2" y="2" width="20" height="20" rx="6" stroke="white" strokeWidth="1.8" />
    <circle cx="12" cy="12" r="4.2" stroke="white" strokeWidth="1.8" />
    <circle cx="17.2" cy="6.8" r="1.1" fill="white" />
  </svg>
);

const ClockIcon = (props) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" strokeLinecap="round" />
  </svg>
);

const TagIcon = (props) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
    <path d="M20 12l-8 8-9-9V4h7l10 10z" strokeLinejoin="round" />
    <circle cx="7.5" cy="7.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);

const HashIcon = (props) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
    <path d="M5 9h14M5 15h14M10 4l-2 16M16 4l-2 16" strokeLinecap="round" />
  </svg>
);

const AlertIcon = (props) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
    <path d="M12 3l10 18H2L12 3z" strokeLinejoin="round" />
    <path d="M12 10v4M12 17h.01" strokeLinecap="round" />
  </svg>
);

export default function Profile() {
  const { data, isLoading } = useInstagramConfig();
  const updateMutation = useUpdateInstagramConfig();
  const verifyMutation = useVerifyInstagramToken();
  const connectMutation = useConnectInstagramSDK();
  const instagram = data?.instagram;

  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState(null);

  const [form, setForm] = useState({
    // accessToken: "",
    // pageAccessToken: "",
    // igBusinessId: "",
    // pageId: "",
    // appId: "",
    // appSecret: "",
    // verifyToken: "",
    // graphApiVersion: "v25.0",
    siteBaseUrl: "",
    // InstagramAppSecret: "",
    // whatsappPhoneNumberId: "",
  });

  useEffect(() => {
    if (data?.instagram) {
      setForm({
        // accessToken: data.instagram.accessToken || "",
        // pageAccessToken: data.instagram.pageAccessToken || "",
        // igBusinessId: data.instagram.igBusinessId || "",
        // pageId: data.instagram.pageId || "",
        // appId: data.instagram.appId || "",
        // appSecret: data.instagram.appSecret || "",
        // verifyToken: data.instagram.verifyToken || "",
        // graphApiVersion: data.instagram.graphApiVersion || "v25.0",
        siteBaseUrl: data.instagram.siteBaseUrl || "",
        // InstagramAppSecret: data.instagram.InstagramAppSecret || "",
        // whatsappPhoneNumberId: data.instagram.whatsappPhoneNumberId || "",
      });
    }
  }, [data]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(form);
  };

  const handleVerifyToken = () => verifyMutation.mutate();

  const handleInstagramData = async () => {
    setConnecting(true);
    setConnectError(null);

    try {
      const FB = await loadFacebookSDK(instagram.appId);

      FB.login(
        (response) => {
          if (response.status !== "connected") {
            setConnectError("Facebook login was cancelled or not authorized.");
            setConnecting(false);
            return;
          }

          const { accessToken, userID } = response.authResponse;

          connectMutation.mutate(
            { accessToken, userID },
            {
              onSuccess: () => setConnecting(false),
              onError: (err) => {
                setConnectError(err?.message || "Failed to connect Instagram");
                setConnecting(false);
              },
            }
          );
        },
        {
          scope:
            "instagram_basic,instagram_manage_messages,pages_show_list,pages_read_engagement,business_management",
        }
      );
    } catch (err) {
      setConnectError(err.message);
      setConnecting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-7xl rounded-2xl bg-white shadow-sm p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-48 rounded bg-gray-200" />
          <div className="h-32 rounded-2xl bg-gray-100" />
        </div>
      </div>
    );
  }

  const isConnected = !!instagram?.isConnected;

  return (
    <div className="mx-auto w-full max-w-7xl rounded-2xl bg-white shadow-sm p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
          Integrations
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-gray-900">
          Instagram
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Connect your Instagram Business account to manage messages and comments from here.
        </p>
      </div>

      {/* Status hero */}
      <div className="mb-8 overflow-hidden rounded-2xl border border-gray-200">
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-center gap-4">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
              style={{
                background: "linear-gradient(135deg, #F58529 0%, #DD2A7B 50%, #8134AF 100%)",
              }}
            >
              <IgGlyph />
            </div>
            <div>
              <p className="text-base font-semibold text-gray-900">
                Instagram Business
              </p>
              <div className="mt-1 flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  {isConnected && (
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                  )}
                  <span
                    className={`relative inline-flex h-2 w-2 rounded-full ${isConnected ? "bg-green-500" : "bg-gray-300"
                      }`}
                  />
                </span>
                <span
                  className={`text-sm font-medium ${isConnected ? "text-green-700" : "text-gray-500"
                    }`}
                >
                  {isConnected ? "Connected" : "Not connected"}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleInstagramData}
            disabled={connecting}
            className="w-full shrink-0 rounded-xl px-5 py-3 text-sm font-medium text-white transition disabled:opacity-60 sm:w-auto"
            style={{
              background: "linear-gradient(135deg, #F58529 0%, #DD2A7B 50%, #8134AF 100%)",
            }}
          >
            {connecting ? "Connecting…" : isConnected ? "Reconnect account" : "Connect account"}
          </button>
        </div>

        {/* Meta strip */}
        <div className="grid grid-cols-1 divide-y divide-gray-100 border-t border-gray-200 bg-gray-50 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <div className="flex items-center gap-2.5 px-5 py-4">
            <ClockIcon className="text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Token expiry</p>
              <p className="text-sm font-medium text-gray-900">
                {instagram?.tokenExpiresAt
                  ? new Date(instagram.tokenExpiresAt).toLocaleString("en-IN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })
                  : "Never / long-lived"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 px-5 py-4">
            <TagIcon className="text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">API version</p>
              <p className="text-sm font-medium text-gray-900">
                {instagram?.graphApiVersion || "—"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 px-5 py-4">
            <HashIcon className="text-gray-400" />
            <div className="min-w-0">
              <p className="text-xs text-gray-500">Instagram ID</p>
              <p className="truncate text-sm font-medium text-gray-900">
                {instagram?.igBusinessId || "—"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {connectError && (
        <div className="mb-8 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <AlertIcon className="mt-0.5 shrink-0 text-red-500" />
          <p className="text-sm text-red-700">{connectError}</p>
        </div>
      )}

      {/* Configuration form */}
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Configuration</h2>
        {instagram?.isConnected && (
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500">
            Advanced
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <label className="mb-2 block text-sm font-medium text-gray-700">
           Site Base URL
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              name="siteBaseUrl"
              value={form.siteBaseUrl}
              onChange={handleChange}
              placeholder="Website URL"
              className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
            />
            <button
              disabled={updateMutation.isPending}
              className="w-full rounded-xl bg-indigo-600 px-8 py-3 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60 sm:w-auto"
            >
              {updateMutation.isPending ? "Saving…" : "Save configuration"}
            </button>
          </div>
        </div>

      </form>
    </div>
  );
}
