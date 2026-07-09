import { useEffect, useMemo, useRef, useState } from "react";
import {
  X,
  Instagram,
  Loader2,
  CheckCircle2,
  Search,
  Package,
  ImageOff,
  AlertCircle,
} from "lucide-react";
import { useCreateInstagramProduct } from "../../services/instaProduct";
import { useInstagramPosts } from "../../services/instaProduct";
import { useProductList } from "../../services/products";
import { toast } from "react-toastify";

/** Safely pulls the first variant image without throwing on missing data. */
function getProductThumbnail(product) {
  return product?.variants?.[0]?.images?.[0] || null;
}

function formatPostDate(timestamp) {
  if (!timestamp) return "";
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function CreateInstagramProductModal({ onClose }) {
  const [form, setForm] = useState({
    instagram_media_id: "",
    product_id: "",
    product_url: "",
    title: "",
  });
  const [errors, setErrors] = useState({});
  const [postSearch, setPostSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");

  const searchInputRef = useRef(null);
  const dialogRef = useRef(null);

  const mutation = useCreateInstagramProduct();
  const { data: postsData, isLoading: postsLoading, isError: postsFailed } = useInstagramPosts();

  const {
    data: productsData,
    isLoading: productsLoading,
    isError: productsFailed,
  } = useProductList({ page: 1, limit: 1000 });

  const posts = postsData?.data || [];
  const products = productsData?.products || [];

  // Autofocus the post search field so keyboard users land somewhere useful.
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Close on Escape, but not while a submission is in flight.
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !mutation.isPending) onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, mutation.isPending]);

  const filteredPosts = useMemo(() => {
    const term = postSearch.trim().toLowerCase();
    if (!term) return posts;
    return posts.filter(
      (post) =>
        post.caption?.toLowerCase().includes(term) || post.id.toLowerCase().includes(term)
    );
  }, [posts, postSearch]);

  const filteredProducts = useMemo(() => {
    const term = productSearch.trim().toLowerCase();
    if (!term) return products;
    return products.filter((p) => p.name.toLowerCase().includes(term));
  }, [products, productSearch]);

  const selectedPost = useMemo(
    () => posts.find((p) => p.id === form.instagram_media_id) || null,
    [posts, form.instagram_media_id]
  );
  const selectedProduct = useMemo(
    () => products.find((p) => p._id === form.product_id) || null,
    [products, form.product_id]
  );
  const selectedProductImage = getProductThumbnail(selectedProduct);

  const validate = () => {
    const e = {};
    if (!form.instagram_media_id) e.instagram_media_id = "Select an Instagram post to continue.";
    if (!form.product_id) e.product_id = "Select a product to continue.";
    return e;
  };

  const selectPost = (postId) => {
    setForm((prev) => ({ ...prev, instagram_media_id: postId }));
    setErrors((prev) => ({ ...prev, instagram_media_id: null, general: null }));
  };

  const selectProduct = (product) => {
    const category = product.categoryId?.name?.toLowerCase()?.replace(/\s+/g, "-") || "product";
    setForm((prev) => ({
      ...prev,
      product_id: product._id,
      product_url: `https://eshop.iarttechnologies.com/products/${category}/${product._id}`,
      title: product.name,
    }));
    setErrors((prev) => ({ ...prev, product_id: null, general: null }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    mutation.mutate(form, {
      onSuccess: (data) => {
        toast.success(
          data?.message || "Instagram product mapping created successfully!"
        );
        onClose();
      },
      onError: (err) =>
        setErrors({ general: err?.response?.data?.message || "Failed to create mapping. Try again." }),
    });
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !mutation.isPending) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-in fade-in duration-150"
      onMouseDown={handleBackdropClick}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ig-mapping-title"
        className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[92vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center shrink-0">
              <Instagram className="text-purple-600" size={22} />
            </div>
            <div>
              <h2 id="ig-mapping-title" className="text-xl font-semibold text-gray-900 leading-tight">
                Create product mapping
              </h2>
              <p className="text-sm text-gray-500">Link an Instagram post to a product</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col min-h-0">
          {errors.general && (
            <div
              role="alert"
              className="mx-8 mt-5 flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm"
            >
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <span>{errors.general}</span>
            </div>
          )}

          <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-6 p-6 md:p-8">
            {/* LEFT: Instagram Posts */}
            <div className="flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-4 gap-4 shrink-0">
                <h3 className="font-semibold text-gray-800">
                  Instagram post
                  {form.instagram_media_id && (
                    <CheckCircle2 size={16} className="inline text-purple-600 ml-1.5 -mt-0.5" />
                  )}
                </h3>
                <span className="text-xs text-gray-400">{filteredPosts.length} of {posts.length}</span>
              </div>

              <div className="relative mb-4 shrink-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search by caption or ID..."
                  value={postSearch}
                  onChange={(e) => setPostSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-300 transition-colors"
                />
              </div>

              <div className="flex-1 overflow-y-auto pr-1 -mr-1">
                {postsFailed ? (
                  <EmptyState
                    icon={<AlertCircle size={28} />}
                    title="Couldn't load posts"
                    subtitle="Check your connection and try again."
                  />
                ) : postsLoading ? (
                  <div className="grid grid-cols-2 gap-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="aspect-square rounded-2xl bg-gray-500 animate-blink" />
                    ))}
                  </div>
                ) : filteredPosts.length === 0 ? (
                  <EmptyState
                    icon={<Instagram size={28} />}
                    title={posts.length === 0 ? "No posts available" : "No matches found"}
                    subtitle={posts.length === 0 ? "Connect an Instagram account first." : "Try a different search term."}
                  />
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {filteredPosts.map((post) => {
                      const isSelected = form.instagram_media_id === post.id;
                      return (
                        <button
                          key={post.id}
                          type="button"
                          onClick={() => selectPost(post.id)}
                          aria-pressed={isSelected}
                          className={`group relative border rounded-2xl overflow-hidden text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 ${isSelected
                            ? "border-purple-600 ring-2 ring-purple-100"
                            : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                            }`}
                        >
                          <div className="aspect-square relative bg-gray-100">
                            <img
                              src={post.thumbnail_url || post.media_url}
                              alt={post.caption ? post.caption.slice(0, 60) : "Instagram post"}
                              loading="lazy"
                              className="w-full h-full object-cover"
                            />
                            {isSelected && (
                              <div className="absolute inset-0 bg-purple-600/10" />
                            )}
                            {isSelected && (
                              <div className="absolute top-2.5 right-2.5 bg-purple-600 text-white rounded-full p-1 shadow-sm">
                                <CheckCircle2 size={16} />
                              </div>
                            )}
                          </div>
                          <div className="p-2.5">
                            <p className="text-xs line-clamp-2 text-gray-700 leading-snug">
                              {post.caption || "No caption"}
                            </p>
                            <p className="text-[11px] text-gray-400 mt-1.5">
                              {formatPostDate(post.timestamp)}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {errors.instagram_media_id && (
                <p className="text-red-500 text-xs mt-2 shrink-0">{errors.instagram_media_id}</p>
              )}
            </div>

            {/* RIGHT: Products */}
            <div className="flex flex-col min-h-0 mt-8 md:mt-0 pt-8 md:pt-0 border-t md:border-t-0 border-gray-100">
              <div className="flex items-center justify-between mb-4 gap-4 shrink-0">
                <h3 className="font-semibold text-gray-800">
                  Product
                  {form.product_id && (
                    <CheckCircle2 size={16} className="inline text-purple-600 ml-1.5 -mt-0.5" />
                  )}
                </h3>
                <span className="text-xs text-gray-400">
                  {filteredProducts.length} of {products.length}
                </span>
              </div>

              <div className="relative mb-4 shrink-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-300 transition-colors"
                />
              </div>

              <div className="flex-1 overflow-y-auto pr-1 -mr-1 min-h-[160px]">
                {productsFailed ? (
                  <EmptyState
                    icon={<AlertCircle size={28} />}
                    title="Couldn't load products"
                    subtitle="Check your connection and try again."
                  />
                ) : productsLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="h-16 rounded-xl bg-gray-500 animate-blink" />
                    ))}
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <EmptyState
                    icon={<Package size={28} />}
                    title={products.length === 0 ? "No products available" : "No matches found"}
                    subtitle={products.length === 0 ? "Add a product to your catalog first." : "Try a different search term."}
                  />
                ) : (
                  <ul className="space-y-2">
                    {filteredProducts.map((product) => {
                      const isSelected = form.product_id === product._id;
                      const thumb = getProductThumbnail(product);
                      return (
                        <li key={product._id}>
                          <button
                            type="button"
                            onClick={() => selectProduct(product)}
                            aria-pressed={isSelected}
                            className={`w-full flex items-center gap-3 border rounded-xl p-2.5 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 ${isSelected
                              ? "border-purple-600 bg-purple-50/60 ring-1 ring-purple-100"
                              : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                              }`}
                          >
                            <div className="w-11 h-11 rounded-lg bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                              {thumb ? (
                                <img src={thumb} alt="" loading="lazy" className="w-full h-full object-cover" />
                              ) : (
                                <ImageOff size={16} className="text-gray-300" />
                              )}
                            </div>
                            <span className="text-sm text-gray-800 leading-snug line-clamp-2 flex-1">
                              {product.name}
                            </span>
                            {isSelected && (
                              <CheckCircle2 size={18} className="text-purple-600 shrink-0" />
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {errors.product_id && (
                <p className="text-red-500 text-xs mt-2 shrink-0">{errors.product_id}</p>
              )}

              {/* Read-only derived fields */}
              <div className="grid grid-cols-1 gap-4 mt-5 pt-5 border-t border-gray-100 shrink-0">
                <div>
                  <label htmlFor="product_url" className="block text-xs font-medium text-gray-500 mb-1.5">
                    Product URL
                  </label>
                  <input
                    id="product_url"
                    readOnly
                    value={form.product_url}
                    placeholder="Select a product to generate a URL"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-600 truncate"
                  />
                </div>

                <div>
                  <label htmlFor="title" className="block text-xs font-medium text-gray-500 mb-1.5">
                    Display title
                  </label>
                  <input
                    id="title"
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="Shown alongside the product tag"
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-300 transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 px-8 py-5 flex items-center justify-end gap-3 bg-gray-50 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={mutation.isPending}
              className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-white transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending || !form.instagram_media_id || !form.product_id}
              className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-medium text-sm flex items-center gap-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Creating mapping...
                </>
              ) : (
                "Create mapping"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EmptyState({ icon, title, subtitle }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-4 text-gray-400">
      <div className="mb-3">{icon}</div>
      <p className="text-sm font-medium text-gray-600">{title}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  );
}