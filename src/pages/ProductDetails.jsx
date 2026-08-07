import { useEffect, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { useProductById, useProductsByCategory } from "../services/user";
import ProductCard from "../components/ProductCard";
import { exchangeInstagramToken } from "../api";
import { toast } from "react-toastify";
import SizeChartDialog from "../components/Sizechartdialog";
import {
  Star,
  ShoppingBag,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Truck,
  RotateCcw,
  Sparkles,
  Layers,
  ExternalLink,
  ZoomIn
} from "lucide-react";

const ProductDetails = () => {
  const { navigate, currency, addToCart, cartItems, fetchUser } =
    useAppContext();
  const { id } = useParams();
  const [searchParams] = useSearchParams();

  // ---------------- FETCH SINGLE PRODUCT ----------------
  const {
    data,
    isLoading,
    isError,
    error,
  } = useProductById(id);

  const product = data?.product;

  // ---------------- FETCH RELATED / SIMILAR PRODUCTS ----------------
  const { data: relatedData, isLoading: isRelatedLoading } =
    useProductsByCategory(product?.categoryId?._id, product?._id);

  const relatedProducts = relatedData?.products || [];

  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [thumbnail, setThumbnail] = useState(null);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const touchStartX = useRef(null);

  const variantIdFromUrl = searchParams.get("variant");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) return;

    const exchangeToken = async () => {
      try {
        const data = await exchangeInstagramToken(token);

        if (data.success) {
          await fetchUser();
          toast.success("Login successful as guest!");
        }
      } catch (err) {
        const errorMsg =
          err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Failed to log in";

        console.log("IG token exchange failed:", errorMsg);
        toast.error(errorMsg);
      } finally {
        const params = new URLSearchParams(searchParams);
        params.delete("token");
        params.delete("source");

        const query = params.toString();

        window.history.replaceState(
          {},
          "",
          `${window.location.pathname}${query ? `?${query}` : ""}`,
        );
      }
    };

    exchangeToken();
  }, [searchParams]);

  /* ---------------- DEFAULT VARIANT & SIZE ---------------- */
  useEffect(() => {
    if (product?.variants?.length > 0) {
      const selected =
        product.variants.find((v) => v._id === variantIdFromUrl) ||
        product.variants[0];

      setSelectedVariant(selected);
      setSelectedSize(selected.sizes[0]);
      setThumbnail(selected.images[0]);
    }
  }, [product, variantIdFromUrl]);

  /* ---------------- UPDATE WHEN VARIANT CHANGES ---------------- */
  useEffect(() => {
    if (selectedVariant) {
      setSelectedSize(selectedVariant.sizes[0]);
      setThumbnail(selectedVariant.images[0]);
    }
  }, [selectedVariant]);

  /* ---------------- ADD TO CART ---------------- */
  const handleAddToCart = () => {
    if (!selectedVariant || !selectedSize) {
      alert("Please select variant and size");
      return;
    }

    addToCart(product._id, selectedVariant._id, selectedSize.size, 1);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    } catch (error) {
      console.error("Failed to copy:", error);

      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = window.location.href;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);

      toast.success("Link copied to clipboard!");
    }
  };

  const cartItem = cartItems.find(
    (item) =>
      item.productId === product?._id &&
      item.variantId === selectedVariant?._id &&
      item.size === selectedSize?.size,
  );

  /* ---------------- LOADING / ERROR STATES ---------------- */
  if (isLoading) {
    return (
      <div className="mt-8 mb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-500">
            Loading product...
          </p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mt-8 mb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-sm font-semibold text-red-500">
            {error?.response?.data?.message ||
              error?.message ||
              "Failed to load product"}
          </p>
          <button
            onClick={() => navigate("/products")}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold uppercase tracking-wider"
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  if (!product) return null;

  /* ---------------- PRICE CALCULATION ---------------- */
  const finalPrice =
    selectedSize?.offerPrice && selectedSize.offerPrice > 0
      ? (
        selectedSize.price -
        (selectedSize.price * selectedSize.offerPrice) / 100
      ).toFixed(2)
      : selectedSize?.price;

  const otherVariants =
    product?.variants?.filter((v) => v._id !== selectedVariant?._id) || [];




  return (
    <div className="mt-8 mb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-x-hidden">
      {/* ===== BREADCRUMB ===== */}
      <nav className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-8 py-2">
        <Link to="/" className="hover:text-slate-900 transition-colors">
          Home
        </Link>
        <ChevronRight className="w-3 h-3 text-slate-400" />
        <Link to="/products" className="hover:text-slate-900 transition-colors">
          Products
        </Link>
        <ChevronRight className="w-3 h-3 text-slate-400" />
        <span className="text-indigo-600 font-semibold truncate">
          {product.name}
        </span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
        {/* ==================== LEFT: IMAGE GALLERY (7 COLS) ==================== */}
        <div className="lg:col-span-7 w-full min-w-0 flex flex-col gap-4 items-start">
          {/* ---------- MOBILE: full-width swipeable carousel with dots + zoom ---------- */}
          <div className="md:hidden w-full">
            <div
              className="relative w-full rounded-2xl overflow-hidden bg-slate-50 border border-slate-100"
              onTouchStart={(e) => {
                touchStartX.current = e.changedTouches[0].clientX;
              }}
              onTouchEnd={(e) => {
                if (touchStartX.current === null) return;
                const deltaX = e.changedTouches[0].clientX - touchStartX.current;
                const images = selectedVariant?.images || [];
                if (Math.abs(deltaX) > 40 && images.length > 1) {
                  const currentIdx = images.indexOf(thumbnail);
                  let nextIdx;
                  if (deltaX < 0) {
                    // swiped left -> next image
                    nextIdx = currentIdx === images.length - 1 ? 0 : currentIdx + 1;
                  } else {
                    // swiped right -> previous image
                    nextIdx = currentIdx === 0 ? images.length - 1 : currentIdx - 1;
                  }
                  setThumbnail(images[nextIdx]);
                }
                touchStartX.current = null;
              }}
            >
              {selectedSize?.offerPrice > 0 && (
                <div className="absolute top-4 left-4 z-10 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                  Save {selectedSize.offerPrice}%
                </div>
              )}

              {/* Zoom icon button */}
              <button
                type="button"
                onClick={() => setIsZoomOpen(true)}
                className="absolute bottom-3 right-3 z-10 w-9 h-9 rounded-md bg-white/90 backdrop-blur flex items-center justify-center shadow-md border border-slate-200 cursor-pointer"
                aria-label="Zoom image"
              >
                <ZoomIn className="w-4 h-4 text-slate-700" />
              </button>

              <img
                src={thumbnail}
                alt={product.name}
                className="w-full aspect-[3/4] object-cover object-center"
              />
            </div>

            {/* Dot indicators */}
            {selectedVariant?.images?.length > 1 && (
              <div className="flex items-center justify-center gap-1.5 mt-3">
                {selectedVariant.images.map((img, idx) => {
                  const isActive = thumbnail === img;
                  return (
                    <button
                      key={idx}
                      onClick={() => setThumbnail(img)}
                      aria-label={`Go to image ${idx + 1}`}
                      className={`rounded-full transition-all duration-300 cursor-pointer ${isActive
                        ? "w-2 h-2 bg-slate-900"
                        : "w-1.5 h-1.5 bg-slate-300"
                        }`}
                    />
                  );
                })}
              </div>
            )}
          </div>

          {/* ---------- DESKTOP: thumbnail rail + main image ---------- */}
          <div className="hidden md:flex w-full min-w-0 flex-row gap-4 items-start">
            {/* Thumbnail List */}
            <div className="flex flex-col gap-3 w-auto overflow-y-auto max-h-[460px] p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {selectedVariant?.images?.map((img, idx) => {
                const isActive = thumbnail === img;
                return (
                  <button
                    key={idx}
                    onClick={() => setThumbnail(img)}
                    className={`relative flex-shrink-0 cursor-pointer w-16 h-20 md:w-18 md:h-22 rounded-xl overflow-hidden border-2 transition-all duration-300 ${isActive
                      ? "border-indigo-600 ring-2 ring-indigo-600/20 shadow-md scale-105"
                      : "border-slate-200/80 hover:border-slate-300 opacity-70 hover:opacity-100"
                      }`}
                  >
                    <img
                      src={img}
                      alt={`${product.name} thumbnail ${idx}`}
                      className="w-full h-full object-cover object-center"
                    />
                  </button>
                );
              })}
            </div>

            {/* Main Hero Image Frame */}
            <div className="relative w-auto max-w-full mx-0 rounded-3xl overflow-hidden group border border-slate-100 bg-slate-50">
              {selectedSize?.offerPrice > 0 && (
                <div className="absolute top-4 left-4 z-10 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                  Save {selectedSize.offerPrice}%
                </div>
              )}

              <img
                src={thumbnail}
                alt={product.name}
                className="w-auto h-auto max-w-full max-h-[500px] object-contain rounded-3xl group-hover:scale-105 transition-transform duration-500 ease-out"
              />
            </div>
          </div>
        </div>

        {/* ---------- MOBILE ZOOM LIGHTBOX ---------- */}
        {isZoomOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center md:hidden"
            onClick={() => setIsZoomOpen(false)}
          >
            <button
              type="button"
              onClick={() => setIsZoomOpen(false)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white text-xl cursor-pointer"
              aria-label="Close zoom"
            >
              &times;
            </button>
            <img
              src={thumbnail}
              alt={product.name}
              className="max-w-[92vw] max-h-[85vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}

        {/* ==================== RIGHT: PRODUCT INFO & ACTIONS (5 COLS) ==================== */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-6 lg:sticky lg:top-24 h-fit">
          <div className="space-y-5">
            {/* Brand & Category Pill */}
            <div className="flex items-center justify-between">
              {product.brand && (
                <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                  {product.brand}
                </span>
              )}
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-500 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200/60">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>4.8 Rating</span>
              </div>
            </div>

            {/* Product Title */}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {product.name}
            </h1>

            {/* Pricing Section */}
            <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-1">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-black text-slate-900 tracking-tight">
                  {currency}
                  {finalPrice}
                </span>

                {selectedSize?.offerPrice > 0 && (
                  <span className="text-base text-slate-400 line-through font-normal">
                    {currency}
                    {selectedSize?.price}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                Price inclusive of all taxes & instant checkout processing
              </p>
            </div>

            {/* Product Description */}
            <div className="space-y-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Description
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed font-normal">
                {product.description}
              </p>
            </div>

            {/* COLOR SELECTOR */}
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Select Color:
                </span>
                <span className="text-xs font-semibold text-indigo-600 capitalize">
                  {selectedVariant?.color || "Default"}
                </span>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                {product.variants.map((v) => {
                  const isSelected = selectedVariant?._id === v._id;
                  return (
                    <button
                      key={v._id}
                      onClick={() => setSelectedVariant(v)}
                      className={`relative w-9 h-9 rounded-full transition-all duration-300 flex items-center justify-center cursor-pointer ${isSelected
                        ? "ring-2 ring-indigo-600 ring-offset-2 scale-110 shadow-md"
                        : "hover:scale-105 opacity-80 hover:opacity-100"
                        }`}
                      style={{ backgroundColor: v.colorCode || "#cbd5e1" }}
                      title={v.color}
                    />
                  );
                })}
              </div>
            </div>

            {/* SIZE SELECTOR */}
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Select Size:
                </span>
                <SizeChartDialog />
              </div>

              <div className="flex flex-wrap gap-2.5">
                {selectedVariant?.sizes.map((s) => {
                  const isSelected = selectedSize?._id === s._id;
                  const isOutOfStock = s.stock === 0;

                  return (
                    <button
                      key={s._id}
                      disabled={isOutOfStock}
                      onClick={() => setSelectedSize(s)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 border cursor-pointer ${isSelected
                        ? "bg-slate-900 text-white border-slate-900 shadow-md shadow-slate-900/10 scale-105"
                        : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                        } ${isOutOfStock
                          ? "opacity-40 line-through cursor-not-allowed bg-slate-100 border-slate-200"
                          : ""
                        }`}
                    >
                      {s.size}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-800">
                  Selected Size: {selectedSize?.size}
                </p>
                <p className="text-xs text-slate-500">
                  {selectedSize?.stock > 0
                    ? `${selectedSize.stock} pieces available`
                    : "Currently unavailable"}
                </p>
              </div>

              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${selectedSize?.stock > 0
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                  }`}
              >
                {selectedSize?.stock > 0 ? "In Stock" : "Out of Stock"}
              </span>
            </div>
          </div>

          {/* ==================== ACTION BUTTONS ==================== */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            {!cartItem ? (
              <div className="grid grid-cols-2 gap-3">
                {/* Add to Cart */}
                <button
                  onClick={handleAddToCart}
                  disabled={!selectedSize}
                  className="w-full py-3.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                >
                  <ShoppingBag className="w-4 h-4" />
                  Add to Cart
                </button>

                {/* Buy Now */}
                <button
                  onClick={() => {
                    if (!selectedVariant || !selectedSize) {
                      alert("Please select a color and size");
                      return;
                    }

                    navigate("/buy-now", {
                      state: {
                        productId: product._id,
                        variantId: selectedVariant._id,
                        size: selectedSize.size,
                        qty: 1,
                      },
                    });
                  }}
                  disabled={!selectedVariant || !selectedSize}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/20 transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                >
                  Buy Now
                </button>
              </div>
            ) : (
              /* Already in Cart Banner */
              <div className="space-y-2 p-3 bg-emerald-50 border border-emerald-200/80 rounded-2xl text-center">
                <p className="text-xs font-bold text-emerald-800 flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Already in cart (Qty: {cartItem.quantity})
                </p>
                <button
                  onClick={() => navigate("/cart")}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  Go to Cart
                </button>
              </div>
            )}

            {/* Premium Guarantee Badges */}
            <div className="grid grid-cols-3 gap-2 pt-2 text-center text-[10px] font-semibold text-slate-500">
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center gap-1">
                <Truck className="w-4 h-4 text-indigo-600" />
                <span>Express Delivery</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>100% Authentic</span>
              </div>
              <div
                onClick={handleCopyLink}
                className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center gap-1 cursor-pointer hover:bg-slate-100 transition"
              >
                <ExternalLink className="w-4 h-4 text-purple-600" />
                <span>Share Link</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== OTHER COLOR VARIANTS (same product) ==================== */}
      {otherVariants.length > 0 && (
        <section className="mt-20 pt-12 border-t border-slate-200/80">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full mb-2">
                <Layers className="w-3.5 h-3.5" />
                More Options
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                Other Color Variants
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {otherVariants.map((variant) => (
              <ProductCard
                key={variant._id}
                item={{
                  productId: product._id,
                  name: product.name,
                  brand: product.brand,
                  categoryId: product.categoryId,
                  subcategoryId: product.subcategoryId,
                  rating: 4.8,
                  variant: variant,
                }}
              />
            ))}
          </div>
        </section>
      )}

      {/* ==================== YOU MIGHT ALSO LIKE (similar products) ==================== */}
      {(isRelatedLoading || relatedProducts.length > 0) && (
        <section className="mt-20 pt-12 border-t border-slate-200/80">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-violet-600 bg-violet-50 px-3 py-1 rounded-full mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                {relatedData?.type === "similar" ? "Similar Picks" : "Recommended"}
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                You Might Also Like
              </h2>
            </div>
          </div>

          {isRelatedLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[3/4] rounded-2xl bg-slate-100 animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {relatedProducts.map((rp) => {
                const firstVariant = rp.variants?.[0];
                if (!firstVariant) return null;

                return (
                  <ProductCard
                    key={rp._id}
                    item={{
                      productId: rp._id,
                      name: rp.name,
                      brand: rp.brand,
                      categoryId: rp.categoryId,
                      subcategoryId: rp.subcategoryId,
                      rating: 4.8,
                      variant: firstVariant,
                    }}
                  />
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default ProductDetails;