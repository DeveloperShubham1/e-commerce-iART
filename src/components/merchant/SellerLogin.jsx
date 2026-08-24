import React, { useEffect, useState } from "react";
import { Eye, EyeOff, Store, Mail, Lock, ArrowRight, CircleCheck, Users } from "lucide-react";
import { useAppContext } from "../../context/AppContext";
import { toast } from "react-toastify";


const SellerLogin = () => {
  const { isMerchant,
    setIsMerchant,
    isManager,
    setIsManager,
    setManagerData,
    setManagerPermissions,
    navigate,
    axios,
    setMerchantData, } =
    useAppContext();

  const [loginType, setLoginType] = useState("merchant"); // "merchant" | "manager"

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmitHandler = async (event) => {
    try {
      event.preventDefault();
      setLoading(true);

      if (loginType === "manager") {
        const { data } = await axios.post("/api/managers/login", {
          email,
          password,
        });
        if (data.success) {
          setIsManager(true);
          setManagerData(data?.manager);
          setManagerPermissions(data?.permissions || []);
          console.log("login", data)
          navigate("/dashboard");
        } else {
          toast.error(data.message || "Login failed");
        }
        return;
      }

      const { data } = await axios.post("/api/merchant/login", {
        email,
        password,
      });

      if (data.success) {
        setIsMerchant(true);
        setMerchantData(data?.merchant);
        navigate("/dashboard");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isMerchant || isManager) {
      navigate("/dashboard");
    }
  }, [isMerchant, isManager]);

  return (
    !isMerchant && !isManager && (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@500&display=swap');

          .sl-display { font-family: 'Space Grotesk', sans-serif; }
          .sl-body { font-family: 'Inter', sans-serif; }
          .sl-mono { font-family: 'IBM Plex Mono', monospace; }

          .sl-ticket {
            animation: sl-settle 0.6s cubic-bezier(0.16, 1, 0.3, 1) backwards;
          }
          .sl-ticket:nth-child(1) { animation-delay: 0.05s; }
          .sl-ticket:nth-child(2) { animation-delay: 0.15s; }
          .sl-ticket:nth-child(3) { animation-delay: 0.25s; }

          @keyframes sl-settle {
            from { opacity: 0; transform: translateY(10px) rotate(var(--sl-rot, 0deg)) scale(0.98); }
            to { opacity: 1; transform: translateY(0) rotate(var(--sl-rot, 0deg)) scale(1); }
          }

          .sl-input:focus {
            outline: none;
            border-color: #1C8A5D;
            box-shadow: 0 0 0 3px #E7F4EC;
          }

          @media (prefers-reduced-motion: reduce) {
            .sl-ticket { animation: none; }
          }

          /* Mobile: dark dotted backdrop, like a device screenshot frame.
             Desktop (md+): reverts to the plain paper background. */
          .sl-shell {
            background-color: #0B0F1A;
            background-image: radial-gradient(rgba(255, 255, 255, 0.09) 1px, transparent 1px);
            background-size: 18px 18px;
            overflow: hidden;
          }
          @media (min-width: 768px) {
            .sl-shell {
              background-color: #FAFAF9;
              background-image: none;
            }
          }

          /* Mobile: the form sits inside a floating white card.
             Desktop (md+): chrome is removed, form sits directly on the panel. */
          .sl-card {
            width: 100%;
            max-width: 24rem;
            background-color: #FFFFFF;
            border: 1px solid #E4E6EA;
            border-radius: 1rem;
            box-shadow: 0 24px 48px -16px rgba(4, 8, 20, 0.45);
            padding: 1.5rem 1.375rem;
          }
          @media (min-width: 768px) {
            .sl-card {
              max-width: 24rem;
              background-color: transparent;
              border: none;
              border-radius: 0;
              box-shadow: none;
              padding: 0;
            }
          }
        `}</style>

        <form
          onSubmit={onSubmitHandler}
          className="sl-shell sl-body h-screen overflow-hidden flex flex-col md:flex-row"
        >
          {/* Brand panel — hidden on mobile, shown from md breakpoint up */}
          <div
            className="relative hidden flex-col justify-center gap-10 overflow-hidden px-8 py-8 md:flex md:w-[46%] md:px-14 md:py-10"
            style={{
              background: "linear-gradient(160deg, #101A30 0%, #1B2C4F 100%)",
            }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-lg"
                style={{ backgroundColor: "#1C8A5D" }}
              >
                <Store size={18} color="#FAFAF9" strokeWidth={2.25} />
              </div>
              <span className="sl-display text-lg font-semibold tracking-tight text-white">
                Merchant Hub
              </span>
            </div>

            <div>
              <h1 className="sl-display text-3xl font-semibold leading-tight text-white sm:text-4xl">
                Run the shop.
                <br />
                Skip the spreadsheets.
              </h1>
              <p className="mt-4 max-w-sm text-sm leading-relaxed" style={{ color: "#A9B4CA" }}>
                Orders, payouts, and inventory in one place — sign back in
                to pick up where you left off.
              </p>

              {/* Signature element: fanned order-ticket stack */}
              <div className="relative mt-8 h-40 w-full max-w-xs">
                <div
                  className="sl-ticket absolute left-0 top-6 w-56 rounded-lg border p-3.5 shadow-lg"
                  style={{
                    backgroundColor: "#FAFAF9",
                    borderColor: "#E4E6EA",
                    "--sl-rot": "-6deg",
                    transform: "rotate(-6deg)",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="sl-mono text-[11px] font-medium" style={{ color: "#64748B" }}>
                      #A2291
                    </span>
                    <span
                      className="rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                      style={{ backgroundColor: "#E7F4EC", color: "#1C8A5D" }}
                    >
                      Paid
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs font-medium" style={{ color: "#101A30" }}>
                    Wireless earbuds × 2
                  </p>
                  <p className="sl-mono mt-1 text-[13px] font-medium" style={{ color: "#101A30" }}>
                    $48.00
                  </p>
                </div>

                <div
                  className="sl-ticket absolute left-14 top-2 w-56 rounded-lg border p-3.5 shadow-lg"
                  style={{
                    backgroundColor: "#FAFAF9",
                    borderColor: "#E4E6EA",
                    "--sl-rot": "3deg",
                    transform: "rotate(3deg)",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="sl-mono text-[11px] font-medium" style={{ color: "#64748B" }}>
                      #A2292
                    </span>
                    <span
                      className="rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                      style={{ backgroundColor: "#FBF0DE", color: "#C98A2C" }}
                    >
                      Packing
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs font-medium" style={{ color: "#101A30" }}>
                    Ceramic mug set
                  </p>
                  <p className="sl-mono mt-1 text-[13px] font-medium" style={{ color: "#101A30" }}>
                    $22.50
                  </p>
                </div>

                <div
                  className="sl-ticket absolute left-28 top-10 w-56 rounded-lg border p-3.5 shadow-lg"
                  style={{
                    backgroundColor: "#FAFAF9",
                    borderColor: "#E4E6EA",
                    "--sl-rot": "-2deg",
                    transform: "rotate(-2deg)",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="sl-mono text-[11px] font-medium" style={{ color: "#64748B" }}>
                      #A2293
                    </span>
                    <span
                      className="flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                      style={{ backgroundColor: "#E7F4EC", color: "#1C8A5D" }}
                    >
                      <CircleCheck size={10} /> Shipped
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs font-medium" style={{ color: "#101A30" }}>
                    Canvas tote bag
                  </p>
                  <p className="sl-mono mt-1 text-[13px] font-medium" style={{ color: "#101A30" }}>
                    $16.00
                  </p>
                </div>
              </div>
            </div>

            <p className="relative text-xs" style={{ color: "#6E7A93" }}>
              Trusted by independent sellers shipping every day.
            </p>
          </div>

          {/* Form panel */}
          <div className="flex flex-1 flex-col items-center justify-center overflow-hidden px-5 py-6 sm:px-10 md:py-12">
            {/* Mobile-only brand bar, sits above the card like a status header */}
            <div className="mb-4 flex items-center gap-2 md:hidden">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-md"
                style={{ backgroundColor: "#1C8A5D" }}
              >
                <Store size={14} color="#FFFFFF" strokeWidth={2.25} />
              </div>
              <span className="sl-display text-sm font-semibold tracking-tight" style={{ color: "#E7EAF0" }}>
                Merchant Portal
              </span>
            </div>

            <div className="sl-card">
              <p className="sl-display text-center text-2xl font-semibold md:text-left" style={{ color: "#101A30" }}>
                {loginType === "manager" ? "Manager login" : "Seller login"}
              </p>
              <p className="mt-1.5 text-center text-sm md:text-left" style={{ color: "#64748B" }}>
                Welcome back — enter your details to continue.
              </p>

              {/* Merchant / Manager tabs */}
              <div className="mt-5 flex rounded-lg p-1" style={{ backgroundColor: "#F1F3F5" }}>
                <button
                  type="button"
                  onClick={() => setLoginType("merchant")}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: loginType === "merchant" ? "#FFFFFF" : "transparent",
                    color: loginType === "merchant" ? "#101A30" : "#64748B",
                    boxShadow: loginType === "merchant" ? "0 1px 2px rgba(16,26,48,0.08)" : "none",
                  }}
                >
                  <Store size={14} />
                  Merchant
                </button>
                <button
                  type="button"
                  onClick={() => setLoginType("manager")}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: loginType === "manager" ? "#FFFFFF" : "transparent",
                    color: loginType === "manager" ? "#101A30" : "#64748B",
                    boxShadow: loginType === "manager" ? "0 1px 2px rgba(16,26,48,0.08)" : "none",
                  }}
                >
                  <Users size={14} />
                  Manager
                </button>
              </div>

              {/* Email */}
              <div className="mt-5 w-full">
                <label
                  htmlFor="sl-email"
                  className="text-xs font-medium"
                  style={{ color: "#374151" }}
                >
                  Email
                </label>
                <div className="relative mt-1.5">
                  <Mail
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
                    style={{ color: "#94A0B4" }}
                  />
                  <input
                    id="sl-email"
                    onChange={(e) => setEmail(e.target.value)}
                    value={email}
                    type="email"
                    placeholder="you@yourstore.com"
                    className="sl-input w-full rounded-lg border py-2.5 pl-9 pr-3 text-sm transition-shadow"
                    style={{ borderColor: "#E4E6EA", color: "#101A30" }}
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="mt-3.5 w-full">
                <label
                  htmlFor="sl-password"
                  className="text-xs font-medium"
                  style={{ color: "#374151" }}
                >
                  Password
                </label>
                <div className="relative mt-1.5">
                  <Lock
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
                    style={{ color: "#94A0B4" }}
                  />
                  <input
                    id="sl-password"
                    onChange={(e) => setPassword(e.target.value)}
                    value={password}
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="sl-input w-full rounded-lg border py-2.5 pl-9 pr-10 text-sm transition-shadow"
                    style={{ borderColor: "#E4E6EA", color: "#101A30" }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: "#94A0B4" }}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-5 flex w-full items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-medium text-white transition-opacity disabled:opacity-70"
                style={{ backgroundColor: "#1C8A5D" }}
              >
                {loading ? "Signing in…" : "Login"}
                {!loading && <ArrowRight size={15} />}
              </button>
            </div>

            {/* Mobile-only footer */}
            <div className="mt-4 flex flex-col items-center gap-1.5 md:hidden">
              <p className="text-[11px]" style={{ color: "#5B6472" }}>
                © 2026 Merchant Hub. All rights reserved.
              </p>
              <div className="flex items-center gap-2.5 text-[11px]" style={{ color: "#465066" }}>
                <button type="button" className="hover:underline">Privacy Policy</button>
                <span>•</span>
                <button type="button" className="hover:underline">Terms of Service</button>
                <span>•</span>
                <button type="button" className="hover:underline">Help Center</button>
              </div>
            </div>
          </div>
        </form>
      </>
    )
  );
};

export default SellerLogin;