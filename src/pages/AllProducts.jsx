import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAppContext } from "../context/AppContext";
import { toast } from "react-toastify";
import ProductCard from "../components/ProductCard";

const LIMIT = 10;
const DEBOUNCE_MS = 400;

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

const AllProducts = () => {
  const { axios, searchQuery } = useAppContext();
  const merchantId = import.meta.env.VITE_MERCHANT_ID;

  const [rawProducts, setRawProducts] = useState([]); // accumulated across pages
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const sentinelRef = useRef(null);
  const hasMore = page < totalPages;

  /* ---------------- FETCH A PAGE ---------------- */
  const fetchProducts = async (pageToFetch, { append }) => {
    try {
      const { data } = await axios.get(
        `/api/user/product/list?merchantId=${merchantId}&search=${searchQuery || ""}&page=${pageToFetch}&limit=${LIMIT}`
      );

      if (data.success) {
        setRawProducts((prev) =>
          append ? [...prev, ...data.products] : data.products
        );
        setPage(data.page);
        setTotalPages(data.totalPages);
      } else {
        toast.error(data.message || "Failed to fetch products");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setInitialLoading(false);
      setLoadingMore(false);
    }
  };

  /* ---------------- RESET + FETCH PAGE 1 ON SEARCH CHANGE (debounced) ---------------- */
  useEffect(() => {
    // Show skeletons immediately so the UI feels responsive, but delay the
    // actual request until the user pauses typing for DEBOUNCE_MS.
    setInitialLoading(true);
    setRawProducts([]);
    setPage(1);
    setTotalPages(1);

    const timer = setTimeout(() => {
      fetchProducts(1, { append: false });
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, merchantId]);

  /* ---------------- INFINITE SCROLL TRIGGER ---------------- */
  const loadNextPage = useCallback(() => {
    if (loadingMore || initialLoading || !hasMore) return;
    setLoadingMore(true);
    fetchProducts(page + 1, { append: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingMore, initialLoading, hasMore, page]);

  useEffect(() => {
    if (!sentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadNextPage();
        }
      },
      { rootMargin: "300px" } // start fetching a bit before it's actually on-screen
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [loadNextPage]);

  /* ---------------- SEPARATE-VARIANT EXPANSION (unchanged logic) ---------------- */
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
    <div className="mx-5 mt-16 flex flex-col">
      {/* ===== Header ===== */}
      <div className="flex flex-col items-end w-max">
        <p className="text-2xl font-medium uppercase">All Products</p>
        <div className="w-16 h-0.5 bg-primary rounded-full" />
      </div>

      {/* ===== Products Grid ===== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-6 mt-6">
        {initialLoading
          ? Array.from({ length: LIMIT }).map((_, i) => (
            <ProductCardSkeleton key={`initial-skeleton-${i}`} />
          ))
          : variantList.map((item, index) => (
            <ProductCard
              key={`${item.productId}-${item.variant?._id || index}`}
              item={item}
            />
          ))}

        {/* Extra skeletons appended while fetching the next page */}
        {loadingMore &&
          Array.from({ length: 5 }).map((_, i) => (
            <ProductCardSkeleton key={`more-skeleton-${i}`} />
          ))}
      </div>

      {/* Empty state */}
      {!initialLoading && !loadingMore && variantList.length === 0 && (
        <div className="text-center py-20 text-gray-500">
          No products found.
        </div>
      )}

      {/* Sentinel — IntersectionObserver watches this to trigger the next page */}
      {hasMore && <div ref={sentinelRef} className="h-1" />}
    </div>
  );
};

export default AllProducts;