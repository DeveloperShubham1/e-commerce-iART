import { useState } from "react";
import UserTab from "./UserTab";
// import InstagramTab from "./InstagramTab";
import PaymentTab from "./PaymentTab";
import Profile from "./Profile";

export default function ExistProfile() {
  const [activeTab, setActiveTab] = useState("user");

  const tabs = [
    {
      id: "user",
      label: "User",
    },
    {
      id: "instagram",
      label: "Instagram",
    },
    {
      id: "payment",
      label: "Payment",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl rounded-2xl bg-white shadow-sm p-6">
      {/* Heading */}
      <div className="mb-6">
        <p className="text-xs uppercase tracking-wide text-gray-400">
          Merchant Settings
        </p>

        <h1 className="mt-1 text-2xl font-semibold text-gray-900">
          Profile
        </h1>
      </div>

      {/* Tabs */}
      <div className="mb-8 border-b border-gray-200">
        <nav className="flex gap-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-sm font-medium transition-all border-b-2 ${
                activeTab === tab.id
                  ? "border-pink-600 text-pink-600"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}

      {activeTab === "user" && <UserTab />}

      {activeTab === "instagram" && <Profile/>}

      {activeTab === "payment" && <PaymentTab />}
    </div>
  );
}