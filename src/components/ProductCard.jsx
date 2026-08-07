import React from "react";
import { assets } from "../assets/assets";
import { useAppContext } from "../context/AppContext";

const ProductCard = ({ item }) => {
  if (!item) return null;

  const { currency, navigate } = useAppContext();

  const { productId, name, categoryId, rating = 4, variant, totalColors } = item;

  if (!variant) return null;

  const firstImage =
    variant.images?.[variant.thumbnailIndex || 0] ||
    variant.images?.[0] ||
    "";

  if (!variant.sizes?.length) return null;

  // Calculate prices for all sizes
  const prices = variant.sizes.map((size) => {
    const finalPrice =
      size.offerPrice > 0
        ? size.price - (size.price * size.offerPrice) / 100
        : size.price;

    return {
      originalPrice: size.price,
      finalPrice,
      discount: size.offerPrice || 0,
    };
  });

  const minFinalPrice = Math.min(...prices.map((p) => p.finalPrice));
  const minOriginalPrice = Math.min(...prices.map((p) => p.originalPrice));
  const maxDiscount = Math.max(...prices.map((p) => p.discount));

  // Placeholder review count
  const reviewCount = item.reviewCount ?? Math.round(rating * 20);

  return (
    <div
      onClick={() => {
        navigate(
          `/products/${categoryId?.name?.toLowerCase()}/${productId}?variant=${variant._id}`
        );
        window.scrollTo(0, 0);
      }}
      className="group cursor-pointer w-full min-w-0"
    >
      {/* Image */}
      {/* Image */}
      <div className="relative w-full aspect-[3/4] sm:aspect-[4/5] bg-slate-100 rounded-lg overflow-hidden">
        <img
          src={firstImage}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {totalColors > 1 && (
          <span className="absolute bottom-2 right-2 bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded-md shadow-sm">
            +{totalColors} colors
          </span>
        )}
      </div>

      {/* Content */}
      <div className="pt-3">
        <h3 className="text-[11px] sm:text-xs md:text-sm font-semibold uppercase tracking-wide text-slate-800 line-clamp-1">
          {name}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-1 mt-1.5">
          {Array(5)
            .fill("")
            .map((_, i) => (
              <img
                key={i}
                src={
                  i < Math.round(rating)
                    ? assets.star_icon
                    : assets.star_dull_icon
                }
                className="w-3"
                alt=""
              />
            ))}

          <span className="text-xs text-slate-500 ml-1">
            {reviewCount} reviews
          </span>
        </div>

        {/* Price */}
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          <span className="text-sm sm:text-base font-bold text-slate-900">
            {currency}
            {minFinalPrice.toFixed(2)}
          </span>

          {maxDiscount > 0 && (
            <>
              <span className="text-xs text-slate-400 line-through">
                {currency}
                {minOriginalPrice.toFixed(2)}
              </span>

              <span className="text-xs font-semibold text-green-600">
                {maxDiscount}% OFF
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;