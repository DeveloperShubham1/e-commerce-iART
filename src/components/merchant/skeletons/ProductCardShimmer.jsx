import React from "react";

const ProductCardShimmer = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Image shimmer */}
      <div className="relative aspect-square bg-green-200 overflow-hidden">
        <div className="absolute inset-0 shimmer"></div>
      </div>

      {/* Content shimmer */}
      <div className="p-4 space-y-3">
        <div className="relative h-4 bg-green-200 rounded w-3/4 overflow-hidden">
          <div className="absolute inset-0 shimmer"></div>
        </div>

        <div className="relative h-3 bg-green-200 rounded w-1/2 overflow-hidden">
          <div className="absolute inset-0 shimmer"></div>
        </div>

        <div className="flex gap-3 mt-4">
          <div className="relative h-3 bg-green-200 rounded w-12 overflow-hidden">
            <div className="absolute inset-0 shimmer"></div>
          </div>
          <div className="relative h-3 bg-green-200 rounded w-12 overflow-hidden">
            <div className="absolute inset-0 shimmer"></div>
          </div>
        </div>

        <div className="flex justify-between items-center mt-4">
          <div className="relative h-5 bg-green-200 rounded w-16 overflow-hidden">
            <div className="absolute inset-0 shimmer"></div>
          </div>
          <div className="relative h-5 bg-green-200 rounded w-14 overflow-hidden">
            <div className="absolute inset-0 shimmer"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCardShimmer;
