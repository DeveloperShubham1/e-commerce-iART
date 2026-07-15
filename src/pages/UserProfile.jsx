import { useEffect, useState } from "react";
import { useAppContext } from "../context/AppContext";
import { useUpdateProfile } from "../services/user";

const EyeIcon = ({ open }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {open ? (
      <>
        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ) : (
      <>
        <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a20.3 20.3 0 0 1 5.06-5.94M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 7 11 7a20.3 20.3 0 0 1-2.68 3.68M14.12 14.12a3 3 0 1 1-4.24-4.24" />
        <path d="M1 1l22 22" />
      </>
    )}
  </svg>
);

function PasswordField({ label, name, value, onChange, placeholder }) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete="new-password"
          className="w-full border border-gray-300 rounded-lg pl-4 pr-11 py-3 text-sm outline-none transition focus:ring-2 focus:ring-black focus:border-black"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition"
        >
          <EyeIcon open={visible} />
        </button>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, fetchUser } = useAppContext();
  const { mutate: updateProfile, isPending } = useUpdateProfile();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    currentPassword: "",
    password: "",
    confirmPassword: "",
  });
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.name || "",
        email: user.email || "",
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    setErrorMsg("");
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (formData.password && formData.password !== formData.confirmPassword) {
      setErrorMsg("New password and confirm password don't match.");
      return;
    }

    const payload = { name: formData.name };

    if (user?.isGuest) {
      payload.email = formData.email;
      if (formData.password) {
        payload.password = formData.password;
      }
    } else {
      if (formData.password) {
        payload.password = formData.password;
        payload.currentPassword = formData.currentPassword;
      }
    }

    updateProfile(payload, {
      onSuccess: () => {
        fetchUser();
        setFormData((prev) => ({
          ...prev,
          currentPassword: "",
          password: "",
          confirmPassword: "",
        }));
      },
    });
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">My profile</h1>
          <p className="text-sm text-gray-500 mt-1">
            {user.isGuest
              ? "Complete your profile to save your account details."
              : "Update your name and password."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name
            </label>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Your name"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-black focus:border-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              name="email"
              type="email"
              value={formData.email}
              disabled={!user.isGuest}
              onChange={handleChange}
              placeholder="you@example.com"
              className={`w-full border rounded-lg px-4 py-3 text-sm outline-none transition ${!user.isGuest
                ? "border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
                : "border-gray-300 focus:ring-2 focus:ring-black focus:border-black"
                }`}
            />
            {!user.isGuest && (
              <p className="text-xs text-gray-500 mt-2">
                Email can't be changed.
              </p>
            )}
          </div>

          {!user.isGuest && (
            <PasswordField
              label="Current password"
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleChange}
              placeholder="Enter current password"
            />
          )}

          <div className="pt-2 border-t border-gray-100" />

          <PasswordField
            label="New password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Leave blank to keep current password"
          />

          <PasswordField
            label="Confirm password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Re-enter new password"
          />

          {errorMsg && (
            <p className="text-sm text-red-600 -mt-2">{errorMsg}</p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-900 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isPending ? "Updating..." : "Update profile"}
          </button>
        </form>
      </div>
    </div>
  );
}