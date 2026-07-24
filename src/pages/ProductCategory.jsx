import React, { useEffect, useMemo, useRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { categories } from "../assets/assets";
import ProductCard from "../components/ProductCard";
import { getProducts } from "../api"

const LIMIT = 10;

// ---------------------------------------------------------------------------
// Skeleton placeholder — mirrors ProductCard's rough shape (image + a couple
// of text lines) so the grid doesn't visibly "jump" once real cards load in.
// ---------------------------------------------------------------------------
const ProductCardSkeleton = () => (
  <div className="animate-pulse">
    <div className="w-full aspect-[3/4] bg-gray-200 rounded-lg" />
    <div className="mt-2 h-3.5 bg-gray-200 rounded w-3/4" />
    <div className="mt-1.5 h-3 bg-gray-200 rounded w-1/2" />
    <div className="mt-2 h-4 bg-gray-200 rounded w-1/3" />
  </div>
);

const ProductCategory = () => {
  const { categoryId } = useParams();
  const merchantId = import.meta.env.VITE_MERCHANT_ID;

  const sentinelRef = useRef(null);

  const searchCategory = categories.find(
    (item) => item.path.toLowerCase() === categoryId.toLowerCase()
  );

  /* ---------------- INFINITE QUERY ---------------- */
  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    isError,
    error,
  } = useInfiniteQuery({
    queryKey: ["products", merchantId, "category", categoryId],
    queryFn: ({ pageParam = 1 }) =>
      getProducts({
        merchantId,
        categoryId,
        page: pageParam,
        limit: LIMIT,
      }),
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    enabled: !!merchantId && !!categoryId,
  });

  /* ---------------- SURFACE FETCH ERRORS ---------------- */
  useEffect(() => {
    if (isError) {
      toast.error(
        error?.response?.data?.message || error?.message || "Failed to fetch products"
      );
    }
  }, [isError, error]);

  /* ---------------- INFINITE SCROLL TRIGGER ---------------- */
  useEffect(() => {
    if (!sentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "300px" }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  /* ---------------- FLATTEN + EXPAND VARIANTS ---------------- */
  const rawProducts = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.products || []);
  }, [data]);

  const variantList = useMemo(() => {
    if (!Array.isArray(rawProducts)) return [];

    const finalList = [];

    rawProducts
      .filter((product) => product?.isActive)
      .forEach((product) => {
        if (!Array.isArray(product?.variants) || product.variants.length === 0)
          return;

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
        } else {
          finalList.push({
            productId: product._id,
            name: product.name,
            brand: product.brand,
            categoryId: product.categoryId,
            subcategoryId: product.subcategoryId,
            rating: 4,
            variant: product.variants[0],
            isSeprate: false,
          });
        }
      });

    return finalList;
  }, [rawProducts]);

  return (
    <div className="mt-16 px-5 sm:px-10">
      {searchCategory && (
        <div className="flex flex-col items-end w-max">
          <p className="text-2xl font-medium uppercase">
            {searchCategory.text}
          </p>
          <div className="w-16 h-0.5 bg-primary rounded-full"></div>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-6 mt-6">
          {Array.from({ length: LIMIT }).map((_, i) => (
            <ProductCardSkeleton key={`initial-skeleton-${i}`} />
          ))}
        </div>
      ) : variantList.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-6 mt-6">
            {variantList.map((item, index) => (
              <ProductCard
                key={`${item.productId}-${item.variant?._id || index}`}
                item={item}
              />
            ))}

            {/* Extra skeletons appended while fetching the next page */}
            {isFetchingNextPage &&
              Array.from({ length: 5 }).map((_, i) => (
                <ProductCardSkeleton key={`more-skeleton-${i}`} />
              ))}
          </div>

          {/* Sentinel — IntersectionObserver watches this to trigger the next page */}
          {hasNextPage && <div ref={sentinelRef} className="h-1" />}
        </>
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