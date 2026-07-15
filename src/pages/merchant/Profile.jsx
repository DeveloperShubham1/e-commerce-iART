import { useEffect, useState } from "react";
import {
  useInstagramConfig,
  useUpdateInstagramConfig,
  useVerifyInstagramToken,
  useConnectInstagramSDK
} from "../../services/merchant";
import { loadFacebookSDK } from "../../utils/facebook";

export default function Profile() {
  const { data, isLoading } = useInstagramConfig();
  const updateMutation = useUpdateInstagramConfig();
  const verifyMutation = useVerifyInstagramToken();
  const connectMutation = useConnectInstagramSDK();
  const instagram = data?.instagram;

  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState(null);

  const [form, setForm] = useState({
    accessToken: "",
    pageAccessToken: "",
    igBusinessId: "",
    pageId: "",
    appId: "",
    appSecret: "",
    verifyToken: "",
    graphApiVersion: "v25.0",
    siteBaseUrl: "",
    InstagramAppSecret: "",
    whatsappPhoneNumberId: "",
  });  

  useEffect(() => {
    if (data?.instagram) {
      setForm({
        accessToken: data.instagram.accessToken || "",
        pageAccessToken: data.instagram.pageAccessToken || "",
        igBusinessId: data.instagram.igBusinessId || "",
        pageId: data.instagram.pageId || "",
        appId: data.instagram.appId || "",
        appSecret: data.instagram.appSecret || "",
        verifyToken: data.instagram.verifyToken || "",
        graphApiVersion:
          data.instagram.graphApiVersion || "v25.0",
        siteBaseUrl: data.instagram.siteBaseUrl || "",
        InstagramAppSecret: data.instagram.InstagramAppSecret || "",
        whatsappPhoneNumberId: data.instagram.whatsappPhoneNumberId || "",
      });
    }
  }, [data]);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(form);
  };

  const handleVerifyToken = () => {
    verifyMutation.mutate();
  };


  const handleInstagramData = async () => {
    setConnecting(true);
    setConnectError(null);

    try {
      const FB = await loadFacebookSDK(instagram.appId);

      FB.login(
        (response) => {
          console.log("Meta login response:", response);

          if (response.status !== "connected") {
            // user cancelled or didn't fully authorize
            setConnectError("Facebook login was cancelled or not authorized.");
            setConnecting(false);
            return;
          }

          const { accessToken, userID } = response.authResponse;
          console.log("User Access Token:", accessToken);
          console.log("User ID:", userID);

          // send to backend to exchange + store long-lived token
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

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="mx-auto w-full max-w-7xl rounded-2xl bg-white shadow-sm p-4 sm:p-6 lg:p-8">

      <div className="mb-6 rounded-2xl border bg-white p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold">
              Instagram Connection
            </h2>

            <p className="mt-1 text-xs sm:text-sm text-gray-500">
              Current connection status of your Instagram account.
            </p>
          </div>

          <span
            className={`inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium w-fit ${instagram?.isConnected
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
              }`}
          >
            {instagram?.isConnected ? "Connected" : "Disconnected"}
          </span>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">

          <div>
            <p className="text-xs uppercase text-gray-500">
              Token Expiry
            </p>

            <p className="font-medium">
              {instagram?.tokenExpiresAt
                ? new Date(
                  instagram.tokenExpiresAt
                ).toLocaleString("en-IN", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })
                : "Never / Long-lived"}
            </p>
          </div>

          <div>
            <p className="text-xs uppercase text-gray-500">
              API Version
            </p>

            <p className="font-medium">
              {instagram?.graphApiVersion}
            </p>
          </div>

          <div>
            <p className="text-xs uppercase text-gray-500">
              Instagram ID
            </p>

            <p className="font-medium break-all">
              {instagram?.igBusinessId}
            </p>
          </div>

        </div>
      </div>

      <h2 className="mb-6 text-xl sm:text-2xl font-semibold">
        Instagram Configuration
      </h2>

      <button
        type="button"
        onClick={handleInstagramData}
        disabled={connecting}
        className="rounded-xl bg-pink-600 text-white px-5 py-3 hover:bg-pink-700 disabled:opacity-60"
      >
        {connecting ? "Connecting..." : "Connect with Instagram"}
      </button>
      {connectError && (
        <p className="mt-2 text-sm text-red-600">{connectError}</p>
      )}

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-5 lg:grid-cols-2"
      >
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-2">
            Access Token
          </label>

          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              name="accessToken"
              value={form.accessToken}
              onChange={handleChange}
              className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />

            <button
              type="button"
              onClick={handleVerifyToken}
              disabled={verifyMutation.isPending}
              className="w-full sm:w-auto rounded-xl bg-green-600 px-5 py-3 text-white hover:bg-green-700 disabled:opacity-60"
            >
              {verifyMutation.isPending
                ? "Verifying..."
                : "Verify Token"}
            </button>
          </div>
        </div>

        <Input
          label="Page Access Token"
          name="pageAccessToken"
          value={form.pageAccessToken}
          onChange={handleChange}
        />

        <Input
          label="Instagram Business ID"
          name="igBusinessId"
          value={form.igBusinessId}
          onChange={handleChange}
        />

        <Input
          label="Instagram App Secret"
          name="InstagramAppSecret"
          value={form.InstagramAppSecret}
          onChange={handleChange}
        />

        <Input
          label="WhatsApp Phone Number ID"
          name="whatsappPhoneNumberId"
          value={form.whatsappPhoneNumberId}
          onChange={handleChange}
        />

        <Input
          label="Facebook Page ID"
          name="pageId"
          value={form.pageId}
          onChange={handleChange}
        />

        <Input
          label="App ID"
          name="appId"
          value={form.appId}
          onChange={handleChange}
        />

        <Input
          label="App Secret"
          name="appSecret"
          value={form.appSecret}
          onChange={handleChange}
        />

        <Input
          label="Verify Token"
          name="verifyToken"
          value={form.verifyToken}
          onChange={handleChange}
        />

        <Input
          label="Graph API Version"
          name="graphApiVersion"
          value={form.graphApiVersion}
          onChange={handleChange}
        />

        <Input
          label="Website URL"
          name="siteBaseUrl"
          value={form.siteBaseUrl}
          onChange={handleChange}
        />

        <div className="lg:col-span-2 flex justify-end">
          <button
            disabled={updateMutation.isPending}
            className="w-full sm:w-auto rounded-xl bg-indigo-600 px-8 py-3 text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {updateMutation.isPending
              ? "Saving..."
              : "Save Configuration"}
          </button>
        </div>
      </form>
    </div>
  );
}


const Input = ({
  label,
  name,
  value,
  onChange,
  type = "text",
}) => {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 outline-none"
      />
    </div>
  );
};