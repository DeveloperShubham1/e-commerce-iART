import React from "react";
import { assets } from "../assets/assets";
import { Link } from "react-router-dom";
import { useAppContext } from "../context/AppContext";

const MainBanner = () => {
  const { settings } = useAppContext();

  const gradientStyle =
    "bg-gradient-to-r from-purple-500 via-pink-500 to-red-500";

  const desktopBanner = settings?.homepage?.bannerTopImageWeb?.url;
  const mobileBanner = settings?.homepage?.bannerTopImageMob?.url;

  return (
    <section
      className={`relative w-full h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px] overflow-hidden ${!desktopBanner ? gradientStyle : ""
        }`}
    >
      {/* Desktop Banner */}
      {desktopBanner && (
        <img
          src={desktopBanner}
          alt="Banner"
          className="hidden md:block absolute inset-0 w-full h-full object-cover"
        />
      )}

      {/* Mobile Banner */}
      {mobileBanner && (
        <img
          src={mobileBanner}
          alt="Banner"
          className="block md:hidden absolute inset-0 w-full h-full object-cover"
        />
      )}

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/35" />

      {/* Content */}
      <div className="relative z-10 h-full flex items-center">
        <div className="max-w-7xl mx-auto w-full px-6 md:px-12 lg:px-20">
          <div className="max-w-xl text-white">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              Quality You Can Feel,
              <br />
              Style You'll Love!
            </h1>

            <p className="mt-4 text-sm sm:text-base md:text-lg text-white/90">
              Discover premium collections crafted for comfort, quality, and
              everyday style.
            </p>

            <div className="flex flex-wrap gap-4 mt-8">
              <Link
                to="/products"
                className="px-7 py-3 rounded-lg bg-primary hover:bg-primary-dull transition text-white font-medium"
              >
                Shop Now
              </Link>

              <Link
                to="/products"
                className="px-7 py-3 rounded-lg border border-white text-white hover:bg-white hover:text-black transition font-medium"
              >
                Explore Deals
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MainBanner;