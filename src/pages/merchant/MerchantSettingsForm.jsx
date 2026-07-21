import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Upload, X, Loader2 } from "lucide-react";

const MerchantSettingsForm = ({ settings: existingSettings, onSuccess }) => {
  const initialFormRef = useRef(null);
  const initialPreviewsRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  /* ---------------- FORM STATE ---------------- */
  const [form, setForm] = useState({
    title: "",
    title2: "",
    title3: "",
    primaryColor: "#000000",
    fontFamily: "Poppins",
    darkModeEnabled: false,
  });

  /* ---------------- IMAGE STATES ---------------- */
  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");

  const [favicon, setFavicon] = useState(null);
  const [faviconPreview, setFaviconPreview] = useState("");

  const [bannerTopWeb, setBannerTopWeb] = useState(null);
  const [bannerTopMob, setBannerTopMob] = useState(null);
  const [bannerBottomWeb, setBannerBottomWeb] = useState(null);
  const [bannerBottomMob, setBannerBottomMob] = useState(null);

  const [bannerTopWebPreview, setBannerTopWebPreview] = useState("");
  const [bannerTopMobPreview, setBannerTopMobPreview] = useState("");
  const [bannerBottomWebPreview, setBannerBottomWebPreview] = useState("");
  const [bannerBottomMobPreview, setBannerBottomMobPreview] = useState("");

  /* ---------------- LOAD EXISTING SETTINGS ---------------- */
  useEffect(() => {
    if (!existingSettings) return;

    const newForm = {
      title: existingSettings.title || "",
      title2: existingSettings.title2 || "",
      title3: existingSettings.title3 || "",
      primaryColor: existingSettings.theme?.primaryColor || "#000000",
      fontFamily: existingSettings.theme?.fontFamily || "Poppins",
      darkModeEnabled: existingSettings.theme?.darkModeEnabled || false,
    };

    setForm(newForm);
    initialFormRef.current = newForm;

    setLogoPreview(existingSettings.branding?.logo?.url || "");
    setFaviconPreview(existingSettings.branding?.favicon?.url || "");

    setBannerTopWebPreview(
      existingSettings.homepage?.bannerTopImageWeb?.url || ""
    );
    setBannerTopMobPreview(
      existingSettings.homepage?.bannerTopImageMob?.url || ""
    );
    setBannerBottomWebPreview(
      existingSettings.homepage?.bannerBottomImageWeb?.url || ""
    );
    setBannerBottomMobPreview(
      existingSettings.homepage?.bannerBottomImageMob?.url || ""
    );

    initialPreviewsRef.current = {
      logo: existingSettings.branding?.logo?.url || "",
      favicon: existingSettings.branding?.favicon?.url || "",
      topWeb: existingSettings.homepage?.bannerTopImageWeb?.url || "",
      topMob: existingSettings.homepage?.bannerTopImageMob?.url || "",
      bottomWeb: existingSettings.homepage?.bannerBottomImageWeb?.url || "",
      bottomMob: existingSettings.homepage?.bannerBottomImageMob?.url || "",
    };
  }, [existingSettings]);

  /* ---------------- DETECT CHANGES ---------------- */
  useEffect(() => {
    if (!initialFormRef.current) {
      setHasChanges(true); // New settings → always allow save
      return;
    }

    const formChanged =
      JSON.stringify(form) !== JSON.stringify(initialFormRef.current);

    const previewsChanged =
      logoPreview !== initialPreviewsRef.current?.logo ||
      faviconPreview !== initialPreviewsRef.current?.favicon ||
      bannerTopWebPreview !== initialPreviewsRef.current?.topWeb ||
      bannerTopMobPreview !== initialPreviewsRef.current?.topMob ||
      bannerBottomWebPreview !== initialPreviewsRef.current?.bottomWeb ||
      bannerBottomMobPreview !== initialPreviewsRef.current?.bottomMob;

    const newFilesSelected =
      logo ||
      favicon ||
      bannerTopWeb ||
      bannerTopMob ||
      bannerBottomWeb ||
      bannerBottomMob;

    setHasChanges(formChanged || previewsChanged || newFilesSelected);
  }, [
    form,
    logoPreview,
    faviconPreview,
    bannerTopWebPreview,
    bannerTopMobPreview,
    bannerBottomWebPreview,
    bannerBottomMobPreview,
    logo,
    favicon,
    bannerTopWeb,
    bannerTopMob,
    bannerBottomWeb,
    bannerBottomMob,
  ]);

  /* ---------------- IMAGE UPLOAD ---------------- */
  const uploadImageToS3 = async (file) => {
    try {
      const formData = new FormData();
      formData.append("images", file);

      const { data } = await axios.post("/api/s3/upload", formData);
      return data?.files?.[0] || null;
    } catch (err) {
      toast.error("Image upload failed");
      return null;
    }
  };

  /* ---------------- HANDLE IMAGE CHANGE ---------------- */
  const handleImageChange = (e, setter, previewSetter) => {
    const file = e.target.files[0];
    if (!file) return;

    setter(file);
    previewSetter(URL.createObjectURL(file));
  };

  const handleBannerChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const preview = URL.createObjectURL(file);

    switch (type) {
      case "topWeb":
        setBannerTopWeb(file);
        setBannerTopWebPreview(preview);
        break;
      case "topMob":
        setBannerTopMob(file);
        setBannerTopMobPreview(preview);
        break;
      case "bottomWeb":
        setBannerBottomWeb(file);
        setBannerBottomWebPreview(preview);
        break;
      case "bottomMob":
        setBannerBottomMob(file);
        setBannerBottomMobPreview(preview);
        break;
      default:
        break;
    }
  };

  /* ---------------- REMOVE IMAGE ---------------- */
  const removeImage = (type) => {
    switch (type) {
      case "logo":
        setLogo(null);
        setLogoPreview("");
        break;
      case "favicon":
        setFavicon(null);
        setFaviconPreview("");
        break;
      case "topWeb":
        setBannerTopWeb(null);
        setBannerTopWebPreview("");
        break;
      case "topMob":
        setBannerTopMob(null);
        setBannerTopMobPreview("");
        break;
      case "bottomWeb":
        setBannerBottomWeb(null);
        setBannerBottomWebPreview("");
        break;
      case "bottomMob":
        setBannerBottomMob(null);
        setBannerBottomMobPreview("");
        break;
      default:
        break;
    }
  };

  /* ---------------- SAVE SETTINGS ---------------- */
  const handleSave = async (e) => {
    e.preventDefault();
    if (!hasChanges) return;

    setLoading(true);

    try {
      let payload = { ...form };

      if (logo) {
        const uploaded = await uploadImageToS3(logo);
        if (!uploaded) return;
        payload["branding.logo.url"] = uploaded.url;
      } else if (logoPreview === "" && initialPreviewsRef.current?.logo) {
        payload["branding.logo.url"] = ""; // explicitly clear
      }

      if (favicon) {
        const uploaded = await uploadImageToS3(favicon);
        if (!uploaded) return;
        payload["branding.favicon.url"] = uploaded.url;
      } else if (faviconPreview === "" && initialPreviewsRef.current?.favicon) {
        payload["branding.favicon.url"] = "";
      }

      if (bannerTopWeb) {
        const uploaded = await uploadImageToS3(bannerTopWeb);
        if (!uploaded) return;
        payload["homepage.bannerTopImageWeb.url"] = uploaded.url;
      } else if (
        bannerTopWebPreview === "" &&
        initialPreviewsRef.current?.topWeb
      ) {
        payload["homepage.bannerTopImageWeb.url"] = "";
      }

      if (bannerTopMob) {
        const uploaded = await uploadImageToS3(bannerTopMob);
        if (!uploaded) return;
        payload["homepage.bannerTopImageMob.url"] = uploaded.url;
      } else if (
        bannerTopMobPreview === "" &&
        initialPreviewsRef.current?.topMob
      ) {
        payload["homepage.bannerTopImageMob.url"] = "";
      }

      if (bannerBottomWeb) {
        const uploaded = await uploadImageToS3(bannerBottomWeb);
        if (!uploaded) return;
        payload["homepage.bannerBottomImageWeb.url"] = uploaded.url;
      } else if (
        bannerBottomWebPreview === "" &&
        initialPreviewsRef.current?.bottomWeb
      ) {
        payload["homepage.bannerBottomImageWeb.url"] = "";
      }

      if (bannerBottomMob) {
        const uploaded = await uploadImageToS3(bannerBottomMob);
        if (!uploaded) return;
        payload["homepage.bannerBottomImageMob.url"] = uploaded.url;
      } else if (
        bannerBottomMobPreview === "" &&
        initialPreviewsRef.current?.bottomMob
      ) {
        payload["homepage.bannerBottomImageMob.url"] = "";
      }

      const { data } = existingSettings
        ? await axios.put("/api/merchant/settings", payload)
        : await axios.post("/api/merchant/settings", payload);

      if (data.success) {
        toast.success(
          existingSettings
            ? "Settings updated successfully"
            : "Settings created successfully"
        );
        onSuccess?.();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- IMAGE UPLOAD COMPONENT ---------------- */
  const ImageUpload = ({
    label,
    preview,
    onChange,
    onRemove,
    accept = "image/*",
  }) => (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="relative">
        {!preview ? (
          <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-gray-400 bg-gray-50">
            <Upload className="w-10 h-10 text-gray-400 mb-3" />
            <span className="text-sm text-gray-600">Click to upload</span>
            <input
              type="file"
              accept={accept}
              onChange={onChange}
              className="hidden"
            />
          </label>
        ) : (
          <div className="relative rounded-xl overflow-hidden border border-gray-200 shadow-sm">
            <img
              src={preview}
              alt={label}
              className="w-full h-48 object-contain bg-gray-50"
            />
            <button
              type="button"
              onClick={onRemove}
              className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSave} className="py-10 space-y-10">
      {/* Titles */}
      <section className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Page Titles</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <input
            type="text"
            placeholder="Main Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
          />
          {/* <input
            type="text"
            placeholder="Secondary Title"
            value={form.title2}
            onChange={(e) => setForm({ ...form, title2: e.target.value })}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
          />
          <input
            type="text"
            placeholder="Tertiary Title"
            value={form.title3}
            onChange={(e) => setForm({ ...form, title3: e.target.value })}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
          /> */}
        </div>
      </section>

      {/* Theme */}
      <section className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Theme Settings
        </h2>
        <div className="grid md:grid-cols-3 gap-8 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Primary Color
            </label>
            <input
              type="color"
              value={form.primaryColor}
              onChange={(e) =>
                setForm({ ...form, primaryColor: e.target.value })
              }
              className="w-full h-12 rounded-lg cursor-pointer border border-gray-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Font Family
            </label>
            <select
              value={form.fontFamily}
              onChange={(e) => setForm({ ...form, fontFamily: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option>Outfit</option>
              <option>Poppins</option>
              <option>Inter</option>
              <option>Roboto</option>
              <option>Montserrat</option>
              <option>Open Sans</option>
            </select>
          </div>
          {/* <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={form.darkModeEnabled}
              onChange={(e) =>
                setForm({ ...form, darkModeEnabled: e.target.checked })
              }
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-lg font-medium">Enable Dark Mode</span>
          </label> */}
        </div>
      </section>

      {/* Branding */}
      <section className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Branding</h2>
        <div className="grid md:grid-cols-2 gap-10">
          <ImageUpload
            label="Logo"
            preview={logoPreview}
            onChange={(e) => handleImageChange(e, setLogo, setLogoPreview)}
            onRemove={() => removeImage("logo")}
          />
          {/* <ImageUpload
            label="Favicon"
            preview={faviconPreview}
            onChange={(e) =>
              handleImageChange(e, setFavicon, setFaviconPreview)
            }
            onRemove={() => removeImage("favicon")}
            accept="image/x-icon,image/png,image/jpeg"
          /> */}
        </div>
      </section>

      {/* Banners */}
      <section className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Homepage Banners
        </h2>
        <div className="grid md:grid-cols-2 gap-10">
          <ImageUpload
            label="Top Banner - Desktop ( recommended: 2366 X 848 )"
            preview={bannerTopWebPreview}
            onChange={(e) => handleBannerChange(e, "topWeb")}
            onRemove={() => removeImage("topWeb")}
          />
          <ImageUpload
            label="Top Banner - Mobile ( recommended: 993 X 1818 )"
            preview={bannerTopMobPreview}
            onChange={(e) => handleBannerChange(e, "topMob")}
            onRemove={() => removeImage("topMob")}
          />
          <ImageUpload
            label="Bottom Banner - Desktop ( recommended: 2366 X 882 )"
            preview={bannerBottomWebPreview}
            onChange={(e) => handleBannerChange(e, "bottomWeb")}
            onRemove={() => removeImage("bottomWeb")}
          />
          <ImageUpload
            label="Bottom Banner - Mobile ( recommended: 1008 X 1974 )"
            preview={bannerBottomMobPreview}
            onChange={(e) => handleBannerChange(e, "bottomMob")}
            onRemove={() => removeImage("bottomMob")}
          />
        </div>
      </section>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading || !hasChanges}
          className={`px-10 py-4 rounded-xl font-semibold text-white flex items-center gap-3 transition-all ${loading || !hasChanges
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl"
            }`}
        >
          {loading && <Loader2 className="w-5 h-5 animate-spin" />}
          {loading
            ? "Saving..."
            : existingSettings
              ? "Update Settings"
              : "Create Settings"}
        </button>
      </div>
    </form>
  );
};

export default MerchantSettingsForm;
