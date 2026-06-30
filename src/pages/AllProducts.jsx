import React, { useEffect, useState } from "react";
import { useAppContext } from "../context/AppContext";
import ProductCard from "../components/ProductCard";

const AllProducts = () => {
  const { products = [], searchQuery } = useAppContext();
  const [variantList, setVariantList] = useState([]);

  useEffect(() => {
    if (!Array.isArray(products)) return;

    let finalList = [];

    products
      .filter((product) => product?.isActive)
      .forEach((product) => {
        if (!Array.isArray(product?.variants) || product.variants.length === 0)
          return;

        // 🔥 CASE 1: Separate product → show ALL variants
        if (product.isSeprate) {
          product.variants.forEach((variant) => {
            if (!variant) return;

            finalList.push({
              productId: product._id,
              name: product.name,
              brand: product.brand,
              categoryId: product.categoryId,
              subcategoryId: product.subcategoryId,
              rating: 4,
              variant,
              isSeprate: true,
            });
          });
        }

        // 🔥 CASE 2: Normal product → show ONLY ONE variant
        else {
          finalList.push({
            productId: product._id,
            name: product.name,
            brand: product.brand,
            categoryId: product.categoryId,
            subcategoryId: product.subcategoryId,
            rating: 4,
            variant: product.variants[0], // 👈 first variant only
            isSeprate: false,
          });
        }
      });

    // 🔍 Search filter (SAFE)
    const query =
      typeof searchQuery === "string" ? searchQuery.trim().toLowerCase() : "";

    if (query.length > 0) {
      finalList = finalList.filter((item) =>
        item.name?.toLowerCase().includes(query)
      );
    }

    setVariantList(finalList);
  }, [products, searchQuery]);

  return (
    <div className="mt-16 flex flex-col">
      {/* ===== Header ===== */}
      <div className="flex flex-col items-end w-max">
        <p className="text-2xl font-medium uppercase">All Products</p>
        <div className="w-16 h-0.5 bg-primary rounded-full" />
      </div>

      {/* ===== Products Grid ===== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-6 mt-6">
        {variantList.map((item, index) => (
          <ProductCard
            key={`${item.productId}-${item.variant?._id || index}`}
            item={item}
          />
        ))}
      </div>
    </div>
  );
};

export default AllProducts;
