import React from "react";
import { assets } from "../assets/assets";
import { useAppContext } from "../context/AppContext";

const ProductCard = ({ item }) => {
  if (!item) return null;

  const { currency, navigate } = useAppContext();

  const { productId, name, categoryId, rating = 4, variant } = item;

  if (!variant) return null;

  const firstImage =
    variant.images?.[variant.thumbnailIndex || 0] || variant.images?.[0] || "";

  const prices =
    variant.sizes?.map((size) => {
      const discount = size.offerPrice || 0;
      const discountedPrice =
        discount > 0 ? size.price - (size.price * discount) / 100 : size.price;

      return {
        regularPrice: size.price,
        offerPrice: discountedPrice,
        discount,
      };
    }) || [];

  if (!prices.length) return null;

  const minOfferPrice = Math.min(...prices.map((p) => p.offerPrice));

  // Placeholder review count derived from rating so it always renders something sensible
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
      <div className="relative w-full aspect-[3/4] sm:aspect-[4/5] bg-slate-100 rounded-lg overflow-hidden">
        <img
          src={firstImage}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
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
                src={i < Math.round(rating) ? assets.star_icon : assets.star_dull_icon}
                className="w-3"
                alt=""
              />
            ))}
          <span className="text-xs text-slate-500 ml-1">
            {reviewCount} reviews
          </span>
        </div>

        {/* Price */}
        <p className="mt-1.5 text-sm sm:text-base font-bold text-slate-900">
          {currency}
          {minOfferPrice.toFixed(0)}
        </p>
      </div>
    </div>
  );
};

export default ProductCard;