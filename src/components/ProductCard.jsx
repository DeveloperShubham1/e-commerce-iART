import React from "react";
import { assets } from "../assets/assets";
import { useAppContext } from "../context/AppContext";

const ProductCard = ({ item }) => {
  // 🛡️ HARD GUARD (prevents crash)
  if (!item) return null;

  const { currency, navigate } = useAppContext();

  const { productId, name, brand, categoryId, rating = 4, variant } = item;

  if (!variant) return null;

  const firstImage = variant.images?.[variant?.thumbnailIndex] || "";

  // Pricing from variant sizes
  const prices =
    variant.sizes?.map((size) => {
      const discountedPrice = size.offerPrice
        ? size.price - Math.round((size.price * size.offerPrice) / 100)
        : size.price;

      return {
        price: size.price,
        discountedPrice,
        discountPercent: size.offerPrice || 0,
      };
    }) || [];

  if (!prices.length) return null;

  const minRegularPrice = Math.min(...prices.map((p) => p.price));
  const minOfferPrice = Math.min(...prices.map((p) => p.discountedPrice));
  const maxDiscount = Math.max(...prices.map((p) => p.discountPercent));

  return (
    <div
      onClick={() => {
        navigate(
          `/products/${categoryId?.name?.toLowerCase()}/${productId}?variant=${variant._id
          }`
        );
        window.scrollTo(0, 0);
      }}
      className="group transition-all duration-300 cursor-pointer"
    >
      {/* Image */}
      <div className="w-full h-64 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
        <img
          src={firstImage}
          alt={name}
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      {/* Content */}
      <div className="mt-2 text-gray-600 text-sm">
        <p className="truncate">{brand}</p>
        <p className="font-medium text-gray-800 truncate">{name}</p>

        {/* Rating */}
        <div className="flex items-center gap-1 mt-1">
          {Array(5)
            .fill("")
            .map((_, i) => (
              <img
                key={i}
                className="w-3"
                src={i < rating ? assets.star_icon : assets.star_dull_icon}
                alt=""
              />
            ))}
          <span className="text-xs">({rating})</span>
        </div>

        {/* Price */}
        <div className="mt-2">
          <p className="text-primary font-semibold">
            {currency}
            {minOfferPrice}
            {minRegularPrice > minOfferPrice && (
              <>
                <span className="line-through text-gray-400 text-xs ml-1">
                  {currency}
                  {minRegularPrice}
                </span>
                <span className="text-green-600 text-xs ml-1">
                  ({maxDiscount}% OFF)
                </span>
              </>
            )}
          </p>
        </div>

        {/* Color */}
        <div className="flex items-center gap-1 mt-2">
          <span
            className="w-4 h-4 rounded-full border"
            style={{ backgroundColor: variant.colorCode }}
          />
          <span className="text-xs">{variant.color}</span>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
