import React, { useEffect, useState } from "react";
import ProductCard from "./ProductCard";
import { useAppContext } from "../context/AppContext";

const BestSeller = () => {
  const { products = [] } = useAppContext();
  const [bestSellerVariants, setBestSellerVariants] = useState([]);

  useEffect(() => {
    if (!Array.isArray(products)) return;

    let finalList = [];

    products
      .filter((product) => product?.isActive)
      .forEach((product) => {
        if (!Array.isArray(product?.variants) || product.variants.length === 0)
          return;

        // 🔥 isSeprate = TRUE → show ALL variants
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

        // 🔥 isSeprate = FALSE → show ONLY ONE variant
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

    setBestSellerVariants(finalList.slice(0, 8));
  }, [products]);

  return (
    <div className="mt-16">
      {/* ===== Heading ===== */}
      <p className="text-2xl md:text-3xl font-medium">Best Sellers</p>

      {/* ===== Grid ===== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-6 mt-6">
        {bestSellerVariants.map((item, index) => (
          <ProductCard
            key={`${item.productId}-${item.variant?._id || index}`}
            item={item}
          />
        ))}
      </div>
    </div>
  );
};

export default BestSeller;
