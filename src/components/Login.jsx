import React from "react";
import { useAppContext } from "../context/AppContext";
import { toast } from "react-toastify";

const RESEND_COOLDOWN_SECONDS = 30;

const Login = () => {
  const { setShowUserLogin, setUser, axios, navigate, setCartItems } =
    useAppContext();

  const [step, setStep] = React.useState("phone");

  const [phone, setPhone] = React.useState("");
  const [otp, setOtp] = React.useState("");

  const [sending, setSending] = React.useState(false);
  const [verifying, setVerifying] = React.useState(false);
  const [cooldown, setCooldown] = React.useState(0);

  const merchantId = import.meta.env.VITE_MERCHANT_ID;

  React.useEffect(() => {
    if (cooldown <= 0) return;

    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldown]);

  const sendOtp = async () => {
    if (!/^[6-9]\d{9}$/.test(phone)) {
      toast.error("Enter a valid 10-digit phone number");
      return;
    }

    try {
      setSending(true);

      const { data } = await axios.post("/api/otp/send", {
        phone,
        merchantId,
      });

      if (data.success) {
        toast.success(data.message || "OTP sent successfully");
        setStep("otp");
        setCooldown(RESEND_COOLDOWN_SECONDS);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      setSending(false);
    }
  };

  const resendOtp = async () => {
    if (cooldown > 0) return;

    try {
      setSending(true);

      const { data } = await axios.post("/api/user/otp/resend", {
        phone,
        merchantId,
      });

      if (data.success) {
        toast.success(data.message || "OTP resent successfully");
        setCooldown(RESEND_COOLDOWN_SECONDS);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      setSending(false);
    }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();

    if (otp.length !== 4) {
      toast.error("Enter the 4-digit OTP");
      return;
    }

    try {
      setVerifying(true);

      const { data } = await axios.post("/api/otp/verify", {
        phone,
        otp,
        merchantId,
      });

      if (data.success) {
        toast.success(data.message);

        setUser(data.user);
        setCartItems(data.cartItems || []);

        setShowUserLogin(false);
        // navigate("/");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      setVerifying(false);
    }
  };

  const onPhoneSubmit = (e) => {
    e.preventDefault();
    sendOtp();
  };

  return (
    <div
      onClick={() => setShowUserLogin(false)}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={step === "phone" ? onPhoneSubmit : verifyOtp}
        className="w-full max-w-sm rounded-xl bg-white p-8 shadow-xl"
      >
        <h2 className="text-center text-2xl font-semibold">
          <span className="text-primary">Login</span> with OTP
        </h2>

        <p className="mt-2 text-center text-sm text-gray-500">
          Enter your mobile number to continue
        </p>

        {step === "phone" && (
          <>
            <div className="mt-6">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Mobile Number
              </label>

              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                }
                placeholder="Enter 10-digit mobile number"
                className="w-full rounded-lg border border-gray-300 p-3 outline-none transition focus:border-primary"
                required
              />
            </div>

            <button
              type="submit"
              disabled={sending}
              className="mt-6 w-full rounded-lg bg-primary py-3 font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {sending ? "Sending OTP..." : "Send OTP"}
            </button>
          </>
        )}

        {step === "otp" && (
          <>
            <div className="mt-6">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Enter OTP
              </label>

              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                autoFocus
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 4))
                }
                placeholder="1234"
                className="w-full rounded-lg border border-gray-300 p-3 text-center text-xl tracking-[10px] outline-none transition focus:border-primary"
                required
              />

              <p className="mt-3 text-sm text-gray-600">
                OTP sent to{" "}
                <span className="font-semibold">{phone}</span>

                <button
                  type="button"
                  onClick={() => {
                    setStep("phone");
                    setOtp("");
                  }}
                  className="ml-2 text-primary"
                >
                  Change
                </button>
              </p>
            </div>

            <button
              type="submit"
              disabled={verifying}
              className="mt-6 w-full rounded-lg bg-primary py-3 font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {verifying ? "Verifying..." : "Verify OTP"}
            </button>

            <div className="mt-4 text-center text-sm">
              {cooldown > 0 ? (
                <span className="text-gray-500">
                  Resend OTP in {cooldown}s
                </span>
              ) : (
                <button
                  type="button"
                  onClick={resendOtp}
                  className="font-medium text-primary"
                >
                  Resend OTP
                </button>
              )}
            </div>
          </>
        )}
      </form>
    </div>
  );
};

