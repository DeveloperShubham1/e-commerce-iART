import React from "react";
import { assets } from "../assets/assets";
import { useAppContext } from "../context/AppContext";

const ProductCard = ({ item }) => {
  if (!item) return null;

  const { currency, navigate } = useAppContext();

  const {
    productId,
    name,
    brand,
    categoryId,
    rating = 4,
    variant,
  } = item;

  if (!variant) return null;

  // First image
  const firstImage =
    variant.images?.[variant.thumbnailIndex || 0] ||
    variant.images?.[0] ||
    "";

  // Prices
  const prices =
    variant.sizes?.map((size) => {
      const discount = size.offerPrice || 0;

      const discountedPrice =
        discount > 0
          ? size.price - (size.price * discount) / 100
          : size.price;

      return {
        regularPrice: size.price,
        offerPrice: discountedPrice,
        discount,
      };
    }) || [];

  if (!prices.length) return null;

  const minRegularPrice = Math.min(
    ...prices.map((p) => p.regularPrice)
  );

  const minOfferPrice = Math.min(
    ...prices.map((p) => p.offerPrice)
  );

  const maxDiscount = Math.max(
    ...prices.map((p) => p.discount)
  );

  return (
    <div
      onClick={() => {
        navigate(
          `/products/${categoryId?.name?.toLowerCase()}/${productId}?variant=${variant._id}`
        );
        window.scrollTo(0, 0);
      }}
      className="group cursor-pointer bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all duration-300"
    >
      {/* Image */}
      <div className="relative w-full h-72 bg-slate-100 overflow-hidden">
        {maxDiscount > 0 && (
          <span className="absolute top-3 right-3 z-10 bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            {maxDiscount}% OFF
          </span>
        )}

        <img
          src={firstImage}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="text-xs uppercase tracking-wider text-slate-400">
          {brand}
        </p>

        <h3 className="text-sm font-semibold text-slate-800 line-clamp-1 mt-1">
          {name}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-1 mt-2">
          {Array(5)
            .fill("")
            .map((_, i) => (
              <img
                key={i}
                src={i < rating ? assets.star_icon : assets.star_dull_icon}
                className="w-3"
                alt=""
              />
            ))}

          <span className="text-xs text-slate-500">
            ({rating})
          </span>
        </div>

        {/* Price */}
        <div className="mt-3 flex items-center gap-2">
          <span className="text-lg font-bold text-slate-900">
            {currency}
            {minOfferPrice.toFixed(0)}
          </span>

          {maxDiscount > 0 && (
            <>
              <span className="text-sm line-through text-slate-400">
                {currency}
                {minRegularPrice}
              </span>

             
            </>
          )}
        </div>

        {/* Color */}
        {variant.color && (
          <div className="flex items-center gap-2 mt-3">
            <span
              className="w-4 h-4 rounded-full border"
              style={{ backgroundColor: variant.colorCode }}
            />

            <span className="text-xs text-slate-500">
              {variant.color}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCard;