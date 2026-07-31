import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useAppContext } from "../context/AppContext";
import { useUpdateProfile } from "../services/user";

const RESEND_COOLDOWN_SECONDS = 30;

export default function ProfilePage() {
  const { user, fetchUser, axios } = useAppContext();
  const { mutate: updateProfile, isPending } = useUpdateProfile();

  const merchantId = import.meta.env.VITE_MERCHANT_ID;

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [errorMsg, setErrorMsg] = useState("");

  // OTP step state — only active while a phone-number change is pending
  const [otpStep, setOtpStep] = useState(false);
  const [pendingPhone, setPendingPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
      }));
    }
  }, [user]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleChange = (e) => {
    setErrorMsg("");
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg("");

    const payload = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      merchantId,
    };

    updateProfile(payload, {
      onSuccess: (data) => {
        if (data?.phoneVerificationRequired) {
          setPendingPhone(formData.phone);
          setOtp("");
          setOtpStep(true);
          setCooldown(RESEND_COOLDOWN_SECONDS);
          toast.success(data.message || "OTP sent to your new number");
        } else {
          fetchUser();
          toast.success(data?.message || "Profile updated successfully");
        }
      },
      onError: (error) => {
        setErrorMsg(error.response?.data?.message || "Something went wrong");
      },
    });
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    if (otp.length !== 4) {
      toast.error("Enter the 4-digit OTP");
      return;
    }

    try {
      setVerifying(true);
      const { data } = await axios.post("/api/otp/verify-phone-update", {
        phone: pendingPhone,
        otp,
        merchantId,
      });

      if (data.success) {
        toast.success(data.message || "Phone number updated successfully");
        setOtpStep(false);
        setOtp("");
        fetchUser();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      setVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0) return;

    try {
      setResending(true);
      const { data } = await axios.post("/api/otp/resend-phone-update-otp", {
        phone: pendingPhone,
        merchantId,
      });

      if (data.success) {
        toast.success(data.message || "OTP resent successfully");
        setCooldown(RESEND_COOLDOWN_SECONDS);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      setResending(false);
    }
  };

  const cancelPhoneChange = () => {
    setOtpStep(false);
    setOtp("");
    setCooldown(0);
    setFormData((prev) => ({ ...prev, phone: user?.phone || "" }));
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">My profile</h1>
          <div className="mt-2 space-y-1">
            <p className="text-sm text-gray-500">
              Update your name, email, and phone number.
            </p>

            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-md p-2">
              <strong>Note:</strong> Name and email are updated immediately. If you
              change your phone number, you'll be asked to verify it using an OTP
              before the new number is saved.
            </p>
          </div>
        </div>

        {!otpStep ? (
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
                onChange={handleChange}
                placeholder="you@example.com"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-black focus:border-black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone number
              </label>
              <input
                name="phone"
                type="tel"
                inputMode="numeric"
                value={formData.phone}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    phone: e.target.value.replace(/\D/g, "").slice(0, 10),
                  }))
                }
                placeholder="10-digit mobile number"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-black focus:border-black"
              />
              {formData.phone !== (user.phone || "") && (
                <p className="text-xs text-gray-500 mt-2">
                  We'll text a code to confirm this number.
                </p>
              )}
            </div>

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
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div>
              <p className="text-sm text-gray-700">
                OTP sent to{" "}
                <span className="font-medium">{pendingPhone}</span>{" "}
                <span
                  onClick={cancelPhoneChange}
                  className="text-black underline cursor-pointer"
                >
                  change
                </span>
              </p>
              <input
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 4))
                }
                placeholder="Enter 4-digit OTP"
                inputMode="numeric"
                maxLength={4}
                autoFocus
                className="w-full border border-gray-300 rounded-lg px-4 py-3 mt-3 text-sm text-center tracking-widest outline-none transition focus:ring-2 focus:ring-black focus:border-black"
              />
            </div>

            <p className="text-sm text-gray-500">
              Didn't receive the code?{" "}
              {cooldown > 0 ? (
                <span className="text-gray-400">Resend in {cooldown}s</span>
              ) : (
                <span
                  onClick={resending ? undefined : handleResendOtp}
                  className="text-black underline cursor-pointer"
                >
                  {resending ? "Resending..." : "Resend OTP"}
                </span>
              )}
            </p>

            <button
              type="submit"
              disabled={verifying}
              className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-900 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {verifying ? "Verifying..." : "Verify & update phone"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// import { useEffect, useState } from "react";
// import { useAppContext } from "../context/AppContext";
// import { useUpdateProfile } from "../services/user";

// const EyeIcon = ({ open }) => (
//   <svg
//     width="20"
//     height="20"
//     viewBox="0 0 24 24"
//     fill="none"
//     stroke="currentColor"
//     strokeWidth="1.8"
//     strokeLinecap="round"
//     strokeLinejoin="round"
//   >
//     {open ? (
//       <>
//         <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
//         <circle cx="12" cy="12" r="3" />
//       </>
//     ) : (
//       <>
//         <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a20.3 20.3 0 0 1 5.06-5.94M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 7 11 7a20.3 20.3 0 0 1-2.68 3.68M14.12 14.12a3 3 0 1 1-4.24-4.24" />
//         <path d="M1 1l22 22" />
//       </>
//     )}
//   </svg>
// );

// function PasswordField({ label, name, value, onChange, placeholder }) {
//   const [visible, setVisible] = useState(false);

//   return (
//     <div>
//       <label className="block text-sm font-medium text-gray-700 mb-2">
//         {label}
//       </label>
//       <div className="relative">
//         <input
//           type={visible ? "text" : "password"}
//           name={name}
//           value={value}
//           onChange={onChange}
//           placeholder={placeholder}
//           autoComplete="new-password"
//           className="w-full border border-gray-300 rounded-lg pl-4 pr-11 py-3 text-sm outline-none transition focus:ring-2 focus:ring-black focus:border-black"
//         />
//         <button
//           type="button"
//           onClick={() => setVisible((v) => !v)}
//           aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
//           className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition"
//         >
//           <EyeIcon open={visible} />
//         </button>
//       </div>
//     </div>
//   );
// }

// export default function ProfilePage() {
//   const { user, fetchUser } = useAppContext();
//   const { mutate: updateProfile, isPending } = useUpdateProfile();

//   const [formData, setFormData] = useState({
//     name: "",
//     email: "",
//     currentPassword: "",
//     password: "",
//     confirmPassword: "",
//   });
//   const [errorMsg, setErrorMsg] = useState("");

//   useEffect(() => {
//     if (user) {
//       setFormData((prev) => ({
//         ...prev,
//         name: user.name || "",
//         email: user.email || "",
//       }));
//     }
//   }, [user]);

//   const handleChange = (e) => {
//     setErrorMsg("");
//     setFormData((prev) => ({
//       ...prev,
//       [e.target.name]: e.target.value,
//     }));
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();

//     if (formData.password && formData.password !== formData.confirmPassword) {
//       setErrorMsg("New password and confirm password don't match.");
//       return;
//     }

//     const payload = { name: formData.name };

//     if (user?.isGuest) {
//       payload.email = formData.email;
//       if (formData.password) {
//         payload.password = formData.password;
//       }
//     } else {
//       if (formData.password) {
//         payload.password = formData.password;
//         payload.currentPassword = formData.currentPassword;
//       }
//     }

//     updateProfile(payload, {
//       onSuccess: () => {
//         fetchUser();
//         setFormData((prev) => ({
//           ...prev,
//           currentPassword: "",
//           password: "",
//           confirmPassword: "",
//         }));
//       },
//     });
//   };

//   if (!user) return null;

//   return (
//     <div className="max-w-2xl mx-auto px-4 py-10">
//       <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
//         <div className="mb-8">
//           <h1 className="text-2xl font-semibold text-gray-900">My profile</h1>
//           <p className="text-sm text-gray-500 mt-1">
//             {user.isGuest
//               ? "Complete your profile to save your account details."
//               : "Update your name and password."}
//           </p>
//         </div>

//         <form onSubmit={handleSubmit} className="space-y-6">
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">
//               Name
//             </label>
//             <input
//               name="name"
//               value={formData.name}
//               onChange={handleChange}
//               placeholder="Your name"
//               className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-black focus:border-black"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">
//               Email
//             </label>
//             <input
//               name="email"
//               type="email"
//               value={formData.email}
//               disabled={!user.isGuest}
//               onChange={handleChange}
//               placeholder="you@example.com"
//               className={`w-full border rounded-lg px-4 py-3 text-sm outline-none transition ${!user.isGuest
//                 ? "border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
//                 : "border-gray-300 focus:ring-2 focus:ring-black focus:border-black"
//                 }`}
//             />
//             {!user.isGuest && (
//               <p className="text-xs text-gray-500 mt-2">
//                 Email can't be changed.
//               </p>
//             )}
//           </div>

//           {!user.isGuest && (
//             <PasswordField
//               label="Current password"
//               name="currentPassword"
//               value={formData.currentPassword}
//               onChange={handleChange}
//               placeholder="Enter current password"
//             />
//           )}

//           <div className="pt-2 border-t border-gray-100" />

//           <PasswordField
//             label="New password"
//             name="password"
//             value={formData.password}
//             onChange={handleChange}
//             placeholder="Leave blank to keep current password"
//           />

//           <PasswordField
//             label="Confirm password"
//             name="confirmPassword"
//             value={formData.confirmPassword}
//             onChange={handleChange}
//             placeholder="Re-enter new password"
//           />

//           {errorMsg && (
//             <p className="text-sm text-red-600 -mt-2">{errorMsg}</p>
//           )}

//           <button
//             type="submit"
//             disabled={isPending}
//             className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-900 transition disabled:opacity-60 disabled:cursor-not-allowed"
//           >
//             {isPending ? "Updating..." : "Update profile"}
//           </button>
//         </form>
//       </div>
//     </div>
//   );
// }