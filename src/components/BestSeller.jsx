import React, { useEffect, useRef, useState } from "react";
import ProductCard from "./ProductCard";
import { useAppContext } from "../context/AppContext";
import { ShoppingBag } from "lucide-react";

const BestSeller = ({ data: products, loading, title, desc }) => {
  const [bestSellerVariants, setBestSellerVariants] = useState([]);
  const [isInitializing, setIsInitializing] = useState(true);
  const scrollRef = useRef(null);

  const scrollByAmount = (direction) => {
    if (!scrollRef.current) return;
    const cardWidth = scrollRef.current.firstChild
      ? scrollRef.current.firstChild.offsetWidth + 16
      : 300;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -cardWidth * 2 : cardWidth * 2,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    if (!Array.isArray(products)) {
      setIsInitializing(false);
      return;
    }

    const finalList = [];

    products
      .filter((product) => product?.isActive)
      .forEach((product) => {
        if (!Array.isArray(product?.variants) || product.variants.length === 0)
          return;

        // isSeprate = TRUE -> show ALL variants
        if (product.isSeprate) {
          product.variants.forEach((variant) => {
            if (!variant) return;

            finalList.push({
              productId: product._id,
              name: product.name,
              brand: product.brand,
              categoryId: product.categoryId,
              subcategoryId: product.subcategoryId,
              rating: product.rating || 4.8,
              variant,
              isSeprate: true,
              totalColors: product.variants.length
            });
          });
        }
        // isSeprate = FALSE -> show ONLY ONE variant
        else {
          finalList.push({
            productId: product._id,
            name: product.name,
            brand: product.brand,
            categoryId: product.categoryId,
            subcategoryId: product.subcategoryId,
            rating: product.rating || 4.8,
            variant: product.variants[0],
            isSeprate: false,
            totalColors: product.variants.length
          });
        }
      });

    setBestSellerVariants(finalList.slice(0, 10));
    setIsInitializing(false);
  }, [products]);

  return (
    <section className="mt-16 sm:mt-20 max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Heading */}
      <div className="text-center mb-8 sm:mb-10">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-[var(--color-primary)] tracking-tight">
          {title}
        </h2>
        <p className="mt-2 text-sm sm:text-base font-semibold text-gray-800">
          {desc}
        </p>
      </div>

      {/* Product Showcase Scrollable Row with Arrows */}
      {isInitializing || loading ? (
        <div className="flex gap-4 overflow-x-auto pb-2 px-1 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
          {[...Array(8)].map((_, index) => (
            <div key={index} className="animate-pulse w-[45%] xs:w-[42%] sm:w-[32%] md:w-[24%] lg:w-[19%] xl:w-[16%] min-w-[150px] flex-shrink-0">
              <div className="w-full aspect-[3/4] sm:aspect-[4/5] bg-slate-100 rounded-lg" />
              <div className="h-3 bg-slate-100 rounded-md w-4/5 mt-3" />
              <div className="h-3 bg-slate-100 rounded-md w-1/2 mt-2" />
              <div className="h-4 bg-slate-100 rounded-md w-1/3 mt-2" />
            </div>
          ))}
        </div>
      ) : bestSellerVariants.length > 0 ? (
        <div className="relative">
          {/* Left arrow - hidden on small screens */}
          {bestSellerVariants.length > 6 && (
            <button
              type="button"
              onClick={() => scrollByAmount("left")}
              aria-label="Scroll left"
              className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10
                         w-10 h-10 rounded-full bg-black/70 hover:bg-black text-white
                         items-center justify-center transition"
            >
              &#8592;
            </button>
          )}

          {/* Scrollable row */}
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto scroll-smooth pb-2 px-1
                       snap-x snap-mandatory
                       [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          >
            {bestSellerVariants.map((item, index) => (
              <div
                key={`${item.productId}-${item.variant?._id || index}`}
                className="w-[45%] xs:w-[42%] sm:w-[32%] md:w-[24%] lg:w-[19%] xl:w-[16%] min-w-[150px] flex-shrink-0 snap-start"
              >
                <ProductCard item={item} />
              </div>
            ))}
          </div>

          {/* Right arrow - hidden on small screens */}
          {bestSellerVariants.length > 6 && (
            <button
              type="button"
              onClick={() => scrollByAmount("right")}
              aria-label="Scroll right"
              className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10
                         w-10 h-10 rounded-full bg-black/70 hover:bg-black text-white
                         items-center justify-center transition"
            >
              &#8594;
            </button>
          )}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="w-14 h-14 rounded-2xl bg-pink-50 text-pink-500 flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            No best sellers currently featured
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
            Our catalog updates dynamically based on customer demand. Check back
            shortly for restocks.
          </p>
        </div>
      )}
    </section>
  );
};

export default BestSeller;