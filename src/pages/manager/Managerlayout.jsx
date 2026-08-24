import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { assets } from "../../assets/assets";
import { useAppContext } from "../../context/AppContext";
import reportIcon from "../../assets/reportIcon.svg";
import instagram from "../../assets/instagram.svg";
import userGear from "../../assets/user-gear.svg";
import mLogo from "../../assets/textLogo.png";
import collectionsIcon from "../../assets/collections.svg";
import customer from "../../assets/customer.svg"


import { ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import Loader from "@/components/Loader";

// Must match the role name that gets unrestricted access in MANAGER_ROUTES / the backend Role model.
const FULL_ACCESS_ROLE = "super_admin";

// Same paths + permission keys as the manager routes inside App.jsx's merged
// isMerchantBuild block, plus label/icon for the sidebar.
// permission: null => visible to any logged-in manager, no permission check.
const NAV_GROUPS = [
  {
    label: "Catalog",
    items: [
      { name: "Dashboard", path: "/dashboard", icon: assets.add_icon, permission: "product.create" },
      { name: "Product List", path: "/product-list", icon: assets.product_list_icon, permission: "product.view" },
      { name: "Categories", path: "/manage-categories", icon: assets.categories_icon, permission: "category.view" },
      { name: "Sub Categories", path: "/manage-subcategories", icon: assets.sub_categories_icon, permission: "sub_category.view" },
      { name: "Collections", path: "/collections", icon: collectionsIcon, permission: "collection.view" },
    ],
  },
  {
    label: "Sales & Customers",
    items: [
      { name: "Customers", path: "/customer", icon: customer, permission: "customer.view" },
      { name: "Orders", path: "/orders", icon: assets.order_icon, permission: "order.view" },
      { name: "Report", path: "/report", icon: reportIcon, permission: "reports.view" },
    ],
  },
  {
    label: "Account",
    items: [
      // { name: "Settings", path: "/settings", icon: assets.order_icon, permission: "settings.edit" },
      //   { name: "Profile", path: "/profile", icon: userGear, permission: null },
    ],
  },
];

const ManagerLayout = ({ authLoading }) => {
  const { managerData, managerPermissions = [], managerLogout } = useAppContext();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const hasPermission = (permission) => {
    if (!permission) return true;
    if (managerData?.role?.name === FULL_ACCESS_ROLE) return true;
    return managerPermissions.includes(permission);
  };

  // Filter each group down to items this manager can actually see, then drop empty groups
  const navGroups = authLoading
    ? []
    : NAV_GROUPS.map((group) => ({
      ...group,
      items: group.items.filter((item) => hasPermission(item.permission)),
    })).filter((group) => group.items.length > 0);

  const logout = async () => {
    await managerLogout();
  };

  const linkClass = ({ isActive }) =>
    `group flex items-center gap-3 rounded-lg mx-2 px-3 py-2.5 text-sm transition-all duration-200 ${isActive
      ? "bg-primary text-white shadow-sm"
      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
    }`;

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-gray-50">
      {/* ===== HEADER ===== */}
      <header className="sticky top-0 z-50 flex items-center justify-between h-16 px-4 md:px-6 border-b border-gray-200 bg-white shrink-0">
        <div className="flex items-center gap-3">
          {/* Mobile drawer toggle */}
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden p-2 -ml-2 rounded-lg hover:bg-gray-100"
            aria-label="Open menu"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
            </svg>
          </button>

          <Link to="/dashboard" className="flex items-center gap-3">
            <img src={mLogo} alt="Manager Logo" className="h-10 w-auto object-contain" />
          </Link>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <div className="hidden sm:flex flex-col items-end leading-tight">
            <p className="text-sm font-medium text-gray-800">
              {managerData?.name || "Manager"}
            </p>
            <p className="text-xs text-gray-400">
              {managerData?.role?.label || "Manager"}
            </p>
          </div>

          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm shrink-0">
            {managerData?.name?.charAt(0)?.toUpperCase() || "M"}
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-1.5 border border-gray-200 rounded-full text-sm px-3 py-1.5 text-gray-600 hover:bg-gray-100 hover:text-red-500 hover:border-red-200 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* ===== BODY ===== */}
      <div className="flex flex-1 min-h-0 min-w-0 overflow-hidden">
        {/* ===== DESKTOP SIDEBAR ===== */}
        <aside
          className={`hidden md:flex flex-col border-r border-gray-200 bg-white shrink-0 transition-all duration-300 ${collapsed ? "w-20" : "w-64"
            }`}
        >
          <nav className="flex-1 overflow-y-auto py-4">
            {navGroups.map((group) => (
              <div key={group.label} className="mb-5">
                {!collapsed && (
                  <p className="px-5 mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                    {group.label}
                  </p>
                )}
                <div className="flex flex-col gap-1">
                  {group.items.map((item) => (
                    <NavLink
                      key={item.name}
                      to={item.path}
                      end={item.path === "/dashboard"}
                      className={linkClass}
                      title={collapsed ? item.name : undefined}
                    >
                      <img
                        src={item.icon}
                        alt=""
                        className="w-5 h-5 shrink-0 group-[.bg-primary]:brightness-0 group-[.bg-primary]:invert"
                      />
                      {!collapsed && (
                        <span className="whitespace-nowrap">{item.name}</span>
                      )}
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="flex items-center justify-center gap-2 border-t border-gray-100 py-3 text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span className="text-xs">Collapse</span>
              </>
            )}
          </button>
        </aside>

        {/* ===== MOBILE DRAWER ===== */}
        <div
          className={`fixed inset-0 z-[60] md:hidden ${mobileOpen ? "visible" : "invisible"
            }`}
        >
          <div
            onClick={() => setMobileOpen(false)}
            className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${mobileOpen ? "opacity-100" : "opacity-0"
              }`}
          />
          <aside
            className={`absolute top-0 left-0 h-full w-72 bg-white shadow-xl flex flex-col transition-transform duration-300 ease-out ${mobileOpen ? "translate-x-0" : "-translate-x-full"
              }`}
          >
            <div className="flex items-center justify-between h-16 px-5 border-b border-gray-100">
              <span className="font-semibold text-lg text-gray-800">Manager</span>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1 rounded-lg hover:bg-gray-100"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto py-4">
              {navGroups.map((group) => (
                <div key={group.label} className="mb-5">
                  <p className="px-5 mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                    {group.label}
                  </p>
                  <div className="flex flex-col gap-1">
                    {group.items.map((item) => (
                      <NavLink
                        key={item.name}
                        to={item.path}
                        end={item.path === "/dashboard"}
                        onClick={() => setMobileOpen(false)}
                        className={linkClass}
                      >
                        <img src={item.icon} alt="" className="w-5 h-5 shrink-0" />
                        <span>{item.name}</span>
                      </NavLink>
                    ))}
                  </div>
                </div>
              ))}
            </nav>
          </aside>
        </div>

        {/* ===== MAIN CONTENT ===== */}
        <main className="flex-1 min-h-0 min-w-0 overflow-y-auto p-4 md:p-6">
          {authLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader />
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  );
};

export default ManagerLayout;