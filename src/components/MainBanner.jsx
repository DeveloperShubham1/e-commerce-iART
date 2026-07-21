// import React from "react";
// import { assets } from "../assets/assets";
// import { Link } from "react-router-dom";
// import { useAppContext } from "../context/AppContext";

// const MainBanner = () => {
//   const { settings } = useAppContext();

//   const gradientStyle =
//     "bg-gradient-to-r from-purple-500 via-pink-500 to-red-500";

//   const desktopBanner = settings?.homepage?.bannerTopImageWeb?.url;
//   const mobileBanner = settings?.homepage?.bannerTopImageMob?.url;

//   return (
//     <section
//       className={`relative w-full h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px] overflow-hidden ${!desktopBanner ? gradientStyle : ""
//         }`}
//     >
//       {/* Desktop Banner */}
//       {desktopBanner && (
//         <img
//           src={desktopBanner}
//           alt="Banner"
//           className="hidden md:block absolute inset-0 w-full h-full object-cover"
//         />
//       )}

//       {/* Mobile Banner */}
//       {mobileBanner && (
//         <img
//           src={mobileBanner}
//           alt="Banner"
//           className="block md:hidden absolute inset-0 w-full h-full object-cover"
//         />
//       )}

//       {/* Dark Overlay */}
//       <div className="absolute inset-0 bg-black/60" />

//       {/* Content */}
//       {/* <div className="relative z-10 h-full flex items-center ">
//         <div className="max-w-7xl mx-auto w-full px-6 md:px-12 lg:px-20">
//           <div className="max-w-xl ml-auto text-right text-white ">
//             <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
//               Quality You Can Feel,
//               <br />
//               Style You'll Love!
//             </h1>

//             <p className="mt-4 text-sm sm:text-base md:text-lg text-white/90">
//               Discover premium collections crafted for comfort, quality, and
//               everyday style.
//             </p>

//             <div className="flex flex-wrap gap-4 mt-8">
//               <Link
//                 to="/products"
//                 className="px-7 py-3 rounded-lg bg-primary hover:bg-primary-dull transition text-white font-medium"
//               >
//                 Shop Now
//               </Link>

//               <Link
//                 to="/products"
//                 className="px-7 py-3 rounded-lg border border-white text-white hover:bg-white hover:text-black transition font-medium"
//               >
//                 Explore Deals
//               </Link>
//             </div>
//           </div>
//         </div>
//       </div> */}
//       <div className="relative z-10 h-full flex items-center ">
//   <div className="max-w-full mx-auto w-full px-6 md:px-12 lg:px-20">
//     <div className="max-w-xl ml-auto text-left text-white">
//       <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
//         Quality You Can Feel,
//         <br />
//         Style You'll Love!
//       </h1>

//       <p className="mt-4 text-sm sm:text-base md:text-lg text-white/90">
//         Discover premium collections crafted for comfort, quality, and everyday style.
//       </p>

//       <div className="flex flex-wrap gap-4 mt-8">
//         <Link
//           to="/products"
//           className="px-7 py-3 rounded-lg bg-primary hover:bg-primary-dull transition text-white font-medium"
//         >
//           Shop Now
//         </Link>

//         <Link
//           to="/products"
//           className="px-7 py-3 rounded-lg border border-white text-white hover:bg-white hover:text-black transition font-medium"
//         >
//           Explore Deals
//         </Link>
//       </div>
//     </div>
//   </div>
// </div>
//     </section>
//   );
// };

// export default MainBanner;

import React from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";

const MainBanner = () => {
  const { settings } = useAppContext();
  const navigate = useNavigate();

  const gradientStyle =
    "bg-gradient-to-r from-purple-600 via-pink-600 to-red-500";

  const desktopBanner = settings?.homepage?.bannerTopImageWeb?.url;
  const mobileBanner = settings?.homepage?.bannerTopImageMob?.url;

  return (
    <section
      className={`relative w-full h-[380px] sm:h-[480px] md:h-[540px] lg:h-[640px] overflow-hidden ${
        !desktopBanner && !mobileBanner ? gradientStyle : ""
      }`}
    >
      {/* Desktop Banner Image */}
      {desktopBanner && (
        <img
          src={desktopBanner}
          alt="Main Banner Desktop"
          className="hidden md:block absolute inset-0 w-full h-full object-cover object-center"
        />
      )}

      {/* Mobile Banner Image */}
      {mobileBanner ? (
        <img
          src={mobileBanner}
          alt="Main Banner Mobile"
          className="block md:hidden absolute inset-0 w-full h-full object-cover object-center"
        />
      ) : (
        /* Fallback if mobile banner is missing but desktop banner exists */
        desktopBanner && (
          <img
            src={desktopBanner}
            alt="Main Banner Mobile Fallback"
            className="block md:hidden absolute inset-0 w-full h-full object-cover object-center"
          />
        )
      )}

      {/* Dark Overlay for Text Readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30 md:bg-black/50" />

      {/* Banner Content Area */}
      <div className="relative z-10 h-full max-w-7xl mx-auto px-4 sm:px-6 md:px-12 lg:px-16 flex items-center">
        {/* Right-positioned block (ml-auto) with left-aligned contents (text-left) */}
        <div className="max-w-xl ml-auto mr-0 text-left text-white py-8 space-y-3 sm:space-y-4">
          {/* Title */}
          <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black leading-tight tracking-tight text-left">
            Quality You Can Feel,
            <br className="hidden sm:inline" />
            {" "}Style You'll Love!
          </h1>

          {/* Subtitle */}
          <p className="text-xs sm:text-base md:text-lg text-slate-200 leading-relaxed max-w-lg font-normal text-left">
            Discover premium collections crafted for comfort, quality, and
            everyday style.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col xs:flex-row items-stretch xs:items-center justify-start gap-3 sm:gap-4 pt-4 sm:pt-6">
            <button
              onClick={() => navigate("/products")}
              className="inline-flex justify-center items-center px-6 sm:px-8 py-3 rounded-xl bg-primary hover:bg-primary-dull text-white text-xs sm:text-sm font-semibold shadow-lg shadow-black/20 active:scale-95 transition-all duration-200 cursor-pointer"
            >
              Shop Now
            </button>

            <button
              onClick={() => navigate("/products")}
              className="inline-flex justify-center items-center px-6 sm:px-8 py-3 rounded-xl border border-white/80 text-white text-xs sm:text-sm font-semibold hover:bg-white hover:text-slate-900 backdrop-blur-xs active:scale-95 transition-all duration-200 cursor-pointer"
            >
              Explore Deals
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MainBanner;