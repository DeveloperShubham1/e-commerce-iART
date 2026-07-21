// import { useEffect, useState } from "react";
// import { Link, useParams, useSearchParams } from "react-router-dom";
// import { useAppContext } from "../context/AppContext";
// import { assets } from "../assets/assets";
// import ProductCard from "../components/ProductCard";
// import { exchangeInstagramToken } from "../api";
// import { toast } from "react-toastify";
// import SizeChartDialog from "../components/Sizechartdialog";

// const ProductDetails = () => {
//   const { products, navigate, currency, addToCart, cartItems, fetchUser } =
//     useAppContext();
//   const { id } = useParams();
//   const [searchParams] = useSearchParams();

//   const [selectedVariant, setSelectedVariant] = useState(null);
//   const [selectedSize, setSelectedSize] = useState(null);
//   const [thumbnail, setThumbnail] = useState(null);
//   const [relatedProducts, setRelatedProducts] = useState([]);

//   const product = products.find((item) => item._id === id);
//   const variantIdFromUrl = searchParams.get("variant");

//   useEffect(() => {
//     const token = searchParams.get("token");
//     if (!token) return;

//     const exchangeToken = async () => {
//       try {
//         const data = await exchangeInstagramToken(token);

//         if (data.success) {
//           await fetchUser();
//           toast.success("Login successfull as guest!")
//         }
//       } catch (err) {
//         const errorMsg =
//           err.response?.data?.message ||
//           err.response?.data?.error ||
//           err.message ||
//           "Failed to log in";

//         console.log("IG token exchange failed:", errorMsg);
//         toast.error(errorMsg);
//       } finally {
//         const params = new URLSearchParams(searchParams);
//         params.delete("token");
//         params.delete("source");

//         const query = params.toString();

//         window.history.replaceState(
//           {},
//           "",
//           `${window.location.pathname}${query ? `?${query}` : ""}`
//         );
//       }
//     };

//     exchangeToken();
//   }, [searchParams]);

//   /* ---------------- DEFAULT VARIANT & SIZE ---------------- */
//   useEffect(() => {
//     if (product?.variants?.length > 0) {
//       const selected =
//         product.variants.find((v) => v._id === variantIdFromUrl) ||
//         product.variants[0];

//       setSelectedVariant(selected);
//       setSelectedSize(selected.sizes[0]);
//       setThumbnail(selected.images[0]);
//     }
//   }, [product, variantIdFromUrl]);

//   /* ---------------- UPDATE WHEN VARIANT CHANGES ---------------- */
//   useEffect(() => {
//     if (selectedVariant) {
//       setSelectedSize(selectedVariant.sizes[0]);
//       setThumbnail(selectedVariant.images[0]);
//     }
//   }, [selectedVariant]);

//   /* ---------------- RELATED PRODUCTS ---------------- */
//   // useEffect(() => {
//   //   if (product && products.length > 0) {
//   //     const filtered = products.filter(
//   //       (p) =>
//   //         p.categoryId._id === product.categoryId._id && p._id !== product._id,
//   //     );
//   //     setRelatedProducts(filtered.slice(0, 5));
//   //   }
//   // }, [product, products]);

//   useEffect(() => {
//     if (product && product.categoryId && products.length > 0) {
//       const filtered = products.filter(
//         (p) =>
//           p.categoryId &&
//           p.categoryId._id === product.categoryId._id &&
//           p._id !== product._id,
//       );

//       setRelatedProducts(filtered.slice(0, 5));
//     } else {
//       setRelatedProducts([]);
//     }
//   }, [product, products]);

//   /* ---------------- ADD TO CART ---------------- */
//   const handleAddToCart = () => {
//     if (!selectedVariant || !selectedSize) {
//       alert("Please select variant and size");
//       return;
//     }

//     addToCart(
//       product._id,
//       selectedVariant._id,
//       selectedSize.size, // ✅ IMPORTANT (string)
//       1,
//     );
//   };

//   const cartItem = cartItems.find(
//     (item) =>
//       item.productId === product?._id &&
//       item.variantId === selectedVariant?._id &&
//       item.size === selectedSize?.size,
//   );

//   if (!product) return null;

//   /* ---------------- PRICE CALCULATION ---------------- */
//   const finalPrice =
//     selectedSize?.offerPrice && selectedSize.offerPrice > 0
//       ? (
//         selectedSize.price -
//         (selectedSize.price * selectedSize.offerPrice) / 100
//       ).toFixed(2)
//       : selectedSize?.price;

//   return (
//     <div className="mt-12 px-4 sm:px-6 lg:px-8">
//       {/* Breadcrumb */}
//       <p className="text-sm text-gray-500">
//         <Link to="/">Home</Link> / <Link to="/products">Products</Link> /{" "}
//         <span className="text-primary">{product.name}</span>
//       </p>

