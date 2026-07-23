import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useQueryClient } from "@tanstack/react-query";
import { updatePaymentConfig, uploadToS3 } from "../../api";
import { usePaymentConfig } from "../../services/merchant";
import { FiEye, FiEyeOff } from "react-icons/fi";


const Toggle = ({ checked, onChange, label, description, disabled = false }) => (
  <div className="flex items-center justify-between gap-4 py-3">
    <div className="flex-1">
      <p className="text-sm font-semibold text-gray-900">{label}</p>
      {description && (
        <p className="mt-0.5 text-xs text-gray-500">{description}</p>
      )}
    </div>

    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`
        relative inline-flex h-7 w-12 items-center rounded-full
        transition-all duration-300 ease-in-out
        focus:outline-none focus:ring-4 focus:ring-primary/20
        ${checked ? "bg-primary" : "bg-gray-300"}
        ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
      `}
    >
      <span
        className={`
          inline-flex h-5.5 w-5.5 transform items-center justify-center
          rounded-full bg-white shadow-md
          transition-all duration-300 ease-in-out
          ${checked ? "translate-x-6" : "translate-x-1"}
        `}
      >
        {checked && (
          <svg
            className="h-3 w-3 text-primary"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        )}
      </span>
    </button>
  </div>
);


const uploadSingleFile = async (file) => {
  const formData = new FormData();
  formData.append("images", file);
  const data = await uploadToS3(formData);
  if (!data.success) throw new Error(data.message || "Upload failed");
  const uploaded = data.files?.[0];
  if (!uploaded?.url) throw new Error("Upload succeeded but no URL returned");
  return uploaded.url;
};

const DEFAULT_CONFIG = {
  razorpayKey: "",
  razorpaySecret: "",
  isRazorpayenabled: false,
  upiEnabled: false,
  codEnabled: false,
  upiId: "",
  qrCodeImage: "",
  upiAdvancePayment: "",
};

