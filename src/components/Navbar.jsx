import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { assets } from "../assets/assets";
import { useAppContext } from "../context/AppContext";
import { toast } from "react-toastify";
import { Search, User, ShoppingBag, Menu, X } from "lucide-react";

const navLinkClass = ({ isActive }) =>
  `relative text-sm font-medium tracking-wide transition-colors hover:text-primary ${isActive ? "text-primary" : "text-gray-700"
  } after:content-[''] after:absolute after:left-0 after:-bottom-1 after:h-[1.5px] after:bg-primary after:transition-all after:duration-300 ${isActive ? "after:w-full" : "after:w-0 hover:after:w-full"
  }`;

const Navbar = () => {
  const BUILD_TYPE = import.meta.env.VITE_BUILD_TYPE; // user | merchant
  const [open, setOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false); // desktop expandable search
  const [showMobileSearch, setShowMobileSearch] = useState(false); // mobile search row

  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const {
    user,
    setUser,
    setShowUserLogin,
    navigate,
    setSearchQuery,
    searchQuery,
    getCartCount,
    axios,
    settings,
  } = useAppContext();

  const logout = async () => {
    try {
      const { data } = await axios.get("/api/user/logout");
      if (data.success) {
        toast.success(data.message);
        if (BUILD_TYPE == "user") {
          navigate("/");
        } else {
          navigate("/merchant");
        }
        setUser(null);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    if (searchQuery.length > 0) {
      navigate("/products");
    }
  }, [searchQuery]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/products", label: "All Products" },
    { to: "/contact", label: "Contact" },
  ];

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 bg-white`}
    >
      {/* Main nav */}
      <nav className="flex items-center justify-between px-4 sm:px-8 md:px-16 lg:px-24 xl:px-32 py-4 border-b border-gray-200 relative">
        {/* Mobile/Tablet: hamburger (now shows up to md) */}
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="md:hidden text-gray-700"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Logo */}
        <NavLink
          to="/"
          onClick={() => setOpen(false)}
          className="flex items-center gap-2 sm:gap-3 mx-auto md:mx-0"
        >
          {settings?.branding?.logo?.url && (
            <img
              className="h-9 sm:h-10 w-auto object-contain"
              src={settings.branding.logo.url}
              alt="logo"
            />
          )}
          <span className="text-lg sm:text-2xl font-semibold tracking-wide leading-none whitespace-nowrap text-[var(--color-primary)] truncate" title={settings?.title || "Brand Name"}>
            {settings?.title || "Brand Name"}
          </span>
        </NavLink>

        {/* Desktop nav links - now only from md up */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <NavLink key={link.to} to={link.to} className={navLinkClass}>
              {link.label}
            </NavLink>
          ))}
        </div>

        {/* Right icons */}
        <div className="flex items-center gap-4 sm:gap-5">
          {/* Search - desktop expandable (only from md up) */}
          <div className="hidden md:flex items-center">
            <div
              className={`flex items-center overflow-hidden border border-gray-300 rounded-full transition-all duration-300 ${showSearch ? "w-52 px-3 py-1.5" : "w-9 h-9 justify-center"
                }`}
            >
              <button
                onClick={() => setShowSearch((s) => !s)}
                aria-label="Toggle search"
                className="shrink-0 text-gray-600 hover:text-primary transition"
              >
                <Search className="w-4 h-4" />
              </button>
              {showSearch && (
                <input
                  autoFocus
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products"
                  className="ml-2 w-full bg-transparent outline-none text-sm placeholder-gray-500"
                />
              )}
            </div>
          </div>

          {/* Mobile/Tablet search icon - toggles inline search row instead of navigating */}
          <button
            onClick={() => setShowMobileSearch((s) => !s)}
            aria-label="Toggle search"
            className="md:hidden text-gray-700"
          >
            {showMobileSearch ? (
              <X className="w-5 h-5" />
            ) : (
              <Search className="w-5 h-5" />
            )}
          </button>

          {/* Cart */}
          <div
            onClick={() => navigate("/cart")}
            className="relative cursor-pointer text-gray-700 hover:text-primary transition"
          >
            <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6" />
            {getCartCount() > 0 && (
              <span className="absolute -top-2 -right-2 text-[10px] leading-none text-white bg-primary w-4 h-4 flex items-center justify-center rounded-full">
                {getCartCount()}
              </span>
            )}
          </div>

          {/* Account - desktop (only from md up) */}
          <div className="hidden md:block">
            {!user ? (
              <button
                onClick={() => setShowUserLogin(true)}
                className="cursor-pointer px-6 py-2 bg-primary hover:bg-primary-dull transition text-white text-sm rounded-full"
              >
                Login
              </button>
            ) : (
              <div className="relative group">
                <button
                  aria-label="Account"
                  className="text-gray-700 hover:text-primary transition"
                >
                  <User className="w-6 h-6" />
                </button>
                <ul className="hidden group-hover:block absolute top-8 right-0 bg-white shadow-lg border border-gray-100 py-2 w-36 rounded-lg text-sm z-40">
                  <li
                    onClick={() => navigate("my-orders")}
                    className="px-4 py-2 hover:bg-primary/10 cursor-pointer"
                  >
                    My Orders
                  </li>
                  <li
                    onClick={() => navigate("/user/profile")}
                    className="px-4 py-2 hover:bg-primary/10 cursor-pointer"
                  >
                    My Profile
                  </li>
                  <li
                    onClick={logout}
                    className="px-4 py-2 hover:bg-primary/10 cursor-pointer text-red-500"
                  >
                    Logout
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile/Tablet inline search row */}
      {showMobileSearch && (
        <div className="md:hidden px-4 sm:px-8 py-3 border-b border-gray-200 bg-[var(--color-primary-bg)]">
          <div className="flex items-center gap-2 border border-gray-300 rounded-full px-3 py-2">
            <Search className="w-4 h-4 text-gray-500 shrink-0" />
            <input
              autoFocus
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products"
              className="w-full bg-transparent outline-none text-sm placeholder-gray-500"
            />
          </div>
        </div>
      )}

      {/* Mobile drawer - now only up to md */}
      <div
        className={`fixed inset-0 z-[60] transition-visibility md:hidden ${open ? "visible" : "invisible"
          }`}
      >
        {/* Backdrop */}
        <div
          onClick={() => setOpen(false)}
          className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"
            }`}
        />

        {/* Drawer panel */}
        <div
          className={`absolute top-0 left-0 h-full w-72 bg-white shadow-xl transition-transform duration-300 ease-out flex flex-col ${open ? "translate-x-0" : "-translate-x-full"
            }`}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <span className="text-lg font-semibold text-[var(--color-primary)]">
              {settings?.title || "Menu"}
            </span>
            <button onClick={() => setOpen(false)} aria-label="Close menu">
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          <div className="flex flex-col gap-1 px-5 py-4 overflow-y-auto">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `py-3 text-base border-b border-gray-50 ${isActive ? "text-primary font-medium" : "text-gray-700"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
            {user && (
              <>
                <NavLink
                  to="/my-orders"
                  onClick={() => setOpen(false)}
                  className="py-3 text-base text-gray-700 border-b border-gray-50"
                >
                  My Orders
                </NavLink>
                <NavLink
                  to="/user/profile"
                  onClick={() => setOpen(false)}
                  className="py-3 text-base text-gray-700 border-b border-gray-50"
                >
                  My Profile
                </NavLink>
              </>
            )}
          </div>

          <div className="mt-auto px-5 py-5 border-t border-gray-100">
            {!user ? (
              <button
                onClick={() => {
                  setOpen(false);
                  setShowUserLogin(true);
                }}
                className="w-full py-2.5 bg-primary hover:bg-primary-dull transition text-white rounded-full text-sm font-medium"
              >
                Login
              </button>
            ) : (
              <button
                onClick={() => {
                  setOpen(false);
                  logout();
                }}
                className="w-full py-2.5 bg-primary hover:bg-primary-dull transition text-white rounded-full text-sm font-medium"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;