//       <div className="flex flex-col md:flex-row gap-12 mt-6">
//         {/* ---------------- IMAGES ---------------- */}
//         <div className="flex gap-4">
//           <div className="flex flex-col gap-3">
//             {selectedVariant?.images?.map((img, idx) => (
//               <div
//                 key={idx}
//                 onClick={() => setThumbnail(img)}
//                 className="border w-20 h-20 cursor-pointer rounded overflow-hidden"
//               >
//                 <img src={img} alt="" className="w-full h-full object-cover" />
//               </div>
//             ))}
//           </div>

//           <div className="border rounded max-w-md overflow-hidden">
//             <img src={thumbnail} alt="" className="w-full object-cover" />
//           </div>
//         </div>

//         {/* ---------------- PRODUCT INFO ---------------- */}
//         <div className="flex flex-col gap-4 w-full md:w-1/2">
//           <h1 className="text-3xl font-medium">{product.name}</h1>

//           {/* Rating */}
//           <div className="flex gap-1">
//             {Array(5)
//               .fill("")
//               .map((_, i) => (
//                 <img
//                   key={i}
//                   src={i < 4 ? assets.star_icon : assets.star_dull_icon}
//                   className="w-4"
//                   alt=""
//                 />
//               ))}
//           </div>

//           {/* Price */}
//           <div>
//             <p className="text-gray-500 line-through">
//               MRP: {currency}
//               {selectedSize?.price}
//             </p>

//             <p className="text-2xl font-semibold">
//               {currency}
//               {finalPrice}
//               {selectedSize?.offerPrice > 0 && (
//                 <span className="ml-2 text-green-600 text-sm">
//                   ({selectedSize.offerPrice}% OFF)
//                 </span>
//               )}
//             </p>

//             <span className="text-gray-500 text-sm">
//               (inclusive of all taxes)
//             </span>
//           </div>

//           {/* Description */}
//           <p className="font-medium mt-4">About Product</p>
//           <p className="text-gray-500">{product.description}</p>

//           {/* ---------------- VARIANT ---------------- */}
//           <div>
//             <p className="font-medium">Select Color</p>
//             <div className="flex gap-2 mt-2">
//               {product.variants.map((v) => (
//                 <button
//                   key={v._id}
//                   onClick={() => setSelectedVariant(v)}
//                   style={{ backgroundColor: v.colorCode }}
//                   className={`w-8 h-8 rounded-full border-2
//                     ${selectedVariant?._id === v._id
//                       ? "ring-2 ring-primary"
//                       : ""
//                     }`}
//                 />
//               ))}
//             </div>
//           </div>

//           <div>
//             <div className="flex items-center gap-4">
//               <p className="font-medium">Select Size</p>
//               <SizeChartDialog />
//             </div>
//             <div className="flex gap-2 mt-2 flex-wrap">
//               {selectedVariant?.sizes.map((s) => (
//                 <button
//                   key={s._id}
//                   disabled={s.stock === 0}
//                   onClick={() => setSelectedSize(s)}
//                   className={`px-4 py-1 border rounded transition
//                     ${selectedSize?._id === s._id
//                       ? "bg-primary text-white"
//                       : "hover:bg-gray-200"
//                     }
//                     ${s.stock === 0 ? "opacity-40 cursor-not-allowed" : ""}
//                   `}
//                 >
//                   {s.size}
//                 </button>
//               ))}
//             </div>
//           </div>

//           {/* ---------------- ACTIONS ---------------- */}
//           <div className="flex gap-4 mt-6">
//             {!cartItem ? (
//               /* ---------- NOT IN CART ---------- */
//               <>
//                 <button
//                   onClick={handleAddToCart}
//                   disabled={!selectedSize}
//                   className="w-full py-3 bg-gray-100 hover:bg-gray-200"
//                 >
//                   Add to Cart
//                 </button>

//                 {/* <button
//                   onClick={() => {
//                     handleAddToCart();
//                     navigate("/cart");
//                   }}
//                   className="w-full py-3 bg-primary text-white hover:bg-primary-dull"
//                 >
//                   Buy Now
//                 </button> */}
//                 <button
//                   onClick={() => {
//                     if (!selectedVariant || !selectedSize) {
//                       alert("Please select a color and size");
//                       return;
//                     }

//                     navigate("/buy-now", {
//                       state: {
//                         productId: product._id,
//                         variantId: selectedVariant._id,
//                         size: selectedSize.size,
//                         qty: 1, // You can change this to a state if you allow quantity selection
//                       },
//                     });
//                   }}
//                   disabled={!selectedVariant || !selectedSize}
//                   className="w-full py-3 bg-primary text-white hover:bg-primary-dull disabled:bg-gray-300 disabled:cursor-not-allowed transition"
//                 >
//                   Buy Now
//                 </button>
//               </>
//             ) : (
//               /* ---------- ALREADY IN CART ---------- */
//               <div className="w-full flex flex-col gap-2">
//                 <p className="text-green-600 font-medium">
//                   ✅ Already in cart (Qty: {cartItem.quantity})
//                 </p>

