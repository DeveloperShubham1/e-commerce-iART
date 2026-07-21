// import React, { useEffect, useState } from "react";
// import ProductCard from "./ProductCard";
// import { useAppContext } from "../context/AppContext";
// import { Flame, ArrowUpRight, Sparkles, ShoppingBag, Layers } from "lucide-react";
// import { Link } from "react-router-dom";

// const BestSeller = () => {
//   const { products = [], loading } = useAppContext();
//   const [bestSellerVariants, setBestSellerVariants] = useState([]);
//   const [isInitializing, setIsInitializing] = useState(true);

//   useEffect(() => {
//     if (!Array.isArray(products)) {
//       setIsInitializing(false);
//       return;
//     }

//     const finalList = [];

//     products
//       .filter((product) => product?.isActive)
//       .forEach((product) => {
//         if (!Array.isArray(product?.variants) || product.variants.length === 0)
//           return;

//         // 🔥 isSeprate = TRUE → show ALL variants
//         if (product.isSeprate) {
//           product.variants.forEach((variant) => {
//             if (!variant) return;

//             finalList.push({
//               productId: product._id,
//               name: product.name,
//               brand: product.brand,
//               categoryId: product.categoryId,
//               subcategoryId: product.subcategoryId,
//               rating: product.rating || 4.8,
//               variant,
//               isSeprate: true,
//             });
//           });
//         }
//         // 🔥 isSeprate = FALSE → show ONLY ONE variant
//         else {
//           finalList.push({
//             productId: product._id,
//             name: product.name,
//             brand: product.brand,
//             categoryId: product.categoryId,
//             subcategoryId: product.subcategoryId,
//             rating: product.rating || 4.8,
//             variant: product.variants[0], // 👈 first variant only
//             isSeprate: false,
//           });
//         }
//       });

//     setBestSellerVariants(finalList.slice(0, 10)); // Top 10 items
//     setIsInitializing(false);
//   }, [products]);

//   return (
//     <section className="relative mt-20 sm:mt-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//       {/* ===== Ambient Background Glow ===== */}
//       <div className="absolute top-0 left-1/4 -z-10 w-96 h-96 bg-gradient-to-tr from-amber-500/10 via-rose-500/5 to-indigo-500/10 blur-3xl rounded-full pointer-events-none" />

//       {/* ===== Premium Section Header ===== */}
//       <div className="relative flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b border-slate-200/60 backdrop-blur-sm">
//         <div className="space-y-1.5">
//           {/* Flame Pill Badge */}
//           {/* <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 text-white shadow-lg shadow-slate-900/10 border border-slate-800">
//             <span className="relative flex h-2 w-2">
//               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
//               <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
//             </span>
//             <span className="text-[11px] font-bold tracking-widest uppercase text-amber-300 flex items-center gap-1">
//               <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
//               Trending Collection
//             </span>
//           </div> */}

//           <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3 pt-1">
//             Best Sellers
//           </h2>
//           <p className="text-xs sm:text-sm text-slate-500 max-w-md leading-relaxed font-normal">
//             Handpicked favorites loved by thousands. Discover high-demand styles designed for unmatched performance.
//           </p>
//         </div>

//         {/* View All Button */}
//         <Link
//           to="/products"
//           className="group relative inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold overflow-hidden shadow-md hover:shadow-xl hover:shadow-slate-900/20 active:scale-95 transition-all duration-300 self-start sm:self-auto"
//         >
//           <span className="relative z-10 flex items-center gap-1.5">
//             Explore All
//             <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 duration-300" />
//           </span>
//           <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-violet-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
//         </Link>
//       </div>

//       {/* ===== Product Showcase Grid ===== */}
//       {isInitializing || loading ? (
//         /* SKELETON LOADER */
//         <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6 mt-8">
//           {[...Array(10)].map((_, index) => (
//             <div
//               key={index}
//               className="bg-white/80 rounded-2xl border border-slate-200/80 p-3.5 shadow-sm animate-pulse space-y-3"
//             >
//               <div className="w-full aspect-[4/5] bg-slate-100 rounded-xl" />
//               <div className="h-3.5 bg-slate-100 rounded-md w-4/5" />
//               <div className="h-3 bg-slate-100 rounded-md w-1/2" />
//               <div className="flex justify-between items-center pt-2">
//                 <div className="h-4 bg-slate-100 rounded-md w-1/3" />
//                 <div className="h-7 w-7 bg-slate-100 rounded-lg" />
//               </div>
//             </div>
//           ))}
//         </div>
//       ) : bestSellerVariants.length > 0 ? (
//         /* PRODUCT CARDS GRID */
//         <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-6 mt-8">
//           {bestSellerVariants.map((item, index) => (
//             <div
//               key={`${item.productId}-${item.variant?._id || index}`}
//               className="group relative transition-all duration-300 hover:-translate-y-1.5"
//             >
//               {/* Product Card Container with Hover Ring Glow */}
//               <div className="h-full rounded-2xl transition-all duration-300 group-hover:shadow-xl group-hover:shadow-slate-900/5 group-hover:border-indigo-200/80">
//                 <ProductCard item={item} />
//               </div>
//             </div>
//           ))}
//         </div>
//       ) : (
//         /* LUXURY EMPTY STATE */
//         <div className="relative overflow-hidden text-center py-20 bg-gradient-to-b from-slate-50/80 to-white rounded-3xl border border-slate-200/80 shadow-inner mt-8">
//           <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-sm">
//             <ShoppingBag className="w-7 h-7" />
//           </div>
//           <h3 className="text-base font-bold text-slate-900">No Best Sellers Currently Featured</h3>
//           <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
//             Our catalog updates dynamically based on customer demand. Check back shortly for restocks!
//           </p>
//         </div>
//       )}
//     </section>
//   );
// };

