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
} from "lucide-react";

const socialIcons = {
  Instagram: <Instagram size={18} />,
  Facebook: <Facebook size={18} />,
  YouTube: <Youtube size={18} />,
};

const Footer = () => {
  const { settings } = useAppContext();
  const location = useLocation();

  const rawPhone = settings?.contact?.phone || "9876543210";

  // Display
  const displayPhone = `+91 ${rawPhone}`;

  // Link
  const email = settings?.contact?.email || "test@gmail.com";
  const address =
    settings?.contact?.address ||
    "test, Kharar, India, 140301";

  return (
    <footer className="mt-24 bg-[var(--color-primary-bg)] border-t border-gray-200">
      <div className=" px-6 lg:px-10 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <img
              src={settings?.branding?.logo?.url}
              alt="logo"
              className="h-20 w-auto"
            />

            <p className="mt-6 text-gray-600 leading-7 max-w-md">
              Discover premium fashion designed for everyday confidence.
              From timeless classics to the latest trends, we deliver
              quality clothing that combines style, comfort, and value.
            </p>

            <div className="mt-8 space-y-3 text-sm text-gray-600">
              <div className="flex items-center gap-3">
                <Mail size={18} className="text-primary" />
                {email}
              </div>

              <div className="flex items-center gap-3">
                <Phone size={18} className="text-primary" />
                {displayPhone}
              </div>

              <div className="flex items-center gap-3">
                <MapPin size={18} className="text-primary" />
                {address}
              </div>
            </div>
          </div>

          {/* Links */}
          {footerLinks.map((section, index) => (
            <div key={index}>
              <h3 className="text-gray-900 font-semibold text-lg mb-5">
                {section.title}
              </h3>

              <ul className="space-y-3">
                {section.links.map((link, i) => (
                  <li key={i}>
                    {link.external ? (
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-gray-600 hover:text-primary transition-all duration-200"
                      >
                        {socialIcons[link.text]}
                        <span>{link.text}</span>
                      </a>
                    ) : (
                      <Link
                        to={link.url}
                        className={`transition-all duration-200 hover:text-primary ${location.pathname === link.url
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
          ))}
        </div>

        {/* Bottom */}
        <div className="border-t border-gray-200 mt-12 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} DigiShop. All rights reserved.
          </p>

          <div className="flex items-center gap-6 text-sm">
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