export default function PaymentTab() {
  const queryClient = useQueryClient();
  const { data, isLoading } = usePaymentConfig();

  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [qrFile, setQrFile] = useState(null); // newly picked file, not yet uploaded
  const [qrPreview, setQrPreview] = useState(""); // local object URL for the picked file
  const [saving, setSaving] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  // Sync React Query data to local form state
  useEffect(() => {
    if (data?.success && data?.data) {
      setConfig({
        ...DEFAULT_CONFIG,
        razorpayKey: data.data.razorpayKey || "",
        razorpaySecret: data.data.razorpaySecret || "",
        isRazorpayenabled: data.data.isRazorpayenabled || false,
        upiEnabled: data.data.upi?.enabled || false,
        codEnabled: data.data.upi?.codEnabled || false,
        upiId: data.data.upi?.upiId || "",
        qrCodeImage: data.data.upi?.qrCodeImage || "",
        upiAdvancePayment: data.data.upi?.upiAdvancePayment ?? "",
      });
    }
  }, [data]);

  // Clean up the local object URL when it's replaced/unmounted
  useEffect(() => {
    return () => {
      if (qrPreview) URL.revokeObjectURL(qrPreview);
    };
  }, [qrPreview]);

  const handleChange = (field) => (e) => {
    setConfig((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleToggle = (field) => (value) => {
    setConfig((prev) => {
      if (field === "upiEnabled") {
        return {
          ...prev,
          upiEnabled: value,
          codEnabled: value ? prev.codEnabled : false,
        };
      }

      if (field === "codEnabled") {
        return {
          ...prev,
          codEnabled: value,
          upiAdvancePayment: value ? prev.upiAdvancePayment : "",
        };
      }

      return {
        ...prev,
        [field]: value,
      };
    });
  };

  const handleQrFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file for the QR code");
      return;
    }

    setQrFile(file);
    setQrPreview(URL.createObjectURL(file));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      let qrCodeImage = config.qrCodeImage;

      // Only hits the upload endpoint if the user actually picked a new file
      if (qrFile) {
        qrCodeImage = await uploadSingleFile(qrFile);
      }

      const payload = {
        ...config, qrCodeImage, upiAdvancePayment:
          config.upiAdvancePayment === "" ||
            config.upiAdvancePayment === null ||
            config.upiAdvancePayment === undefined
            ? 0
            : Number(config.upiAdvancePayment),
      };


      const res = await updatePaymentConfig(payload);

      if (!res.success) {
        throw new Error(res.message || "Failed to save payment settings");
      }

      setConfig(payload);
      setQrFile(null);
      queryClient.invalidateQueries({ queryKey: ["payment-config"] });
      toast.success("Payment settings saved");
    } catch (error) {
      console.error("Save payment config error:", error);
      toast.error(error.message || "Failed to save payment settings");
    } finally {
      setSaving(false);
    }
  };

  const displayedQrImage = qrPreview || config.qrCodeImage;

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <p className="text-gray-500 text-sm">Loading payment settings…</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSave}
      className="rounded-2xl border border-gray-200 bg-white p-6"
    >
      <h2 className="text-xl font-semibold text-gray-900">
        Payment Settings
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        Configure how customers pay you — Razorpay and/or direct UPI.
      </p>

      {/* ---------------- Razorpay ---------------- */}
      <div className="mt-6 border-t border-gray-100 pt-5">
        <Toggle
          label="Enable Razorpay"
          description="Accept card, netbanking, and wallet payments via Razorpay"
          checked={config.isRazorpayenabled}
          onChange={handleToggle("isRazorpayenabled")}
        />



        {config.isRazorpayenabled && (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Razorpay Key ID
              </label>
              <input
                type="text"
                value={config.razorpayKey}
                onChange={handleChange("razorpayKey")}
                placeholder="rzp_test_xxxxxxxxxxxx"
                className="w-full px-2 py-2.5 border border-gray-500/30 rounded outline-none text-gray-700 focus:border-primary transition"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Razorpay Key Secret
              </label>

              <div className="relative">
                <input
                  type={showSecret ? "text" : "password"}
                  value={config.razorpaySecret}
                  onChange={handleChange("razorpaySecret")}
                  placeholder="••••••••••••"
                  className="w-full px-2 py-2.5 pr-10 border border-gray-500/30 rounded outline-none text-gray-700 focus:border-primary transition"
                />

                <button
                  type="button"
                  onClick={() => setShowSecret((prev) => !prev)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                >
                  {showSecret ? (
                    <FiEyeOff className="w-5 h-5" />
                  ) : (
                    <FiEye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>



      {/* ---------------- UPI ---------------- */}
      <div className="mt-6 border-t border-gray-100 pt-5">
        <Toggle
          label="Enable UPI"
          description="Accept direct UPI payments via a QR code or UPI ID"
          checked={config.upiEnabled}
          onChange={handleToggle("upiEnabled")}
        />

        <div className="mt-4">
          <Toggle
            label="Enable Cash on Delivery"
            description="Allow customers to pay when the order is delivered"
            checked={config.codEnabled}
            onChange={handleToggle("codEnabled")}
            disabled={!config.upiEnabled}
          />
        </div>

        {config.upiEnabled && config.codEnabled && (
          <div className="mt-4">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              COD Advance Payment Amount (₹)
            </label>

            <input
              type="number"
              min="0"
              step="1"
              value={config.upiAdvancePayment}
              onChange={handleChange("upiAdvancePayment")}
              placeholder="Enter advance amount (e.g. 200)"
              className="w-full max-w-sm px-2 py-2.5 border border-gray-500/30 rounded outline-none text-gray-700 focus:border-primary transition"
            />

            <p className="mt-1 text-xs text-gray-500">
              Customers must pay this amount before placing a Cash on Delivery order.
            </p>
          </div>
        )}

        {config.upiEnabled && (
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                UPI ID
              </label>
              <input
                type="text"
                value={config.upiId}
                onChange={handleChange("upiId")}
                placeholder="merchant@okicici"
                className="w-full max-w-sm px-2 py-2.5 border border-gray-500/30 rounded outline-none text-gray-700 focus:border-primary transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                QR Code Image
              </label>
              <div className="flex items-center gap-4">
                {displayedQrImage ? (
                  <img
                    src={displayedQrImage}
                    alt="UPI QR code"
                    className="h-24 w-24 rounded border border-gray-200 object-contain bg-white"
                  />
                ) : (
                  <div className="h-24 w-24 rounded border border-dashed border-gray-300 flex items-center justify-center text-[10px] text-gray-400 text-center px-1">
                    No QR uploaded
                  </div>
                )}

                <label className="cursor-pointer text-sm font-medium text-primary hover:underline">
                  {displayedQrImage ? "Replace image" : "Upload image"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleQrFileChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={saving}
        className="w-full sm:w-auto mt-8 bg-primary text-white py-3 px-8 hover:bg-primary-dull transition cursor-pointer uppercase disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {saving ? "Saving…" : "Save Settings"}
      </button>
    </form>
  );
}