//                 <button
//                   onClick={() => navigate("/cart")}
//                   className="w-full py-3 bg-primary text-white hover:bg-primary-dull"
//                 >
//                   Go to Cart
//                 </button>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* ---------------- RELATED PRODUCTS ---------------- */}
//       {/* ---------------- RELATED VARIANTS ---------------- */}
//       {product?.variants
//         .filter((v) => v._id !== selectedVariant?._id) // exclude current variant
//         .map((variant) => (
//           <div className="mt-20">
//             <h2 className="text-2xl font-medium text-center">Other Variants</h2>

//             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-6">
//               <ProductCard
//                 key={variant._id}
//                 item={{
//                   productId: product._id,
//                   name: product.name,
//                   brand: product.brand,
//                   categoryId: product.categoryId,
//                   subcategoryId: product.subcategoryId,
//                   rating: 4,
//                   variant: variant,
//                 }}
//               />
//             </div>
//           </div>
//         ))}
//     </div>
//   );
// };

// export default ProductDetails;

import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
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
} from "lucide-react";

const ProductDetails = () => {
  const { products, navigate, currency, addToCart, cartItems, fetchUser } =
    useAppContext();
  const { id } = useParams();
  const [searchParams] = useSearchParams();

  console.log("Details is runnig===>")
  console.log("products===>", products)
  console.log("id===>", id)
  console.log("searchParams===>", searchParams)

  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [thumbnail, setThumbnail] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);

  const product = products.find((item) => item._id === id);
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

  /* ---------------- RELATED PRODUCTS ---------------- */
  useEffect(() => {
    if (product && product.categoryId && products.length > 0) {
      const filtered = products.filter(
        (p) =>
          p.categoryId &&
          p.categoryId._id === product.categoryId._id &&
          p._id !== product._id,
      );

      setRelatedProducts(filtered.slice(0, 5));
    } else {
      setRelatedProducts([]);
    }
  }, [product, products]);

  /* ---------------- ADD TO CART ---------------- */
  const handleAddToCart = () => {
    if (!selectedVariant || !selectedSize) {
      alert("Please select variant and size");
      return;
    }

    addToCart(product._id, selectedVariant._id, selectedSize.size, 1);
  };

  const cartItem = cartItems.find(
    (item) =>
      item.productId === product?._id &&
      item.variantId === selectedVariant?._id &&
      item.size === selectedSize?.size,
  );

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
    <div className="mt-8 mb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
        <div className="lg:col-span-7 flex flex-col-reverse md:flex-row gap-4 items-start">
          {/* Thumbnail List */}
          <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto max-h-[460px]  p-1 [scrollbar-width:none] [::-webkit-scrollbar]:hidden">
            {selectedVariant?.images?.map((img, idx) => {
              const isActive = thumbnail === img;
              return (
                <button
                  key={idx}
                  onClick={() => setThumbnail(img)}
                  className={`relative flex-shrink-0 cursor-pointer w-16 h-20 md:w-18 md:h-22 rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                    isActive
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

          {/* Main Hero Image Frame (Compact Size) */}
          {/* <div className="relative flex-1 bg-slate-50 rounded-3xl overflow-hidden group h-[380px] md:h-[460px] max-w-[330px] flex items-center justify-center border border-slate-100">
            {selectedSize?.offerPrice > 0 && (
              <div className="absolute top-4 left-4 z-10 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                Save {selectedSize.offerPrice}%
              </div>
            )}

            <img
              src={thumbnail}
              alt={product.name}
              className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-500"
            />
          </div> */}
          <div className="relative w-fit h-fit mx-auto md:mx-0 rounded-3xl overflow-hidden group border border-slate-100 bg-slate-50">
  {/* Save Badge */}
  {selectedSize?.offerPrice > 0 && (
    <div className="absolute top-4 left-4 z-10 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
      Save {selectedSize.offerPrice}%
    </div>
  )}

  {/* Image automatically sets the width and height of the box */}
  <img
    src={thumbnail}
    alt={product.name}
    className="w-auto h-auto max-w-full max-h-[500px] object-contain rounded-3xl group-hover:scale-105 transition-transform duration-500 ease-out"
  />
</div>

        </div>

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

              <div className="flex items-center gap-3">
                {product.variants.map((v) => {
                  const isSelected = selectedVariant?._id === v._id;
                  return (
                    <button
                      key={v._id}
                      onClick={() => setSelectedVariant(v)}
                      className={`relative w-9 h-9 rounded-full transition-all duration-300 flex items-center justify-center cursor-pointer ${
                        isSelected
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
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 border cursor-pointer ${
                        isSelected
                          ? "bg-slate-900 text-white border-slate-900 shadow-md shadow-slate-900/10 scale-105"
                          : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                      } ${
                        isOutOfStock
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
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center gap-1">
                <RotateCcw className="w-4 h-4 text-amber-600" />
                <span>Easy Returns</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== OTHER COLOR VARIANTS ==================== */}
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
    </div>
  );
};

export default ProductDetails;
