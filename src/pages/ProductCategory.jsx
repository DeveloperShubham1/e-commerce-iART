import React, { useEffect, useState } from "react";
import { useAppContext } from "../context/AppContext";
import { useParams } from "react-router-dom";
import { categories } from "../assets/assets";
import ProductCard from "../components/ProductCard";

const ProductCategory = () => {
  const { products = [] } = useAppContext();
  const { category } = useParams();

  const [variantList, setVariantList] = useState([]);

  const searchCategory = categories.find(
    (item) => item.path.toLowerCase() === category.toLowerCase()
  );

  useEffect(() => {
    if (!Array.isArray(products)) return;

    let variants = [];

    products
      .filter(
        (product) =>
          product?.isActive &&
          product?.categoryId?.name?.toLowerCase().trim() ===
            category.toLowerCase().trim()
      )
      .forEach((product) => {
        if (!Array.isArray(product?.variants)) return;

        product.variants.forEach((variant) => {
          if (!variant) return;

          variants.push({
            productId: product._id,
            name: product.name,
            brand: product.brand,
            categoryId: product.categoryId,
            subcategoryId: product.subcategoryId,
            rating: 4,
            variant,
          });
        });
      });

    setVariantList(variants);
  }, [products, category]);

  return (
    <div className="mt-16">
      {searchCategory && (
        <div className="flex flex-col items-end w-max">
          <p className="text-2xl font-medium uppercase">
            {searchCategory.text}
          </p>
          <div className="w-16 h-0.5 bg-primary rounded-full"></div>
        </div>
      )}

      {variantList.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-6 mt-6">
          {variantList.map((item, index) => (
            <ProductCard key={`${item.productId}-${index}`} item={item} />
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center h-[60vh]">
          <p className="text-2xl font-medium text-primary">
            No products found in this category.
          </p>
        </div>
      )}
    </div>
  );
};

export default ProductCategory;
