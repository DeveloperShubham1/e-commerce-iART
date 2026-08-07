import { useState } from "react";
import { footerLinks } from "../assets/assets";
import { useAppContext } from "../context/AppContext";
import { Link, useLocation } from "react-router-dom";
import {
  Instagram,
  Facebook,
  Youtube,
  Mail,
  Phone,
  MapPin,
  ChevronDown,
} from "lucide-react";

const socialIcons = {
  Instagram: <Instagram size={18} />,
  Facebook: <Facebook size={18} />,
  YouTube: <Youtube size={18} />,
};

const Footer = () => {
  const { settings } = useAppContext();
  const location = useLocation();

  // Track which footer sections are expanded on mobile (accordion)
  const [openSection, setOpenSection] = useState(null);

  const toggleSection = (index) => {
    setOpenSection((prev) => (prev === index ? null : index));
  };

  const rawPhone = settings?.contact?.phone || "9876543210";

  // Display
  const displayPhone = `+91 ${rawPhone}`;

  // Link
  const email = settings?.contact?.email || "test@gmail.com";
  const address =
    settings?.contact?.address ||
    "test, Kharar, India, 140301";

  return (
    <footer className="mt-16 sm:mt-24 bg-[var(--color-primary-bg)] border-t border-gray-200">
      <div className="px-5 sm:px-6 lg:px-10 py-10 sm:py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 sm:gap-10 lg:gap-12">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-2 text-center sm:text-left">
            <img
              src={settings?.branding?.logo?.url}
              alt="logo"
              className="h-16 sm:h-20 w-auto mx-auto sm:mx-0"
            />

            <p className="mt-5 sm:mt-6 text-sm sm:text-base text-gray-600 leading-6 sm:leading-7 max-w-md mx-auto sm:mx-0">
              Discover premium fashion designed for everyday confidence.
              From timeless classics to the latest trends, we deliver
              quality clothing that combines style, comfort, and value.
            </p>

            <div className="mt-6 sm:mt-8 space-y-3 text-sm text-gray-600 max-w-sm mx-auto sm:mx-0">
              <div className="flex items-center justify-center sm:justify-start gap-3">
                <Mail size={18} className="text-primary flex-shrink-0" />
                <span className="break-all text-left">{email}</span>
              </div>

              <div className="flex items-center justify-center sm:justify-start gap-3">
                <Phone size={18} className="text-primary flex-shrink-0" />
                <span>{displayPhone}</span>
              </div>

              <div className="flex items-center justify-center sm:justify-start gap-3">
                <MapPin size={18} className="text-primary flex-shrink-0" />
                <span className="text-left">{address}</span>
              </div>
            </div>
          </div>

          {/* Links */}
          {footerLinks.map((section, index) => {
            const isOpen = openSection === index;

            return (
              <div
                key={index}
                className="border-b border-gray-200 sm:border-none pb-3 sm:pb-0"
              >
                {/* Header: button on mobile (accordion), plain heading on sm+ */}
                <button
                  type="button"
                  onClick={() => toggleSection(index)}
                  className="w-full flex items-center justify-between sm:pointer-events-none sm:cursor-default"
                  aria-expanded={isOpen}
                >
                  <h3 className="text-gray-900 font-semibold text-base sm:text-lg mb-0 sm:mb-5 py-3 sm:py-0">
                    {section.title}
                  </h3>
                  <ChevronDown
                    size={18}
                    className={`text-gray-500 sm:hidden transition-transform duration-200 ${isOpen ? "rotate-180" : ""
                      }`}
                  />
                </button>

                <ul
                  className={`space-y-3 overflow-hidden transition-all duration-300 sm:!max-h-none sm:!block sm:pb-0 ${isOpen ? "max-h-96 pb-3" : "max-h-0 sm:max-h-none"
                    }`}
                >
                  {section.links.map((link, i) => (
                    <li key={i}>
                      {link.external ? (
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-gray-600 hover:text-primary transition-all duration-200 text-sm sm:text-base"
                        >
                          {socialIcons[link.text]}
                          <span>{link.text}</span>
                        </a>
                      ) : (
                        <Link
                          to={link.url}
                          className={`block transition-all duration-200 hover:text-primary text-sm sm:text-base ${location.pathname === link.url
                              ? "text-primary font-semibold"
                              : "text-gray-600"
                            }`}
                        >
                          {link.text}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Bottom */}
        <div className="border-t border-gray-200 mt-10 sm:mt-12 pt-6 flex flex-col-reverse sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <p className="text-xs sm:text-sm text-gray-500">
            © {new Date().getFullYear()} DigiShop. All rights reserved.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs sm:text-sm">
            <Link
              to="/privacy-policy"
              className="text-gray-500 hover:text-primary"
            >
              Privacy Policy
            </Link>

            <Link
              to="/terms-policy"
              className="text-gray-500 hover:text-primary"
            >
              Terms
            </Link>

            <Link
              to="/shipping-policy"
              className="text-gray-500 hover:text-primary"
            >
              Shipping
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;