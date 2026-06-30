import React, { useEffect, useState } from "react";
import axios from "axios";
import MerchantSettingsForm from "./MerchantSettingsForm";
import { toast } from "react-toastify";

const MerchantSettingsPage = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get("/api/merchant/settings");

      if (data.success) {
        setSettings(data.data);
      }
    } catch (err) {
      if (err.response?.status !== 404) {
        toast.error("Failed to load settings");
      }
      setSettings(null); // create mode
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  if (loading) return <p>Loading...</p>;

  return <MerchantSettingsForm settings={settings} onSuccess={fetchSettings} />;
};

export default MerchantSettingsPage;
