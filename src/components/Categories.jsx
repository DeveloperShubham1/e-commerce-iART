import React, { useEffect, useRef, useState } from "react";
import { useAppContext } from "../context/AppContext";
import { toast } from "react-toastify";

const Categories = ({ data: categories, loading }) => {
  const { axios, navigate } = useAppContext();

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

  if (loading) {
    return (
      <div className="mt-16 text-center text-gray-500 animate-pulse">
        Loading categories...
      </div>
    );
  }

  return (
    <div className="mt-16 max-w-8xl w-full mx-auto px-4">
      {/* Heading */}
      <div className="text-center mb-8">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-[var(--color-primary)] tracking-tight">
          Categories
        </h2>
        <p className="mt-2 text-sm sm:text-base font-semibold text-gray-800 italic">
          Browse by style, silhouette, and mood – shop your perfect vibe.
        </p>
      </div>

      {categories.length > 0 ? (
        <div className="relative">
          {/* Left arrow - hidden on small screens */}
          {categories.length > 6 && (
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
            {categories.map((category, index) => (
              <div
                key={category._id || index}
                onClick={() => {
                  navigate(`/products/${category._id}?name=${encodeURIComponent(category.name)}`);
                  window.scrollTo(0, 0);
                }}
                className="group cursor-pointer relative flex-shrink-0 snap-start
                           w-[45%] xs:w-[42%] sm:w-[32%] md:w-[24%] lg:w-[19%] xl:w-[16%]
                           min-w-[150px] aspect-[3/4] rounded-xl overflow-hidden
                           bg-gray-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <img
                  src={category.image?.url || "/placeholder.png"}
                  alt={category.name}
                  className="w-full h-full object-cover group-hover:scale-105
                             transition-transform duration-300"
                />

                {/* Label pill */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-[85%]">
                  <div className="bg-white rounded-md shadow-sm py-2 px-2 text-center">
                    <p className="text-xs sm:text-sm font-bold tracking-wide text-gray-900 uppercase truncate">
                      {category.name}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Right arrow - hidden on small screens */}
          {categories.length > 6 && (
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
        <p className="text-gray-500 text-center">No categories found</p>
      )}
    </div>
  );
};

export default Categories;