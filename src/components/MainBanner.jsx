import React from "react";
import { assets } from "../assets/assets";
import { Link } from "react-router-dom";
import { useAppContext } from "../context/AppContext";

const MainBanner = () => {
  const { settings } = useAppContext();

  // Fallback gradient style
  const gradientStyle =
    "bg-gradient-to-r from-purple-500 via-pink-500 to-red-500";

  // Get banner images if available
  const desktopBanner = settings?.homepage?.bannerTopImageWeb?.url;
  const mobileBanner = settings?.homepage?.bannerTopImageMob?.url;
  return (
    <div
      className={`relative ${
        !desktopBanner && gradientStyle
      } min-h-[400px] md:min-h-[500px]`}
    >
      {desktopBanner && (
        <img
          src={desktopBanner}
          alt="banner"
          className="w-full hidden md:block object-contain"
        />
      )}
      {mobileBanner && (
        <img
          src={mobileBanner}
          alt="banner"
          className="w-full md:hidden object-contain"
        />
      )}

      <div className="absolute inset-0 flex flex-col items-center md:items-start justify-end md:justify-start lg:justify-center pb-24 md:pb-0 px-8 md:pl-18 lg:pl-24">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center md:text-left max-w-72 md:max-w-80 lg:max-w-105 leading-tight lg:leading-15">
          Quality You Can Feel, Style You’ll Love!{" "}
        </h1>

        <div className="flex items-center mt-6 font-medium">
          <Link
            to={"/products"}
            className="group flex items-center gap-2 px-7 md:px-9 py-3 bg-primary hover:bg-primary-dull transition rounded text-white cursor-pointer"
          >
            Shop now
            <img
              className="md:hidden transition group-focus:translate-x-2"
              src={assets.white_arrow_icon}
              alt="arrow"
            />
          </Link>

          <Link
            to={"/products"}
            className="group hidden md:flex items-center gap-2 px-9 py-3 cursor-pointer"
          >
            Explore deals
            <img
              className="transition group-hover:translate-x-1"
              src={assets.black_arrow_icon}
              alt="arrow"
            />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MainBanner;
