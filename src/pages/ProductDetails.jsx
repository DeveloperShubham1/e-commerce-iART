import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { assets } from "../assets/assets";
import ProductCard from "../components/ProductCard";
import { exchangeInstagramToken } from "../api";
import { toast } from "react-toastify";
import SizeChartDialog from "../components/Sizechartdialog";

const ProductDetails = () => {
  const { products, navigate, currency, addToCart, cartItems, fetchUser } =
    useAppContext();
  const { id } = useParams();
  const [searchParams] = useSearchParams();

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
          toast.success("Login successfull as guest!")
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
          `${window.location.pathname}${query ? `?${query}` : ""}`
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
  // useEffect(() => {
  //   if (product && products.length > 0) {
  //     const filtered = products.filter(
  //       (p) =>
  //         p.categoryId._id === product.categoryId._id && p._id !== product._id,
  //     );
  //     setRelatedProducts(filtered.slice(0, 5));
  //   }
  // }, [product, products]);

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

    addToCart(
      product._id,
      selectedVariant._id,
      selectedSize.size, // ✅ IMPORTANT (string)
      1,
    );
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

  return (
    <div className="mt-12 px-4 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <p className="text-sm text-gray-500">
        <Link to="/">Home</Link> / <Link to="/products">Products</Link> /{" "}
        <span className="text-primary">{product.name}</span>
      </p>

      <div className="flex flex-col md:flex-row gap-12 mt-6">
        {/* ---------------- IMAGES ---------------- */}
        <div className="flex gap-4">
          <div className="flex flex-col gap-3">
            {selectedVariant?.images?.map((img, idx) => (
              <div
                key={idx}
                onClick={() => setThumbnail(img)}
                className="border w-20 h-20 cursor-pointer rounded overflow-hidden"
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>

          <div className="border rounded max-w-md overflow-hidden">
            <img src={thumbnail} alt="" className="w-full object-cover" />
          </div>
        </div>

        {/* ---------------- PRODUCT INFO ---------------- */}
        <div className="flex flex-col gap-4 w-full md:w-1/2">
          <h1 className="text-3xl font-medium">{product.name}</h1>

          {/* Rating */}
          <div className="flex gap-1">
            {Array(5)
              .fill("")
              .map((_, i) => (
                <img
                  key={i}
                  src={i < 4 ? assets.star_icon : assets.star_dull_icon}
                  className="w-4"
                  alt=""
                />
              ))}
          </div>

          {/* Price */}
          <div>
            <p className="text-gray-500 line-through">
              MRP: {currency}
              {selectedSize?.price}
            </p>

            <p className="text-2xl font-semibold">
              {currency}
              {finalPrice}
              {selectedSize?.offerPrice > 0 && (
                <span className="ml-2 text-green-600 text-sm">
                  ({selectedSize.offerPrice}% OFF)
                </span>
              )}
            </p>

            <span className="text-gray-500 text-sm">
              (inclusive of all taxes)
            </span>
          </div>

          {/* Description */}
          <p className="font-medium mt-4">About Product</p>
          <p className="text-gray-500">{product.description}</p>

          {/* ---------------- VARIANT ---------------- */}
          <div>
            <p className="font-medium">Select Color</p>
            <div className="flex gap-2 mt-2">
              {product.variants.map((v) => (
                <button
                  key={v._id}
                  onClick={() => setSelectedVariant(v)}
                  style={{ backgroundColor: v.colorCode }}
                  className={`w-8 h-8 rounded-full border-2
                    ${selectedVariant?._id === v._id
                      ? "ring-2 ring-primary"
                      : ""
                    }`}
                />
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-4">
              <p className="font-medium">Select Size</p>
              <SizeChartDialog />
            </div>
            <div className="flex gap-2 mt-2 flex-wrap">
              {selectedVariant?.sizes.map((s) => (
                <button
                  key={s._id}
                  disabled={s.stock === 0}
                  onClick={() => setSelectedSize(s)}
                  className={`px-4 py-1 border rounded transition
                    ${selectedSize?._id === s._id
                      ? "bg-primary text-white"
                      : "hover:bg-gray-200"
                    }
                    ${s.stock === 0 ? "opacity-40 cursor-not-allowed" : ""}
                  `}
                >
                  {s.size}
                </button>
              ))}
            </div>
          </div>

          {/* ---------------- ACTIONS ---------------- */}
          <div className="flex gap-4 mt-6">
            {!cartItem ? (
              /* ---------- NOT IN CART ---------- */
              <>
                <button
                  onClick={handleAddToCart}
                  disabled={!selectedSize}
                  className="w-full py-3 bg-gray-100 hover:bg-gray-200"
                >
                  Add to Cart
                </button>

                {/* <button
                  onClick={() => {
                    handleAddToCart();
                    navigate("/cart");
                  }}
                  className="w-full py-3 bg-primary text-white hover:bg-primary-dull"
                >
                  Buy Now
                </button> */}
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
                        qty: 1, // You can change this to a state if you allow quantity selection
                      },
                    });
                  }}
                  disabled={!selectedVariant || !selectedSize}
                  className="w-full py-3 bg-primary text-white hover:bg-primary-dull disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                >
                  Buy Now
                </button>
              </>
            ) : (
              /* ---------- ALREADY IN CART ---------- */
              <div className="w-full flex flex-col gap-2">
                <p className="text-green-600 font-medium">
                  ✅ Already in cart (Qty: {cartItem.quantity})
                </p>

                <button
                  onClick={() => navigate("/cart")}
                  className="w-full py-3 bg-primary text-white hover:bg-primary-dull"
                >
                  Go to Cart
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ---------------- RELATED PRODUCTS ---------------- */}
      {/* ---------------- RELATED VARIANTS ---------------- */}
      <div className="mt-20">
        <h2 className="text-2xl font-medium text-center">Other Variants</h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-6">
          {product?.variants
            .filter((v) => v._id !== selectedVariant?._id) // exclude current variant
            .map((variant) => (
              <ProductCard
                key={variant._id}
                item={{
                  productId: product._id,
                  name: product.name,
                  brand: product.brand,
                  categoryId: product.categoryId,
                  subcategoryId: product.subcategoryId,
                  rating: 4,
                  variant: variant,
                }}
              />
            ))}
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