// export default BestSeller;

import React, { useEffect, useState } from "react";
import ProductCard from "./ProductCard";
import { useAppContext } from "../context/AppContext";
import { Flame, ArrowUpRight, Sparkles, ShoppingBag, Layers } from "lucide-react";
import { useNavigate } from "react-router-dom";

const BestSeller = () => {
  const { products = [], loading } = useAppContext();
  const [bestSellerVariants, setBestSellerVariants] = useState([]);
  const [isInitializing, setIsInitializing] = useState(true);
  
  const navigate = useNavigate();

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

        // 🔥 isSeprate = TRUE → show ALL variants
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
            });
          });
        }
        // 🔥 isSeprate = FALSE → show ONLY ONE variant
        else {
          finalList.push({
            productId: product._id,
            name: product.name,
            brand: product.brand,
            categoryId: product.categoryId,
            subcategoryId: product.subcategoryId,
            rating: product.rating || 4.8,
            variant: product.variants[0], // 👈 first variant only
            isSeprate: false,
          });
        }
      });

    setBestSellerVariants(finalList.slice(0, 10)); // Top 10 items
    setIsInitializing(false);
  }, [products]);

  return (
    <section className="relative mt-20 sm:mt-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* ===== Ambient Background Glow ===== */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -z-10 w-72 h-72 sm:w-96 sm:h-96 bg-gradient-to-tr from-amber-500/10 via-rose-500/5 to-indigo-500/10 blur-3xl rounded-full pointer-events-none" />

      {/* ===== Premium Section Header ===== */}
      <div className="relative flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b border-slate-200/60 backdrop-blur-sm">
        <div className="space-y-1.5">
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3 pt-1">
            Best Sellers
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md leading-relaxed font-normal">
            Handpicked favorites loved by thousands. Discover high-demand styles designed for unmatched performance.
          </p>
        </div>

        {/* View All Button */}
        <button
          onClick={() => navigate("/products")}
          className="group relative inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold overflow-hidden shadow-md hover:shadow-xl hover:shadow-slate-900/20 active:scale-95 transition-all duration-300 self-start sm:self-auto cursor-pointer"
        >
          <span className="relative z-10 flex items-center gap-1.5">
            Explore All
            <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 duration-300" />
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-violet-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </button>
      </div>

      {/* ===== Product Showcase Grid ===== */}
      {isInitializing || loading ? (
        /* SKELETON LOADER */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-6 mt-8">
          {[...Array(10)].map((_, index) => (
            <div
              key={index}
              className="bg-white/80 rounded-2xl border border-slate-200/80 p-3.5 shadow-sm animate-pulse space-y-3"
            >
              <div className="w-full aspect-[4/5] bg-slate-100 rounded-xl" />
              <div className="h-3.5 bg-slate-100 rounded-md w-4/5" />
              <div className="h-3 bg-slate-100 rounded-md w-1/2" />
              <div className="flex justify-between items-center pt-2">
                <div className="h-4 bg-slate-100 rounded-md w-1/3" />
                <div className="h-7 w-7 bg-slate-100 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : bestSellerVariants.length > 0 ? (
        /* PRODUCT CARDS GRID */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-6 mt-8 w-full">
          {bestSellerVariants.map((item, index) => (
            <div
              key={`${item.productId}-${item.variant?._id || index}`}
              className="group relative transition-all duration-300 hover:-translate-y-1.5 min-w-0"
            >
              {/* Product Card Container with Hover Ring Glow */}
              <div className="h-full rounded-2xl transition-all duration-300 group-hover:shadow-xl group-hover:shadow-slate-900/5 group-hover:border-indigo-200/80">
                <ProductCard item={item} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* LUXURY EMPTY STATE */
        <div className="relative overflow-hidden text-center py-20 bg-gradient-to-b from-slate-50/80 to-white rounded-3xl border border-slate-200/80 shadow-inner mt-8">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-sm">
            <ShoppingBag className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Best Sellers Currently Featured</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
            Our catalog updates dynamically based on customer demand. Check back shortly for restocks!
          </p>
        </div>
      )}
    </section>
  );
};

export default BestSeller;