import React from "react";
import { assets, features } from "../assets/assets";
import { useAppContext } from "../context/AppContext";

const BottomBanner = () => {
  const { settings } = useAppContext();

  // Gradient fallback (same idea as MainBanner)
  const gradientStyle =
    "bg-gradient-to-r from-purple-500 via-pink-500 to-red-500";

  const desktopBanner = settings?.homepage?.bannerBottomImageWeb?.url;
  const mobileBanner = settings?.homepage?.bannerBottomImageMob?.url;

  return (
    <div
      className={`relative mt-24 ${
        !desktopBanner && gradientStyle
      } min-h-[350px] md:min-h-[450px]`}
    >
      {/* Desktop Banner */}
      {desktopBanner && (
        <img
          src={desktopBanner}
          alt="banner"
          className="w-full hidden md:block object-contain"
        />
      )}

      {/* Mobile Banner */}
      {mobileBanner && (
        <img
          src={mobileBanner}
          alt="banner"
          className="w-full md:hidden object-contain"
        />
      )}

      {/* Content */}
      <div className="absolute inset-0 flex flex-col items-center md:items-end md:justify-center pt-16 md:pt-0 md:pr-24">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-primary mb-6">
            Why We Are the Best?
          </h1>

          {features.map((feature, index) => (
            <div key={index} className="flex items-center gap-4 mt-2">
              <img
                src={feature.icon}
                alt={feature.title}
                className="md:w-11 w-9"
              />
              <div>
                <h3 className="text-lg md:text-xl font-semibold">
                  {feature.title}
                </h3>
                <p className="text-gray-500/70 text-xs md:text-sm">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BottomBanner;
