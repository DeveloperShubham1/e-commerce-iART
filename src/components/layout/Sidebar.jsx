import { NavLink } from "react-router-dom";
import Logo from "../../../public/DigiShopTextLogo.png"
import {
  LayoutDashboard,
  Store,
  User,
  Package,
  ShoppingCart,
  Settings,
  X,
  ShieldCheck,
} from "lucide-react";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/merchants", label: "Merchants", icon: Store },
  { to: "/profile", label: "My Profile", icon: User },
  // { to: "/products", label: "Products", icon: Package },
  // { to: "/orders", label: "Orders", icon: ShoppingCart },
];

const Sidebar = ({ isOpen, onClose }) => {
  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${isActive
      ? "bg-primary-600 text-white shadow-sm"
      : "text-slate-600 hover:bg-slate-100"
    }`;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-white shadow-sm">
              <img
                src={Logo}
                alt="FAB Logo"
                className="h-8 w-8 object-contain"
              />
            </div>

            <div>
              <p className="text-sm font-bold leading-tight text-slate-800">
                Super Admin
              </p>
              <p className="text-xs leading-tight text-slate-400">
                Control Panel
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {/* Nav */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Menu</p>
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={linkClass} onClick={onClose}>
              <item.icon className="h-4.5 w-4.5 h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-slate-200 p-4">
          <div className="rounded-lg bg-gradient-to-br from-primary-50 to-accent-50 p-4">
            <p className="text-sm font-semibold text-slate-700">Need help?</p>
            <p className="mt-1 text-xs text-slate-500">Check our documentation or contact support.</p>
            <button className="mt-3 text-xs font-semibold text-primary-600 hover:text-primary-700">
              View docs →
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