export default Login;

// import React from "react";
// import { useAppContext } from "../context/AppContext";
// import { toast } from "react-toastify";
// import { Eye, EyeOff } from "lucide-react";
// const Login = () => {
//   const { setShowUserLogin, setUser, axios, navigate, setCartItems } =
//     useAppContext();

//   const [state, setState] = React.useState("login");
//   const [name, setName] = React.useState("");
//   const [email, setEmail] = React.useState("");
//   const [password, setPassword] = React.useState("");
//   const [showPassword, setShowPassword] = React.useState(false);

//   const merchantId = import.meta.env.VITE_MERCHANT_ID;
//   const onSubmitHandler = async (event) => {
//     try {
//       event.preventDefault();

//       const { data } = await axios.post(`/api/user/${state}`, {
//         name,
//         email,
//         password,
//         merchantId,
//       });
//       if (data.success) {
//         navigate("/");
//         setUser(data?.user);
//         setCartItems(data?.cartItems || []);
//         setShowUserLogin(false);
//       }
//     } catch (error) {
//       toast.error(error.response.data.message || "Something went wrong");
//     }
//   };

//   return (
//     <div
//       onClick={() => setShowUserLogin(false)}
//       className="fixed top-0 bottom-0 left-0 right-0 z-30 flex items-center text-sm text-gray-600 bg-black/50"
//     >
//       <form
//         onSubmit={onSubmitHandler}
//         onClick={(e) => e.stopPropagation()}
//         className="flex flex-col gap-4 m-auto items-start p-8 py-12 w-80 sm:w-[352px] rounded-lg shadow-xl border border-gray-200 bg-white"
//       >
//         <p className="text-2xl font-medium m-auto">
//           <span className="text-primary">User</span>{" "}
//           {state === "login" ? "Login" : "Sign Up"}
//         </p>
//         {state === "register" && (
//           <div className="w-full">
//             <p>Name</p>
//             <input
//               onChange={(e) => setName(e.target.value)}
//               value={name}
//               placeholder="type here"
//               className="border border-gray-200 rounded w-full p-2 mt-1 outline-primary"
//               type="text"
//               required
//             />
//           </div>
//         )}
//         <div className="w-full ">
//           <p>Email</p>
//           <input
//             onChange={(e) => setEmail(e.target.value)}
//             value={email}
//             placeholder="type here"
//             className="border border-gray-200 rounded w-full p-2 mt-1 outline-primary"
//             type="email"
//             required
//           />
//         </div>
//         <div className="w-full">
//           <p>Password</p>

//           <div className="relative mt-1">
//             <input
//               onChange={(e) => setPassword(e.target.value)}
//               value={password}
//               minLength={8}
//               maxLength={12}
//               placeholder="Enter your password"
//               className="border border-gray-200 rounded w-full p-2 pr-10 outline-primary"
//               type={showPassword ? "text" : "password"}
//               required
//             />

//             <button
//               type="button"
//               onClick={() => setShowPassword((prev) => !prev)}
//               className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-primary"
//             >
//               {showPassword ? (
//                 <EyeOff className="w-5 h-5" />
//               ) : (
//                 <Eye className="w-5 h-5" />
//               )}
//             </button>
//           </div>
//         </div>
//         {state === "register" ? (
//           <p>
//             Already have account?{" "}
//             <span
//               onClick={() => setState("login")}
//               className="text-primary cursor-pointer"
//             >
//               click here
//             </span>
//           </p>
//         ) : (
//           <p>
//             Create an account?{" "}
//             <span
//               onClick={() => setState("register")}
//               className="text-primary cursor-pointer"
//             >
//               click here
//             </span>
//           </p>
//         )}
//         <button className="bg-primary hover:bg-primary-dull transition-all text-white w-full py-2 rounded-md cursor-pointer">
//           {state === "register" ? "Create Account" : "Login"}
//         </button>
//       </form>
//     </div>
//   );
// };

// export default Login;
