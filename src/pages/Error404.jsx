import React from "react";
import { useNavigate } from "react-router-dom";

const Error404 = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white text-gray-800">
      <div className="text-center px-6">
        {/* Animated 404 */}
        <h1 className="text-[120px] md:text-[160px] font-extrabold text-primary animate-bounce">
          404
        </h1>

        {/* Fade in text */}
        <p className="mt-4 text-xl md:text-2xl font-semibold animate-fade-in">
          Page Not Found
        </p>

        <p className="mt-2 text-gray-500 max-w-md mx-auto animate-fade-in delay-150">
          Sorry, the page you are looking for doesn’t exist or has been moved.
        </p>

        {/* Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center animate-fade-in delay-300">
          {/* <button
            onClick={() => navigate("/")}
            className="px-6 py-3 rounded-lg bg-primary text-white font-medium shadow hover:bg-primary/90 transition-all duration-300"
          >
            Go Home
          </button> */}

          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 rounded-lg bg-primary text-white font-medium shadow hover:bg-primary/90 transition-all duration-300 cursor-pointer"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default Error404;
