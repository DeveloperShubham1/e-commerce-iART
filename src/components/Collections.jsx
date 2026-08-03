import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAppContext } from "../context/AppContext";
import ProductCard from "./ProductCard";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

// Rotating tab colors for inactive tabs (active tab is always bold + underlined)
const Collections = ({ data: collections, loading }) => {

    const [activeId, setActiveId] = useState(null);
    const scrollRef = useRef(null);
    const navigate = useNavigate();

    const scrollByAmount = (direction) => {
        if (!scrollRef.current) return;
        const cardWidth = scrollRef.current.firstChild
            ? scrollRef.current.firstChild.offsetWidth + 16
            : 300;
        scrollRef.current.scrollBy({
            left: direction === "left" ? -cardWidth * 2 : cardWidth * 2,
            behavior: "smooth",
        });
    };

    useEffect(() => {
        if (collections?.length > 0 && !activeId) {
            setActiveId(collections[0]._id);
        }
    }, [collections, activeId]);

    // Turn the active collection's raw products into the flat item shape ProductCard expects
    const activeItems = useMemo(() => {
        const activeCollection = collections?.find((c) => c._id === activeId);
        if (!activeCollection || !Array.isArray(activeCollection.products)) return [];

        const finalList = [];

        activeCollection.products
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
                            rating: product.rating || 4.8,
                            variant,
                        });
                    });
                } else {
                    finalList.push({
                        productId: product._id,
                        name: product.name,
                        brand: product.brand,
                        categoryId: product.categoryId,
                        rating: product.rating || 4.8,
                        variant: product.variants[0],
                    });
                }
            });

        return finalList;
    }, [collections, activeId]);

    if (loading) {
        return (
            <div className="mt-16 text-center text-gray-500 animate-pulse">
                Loading collections...
            </div>
        );
    }

    if (collections?.length === 0) return null;

    return (
        <section className="mt-16 sm:mt-20 max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">

            <div className="text-center mb-8">
                <h2 className="text-3xl sm:text-4xl font-extrabold text-[var(--color-primary)] tracking-tight">
                    Collections
                </h2>
                <p className="mt-2 text-sm sm:text-base font-semibold text-gray-800 italic">
                    Shop by style, silhouette, and mood – find your perfect vibe.
                </p>
            </div>
            {/* Tabs */}
            <div
                className="flex items-center justify-start sm:justify-center gap-5 sm:gap-8
                   overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]"
            >
                {collections?.map((collection, index) => {
                    const isActive = collection._id === activeId;
                    return (
                        <button
                            key={collection._id}
                            type="button"
                            onClick={() => setActiveId(collection._id)}
                            className={`relative flex-shrink-0 pb-2 text-xs sm:text-sm tracking-wider uppercase
                          whitespace-nowrap transition-colors
                          ${isActive ? "font-bold text-slate-900" : `font-medium text-black-100`}
                          `}
                        >
                            {collection.name}
                            {isActive && (
                                <span className="absolute left-0 right-0 -bottom-0.5 h-[2px] bg-slate-900 rounded-full" />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Product Scrollable Row with Arrows */}
            {activeItems.length > 0 ? (
                <div className="relative mt-6 sm:mt-8">
                    {/* Left arrow - hidden on small screens */}
                    {activeItems.length > 6 && (
                        <button
                            type="button"
                            onClick={() => scrollByAmount("left")}
                            aria-label="Scroll left"
                            className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10
                                       w-10 h-10 rounded-full bg-black/70 hover:bg-black text-white
                                       items-center justify-center transition"
                        >
                            &#8592;
                        </button>
                    )}

                    {/* Scrollable row */}
                    <div
                        ref={scrollRef}
                        className="flex gap-4 overflow-x-auto scroll-smooth pb-2 px-1
                                   snap-x snap-mandatory
                                   [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                    >
                        {activeItems.map((item, index) => (
                            <div
                                key={`${item.productId}-${item.variant?._id || index}`}
                                className="w-[45%] xs:w-[42%] sm:w-[32%] md:w-[24%] lg:w-[19%] xl:w-[16%] min-w-[150px] flex-shrink-0 snap-start"
                            >
                                <ProductCard
                                    item={item}
                                    showBadge
                                    showWishlist
                                />
                            </div>
                        ))}
                    </div>

                    {/* Right arrow - hidden on small screens */}
                    {activeItems.length > 6 && (
                        <button
                            type="button"
                            onClick={() => scrollByAmount("right")}
                            aria-label="Scroll right"
                            className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10
                                       w-10 h-10 rounded-full bg-black/70 hover:bg-black text-white
                                       items-center justify-center transition"
                        >
                            &#8594;
                        </button>
                    )}

                    {/* Bottom CTA Link */}
                    <div className="mt-6 text-center sm:mt-8">
                        <button
                            onClick={() =>
                                navigate(
                                    `/collections/${activeId}`
                                    // {
                                    //     state: { name: activeCollection?.name }
                                    // }
                                )
                            }
                            className="inline-flex items-center gap-2 text-sm sm:text-base font-semibold text-primary underline transition hover:no-underline"
                        >
                            <span>Explore all items</span>
                            <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                                />
                            </svg>
                        </button>
                    </div>

                </div>
            ) : (
                <p className="text-center text-gray-500 mt-8">
                    No products found in this collection
                </p>
            )}
        </section>
    );
};

export default Collections;