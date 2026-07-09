import { Link, NavLink, Outlet } from "react-router-dom";
import { assets } from "../../assets/assets";
import { useAppContext } from "../../context/AppContext";
import { toast } from "react-toastify";
import reportIcon from "../../assets/reportIcon.svg";
import instagram from "../../assets/instagram.svg";
import userGear from "../../assets/user-gear.svg";

const SellerLayout = () => {
  const { axios, navigate, setIsMerchant, merchantData } = useAppContext();

  const sidebarLinks = [
    { name: "Add Product", path: "/dashboard", icon: assets.add_icon },
    {
      name: "Product List",
      path: "/product-list",
      icon: assets.product_list_icon,
    },
    { name: "Orders", path: "/orders", icon: assets.order_icon },
    {
      name: "Mange Categories",
      path: "/manage-categories",
      icon: assets.categories_icon,
    },
    {
      name: "Manage Sub Categories",
      path: "/manage-subcategories",
      icon: assets.sub_categories_icon,
    },
    { name: "Settings", path: "/settings", icon: assets.order_icon },
    { name: "Report", path: "/report", icon: reportIcon },
    { name: "Instagram Products", path: "/instagram-products", icon: instagram },
    { name: "Profile", path: "/profile", icon: userGear },
  ];

  const logout = async () => {
    try {
      const { data } = await axios.post("/api/merchant/logout");
      if (data.success) {
        toast.success(data.message);
        setIsMerchant(null);
        navigate("/merchant");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };
  return (
    <>
      {/* ===== HEADER ===== */}
      <div className="sticky top-0 z-50 flex items-center justify-between h-16 px-4 md:px-8 border-b border-gray-300 bg-white">
        <Link to="/dashboard" className="font-semibold text-lg">
          Admin
        </Link>

        <div className="flex items-center gap-3 md:gap-5 text-gray-600">
          <p className="hidden sm:block">Hi! {merchantData?.OwnerName}</p>
          <button
            onClick={logout}
            className="border rounded-full text-sm px-3 py-1 hover:bg-gray-100 transition"
          >
            Logout
          </button>
        </div>
      </div>

      {/* ===== BODY ===== */}
      {/* ===== BODY ===== */}
      <div className="flex h-[calc(100vh-64px)] overflow-hidden">
        {/* ===== SIDEBAR ===== */}
        <aside className="w-16 md:w-60 border-r border-gray-300 bg-white flex-shrink-0 overflow-y-auto">
          {sidebarLinks.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.path === "/dashboard"}
              className={({ isActive }) =>
                `
          flex flex-col md:flex-row items-center justify-center md:justify-start
          gap-1 md:gap-3
          py-3 px-2 md:px-5
          text-sm md:text-base
          transition-all duration-200
          ${isActive
                  ? "bg-primary/10 text-primary border-r-4 border-primary"
                  : "text-gray-600 hover:bg-gray-100"
                }
        `
              }
            >
              <img
                src={item.icon}
                alt={item.name}
                className="w-6 h-6 md:w-7 md:h-7"
              />

              <p className="hidden md:block whitespace-nowrap">{item.name}</p>

              <span className="md:hidden text-[10px] text-gray-500 text-center">
                {item.name}
              </span>
            </NavLink>
          ))}
        </aside>

        {/* ===== MAIN CONTENT ===== */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </>
  );
};

export default SellerLayout;


