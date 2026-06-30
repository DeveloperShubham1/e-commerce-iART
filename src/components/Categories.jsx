import React, { useEffect, useState } from "react";
import { useAppContext } from "../context/AppContext";
import { toast } from "react-toastify";

const Categories = () => {
  const { axios, navigate } = useAppContext();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Get the merchant ID from frontend .env
  const merchantId =  import.meta.env.VITE_MERCHANT_ID;

  const fetchCategories = async () => {
    try {
      setLoading(true);

      // Call backend API with merchantId (for public view)
      const { data } = await axios.get(
        `/api/user/categories?merchantId=${merchantId}`
      );

      if (data.success) {
        setCategories(data.categories);
      } else {
        toast.error(data.message || "Failed to load categories");
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Failed to fetch categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  if (loading) {
    return (
      <div className="mt-16 text-center text-gray-500 animate-pulse">
        Loading categories...
      </div>
    );
  }

  return (
    <div className="mt-16">
      <p className="text-2xl md:text-3xl font-medium">Categories</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 mt-6 gap-6">
        {categories.length > 0 ? (
          categories.map((category, index) => (
            <div
              key={category._id || index}
              className="group cursor-pointer py-5 px-3 gap-2 rounded-lg flex flex-col justify-center items-center hover:shadow-md transition"
              style={{ backgroundColor: "#f9fafb" }}
              onClick={() => {
                navigate(`/products/${category.name.toLowerCase()}`);
                scrollTo(0, 0);
              }}
            >
              <img
                src={
                  category.image?.url ||
                  "/placeholder.png" /* fallback placeholder */
                }
                alt={category.name}
                className="group-hover:scale-110 transition-transform duration-300 max-w-28 h-28 object-contain"
              />
              <p className="text-sm font-medium text-gray-800 mt-2">
                {category.name}
              </p>
            </div>
          ))
        ) : (
          <p className="col-span-full text-gray-500 text-center">
            No categories found
          </p>
        )}
      </div>
    </div>
  );
};

export default Categories;
