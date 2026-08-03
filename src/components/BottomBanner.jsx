import React from "react";
import { features } from "../assets/assets";
import { useAppContext } from "../context/AppContext";

const BottomBanner = () => {
  const { settings } = useAppContext();

  // Gradient fallback (same idea as MainBanner)
  const gradientStyle =
    "bg-gradient-to-r from-purple-500 via-pink-500 to-red-500";

  const desktopBanner = settings?.homepage?.bannerBottomImageWeb?.url;
  const mobileBanner = settings?.homepage?.bannerBottomImageMob?.url;

  return (
    <section
      className={`relative mt-24 w-full overflow-hidden ${!desktopBanner && !mobileBanner ? gradientStyle : ""
        } h-[500px] sm:h-[480px] md:h-[450px] lg:h-[600px]`}
    >
      {/* Desktop Banner */}
      {desktopBanner && (
        <img
          src={desktopBanner}
          alt="banner"
          className="hidden md:block absolute inset-0 w-full h-full object-cover"
        />
      )}

      {/* Mobile Banner */}
      {mobileBanner && (
        <img
          src={mobileBanner}
          alt="banner"
          className="block md:hidden absolute inset-0 w-full h-full object-cover"
        />
      )}

      {/* Overlay so content stays readable regardless of image */}
      {/* {(desktopBanner || mobileBanner) && (
        <div className="absolute inset-0 bg-white/15 md:bg-gradient-to-l md:from-white/70 md:via-white/40 md:to-transparent" />
      )} */}

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center md:items-end md:justify-center px-6 md:pr-16 lg:pr-24">
        <div className="max-w-xs sm:max-w-sm bg-white/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/30 px-6 py-6 sm:px-8 sm:py-8 text-center md:text-left">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-primary mb-5 md:mb-6">
            Why We Are the Best?
          </h1>

          <div className="flex flex-col gap-4 sm:gap-5">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-4 text-left">
                <div className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-primary/10">
                  <img
                    src={feature.icon}
                    alt={feature.title}
                    className="w-5 sm:w-6"
                  />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-xs sm:text-sm mt-0.5">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default BottomBanner;