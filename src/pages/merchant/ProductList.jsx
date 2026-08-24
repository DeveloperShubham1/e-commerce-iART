// pages/merchant/ProductList.jsx or components/merchant/ProductList.jsx
import React, { useEffect, useState, useMemo, useRef } from "react";
import { useAppContext } from "../../context/AppContext";
import { toast } from "react-toastify";
import { Link as LinkIcon } from "lucide-react";
import EditProductModal from "../../components/merchant/EditProductModal";
import ConfirmModal from "../../functions/ConfirmModal";
import ProductCardShimmer from "../../components/merchant/skeletons/ProductCardShimmer";
import { useInstagramConfig } from "@/services/merchant";

const ProductList = () => {
  const { axios, currency } = useAppContext();
  const { data, isLoading } = useInstagramConfig();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  const [filters, setFilters] = useState({
    isActive: "all",
    categoryId: "",
    subcategoryId: "",
    size: "",
  });

  const abortControllerRef = useRef(null);

  const [showFilterModal, setShowFilterModal] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 12;
  const [totalPages, setTotalPages] = useState(1);

  const [editProduct, setEditProduct] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // Filter subcategories based on selected category
  const filteredSubcategories = useMemo(() => {
    if (!filters.categoryId) return subcategories;
    return subcategories.filter(
      (sub) => sub.categoryId?._id === filters.categoryId
    );
  }, [subcategories, filters.categoryId]);

  useEffect(() => {
    setFilters((prev) => ({ ...prev, subcategoryId: "" }));
  }, [filters.categoryId]);

  useEffect(() => {
    setPage(1);
  }, [search, filters]);

  // FETCH PRODUCTS
  const fetchProducts = async () => {
    // Abort previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      setLoading(true);
      console.log("true");
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search: debouncedSearch.trim(),
      });

      if (filters.isActive !== "all")
        params.append("isActive", filters.isActive);
      if (filters.categoryId) params.append("categoryId", filters.categoryId);
      if (filters.subcategoryId)
        params.append("subcategoryId", filters.subcategoryId);
      if (filters.size.trim())
        params.append("size", filters.size.trim().toUpperCase());

      const { data } = await axios.get(
        `/api/products/list?${params.toString()}`,
        {
          signal: controller.signal, // 👈 important
        }
      );

      if (data.success) {
        setProducts(data.products || []);
        setTotalPages(data.totalPages || 1);
      } else {
        toast.error(data.message || "Failed to load products");
      }
    } catch (error) {
      if (error.name === "CanceledError") {
        // Request aborted → silently ignore
        return;
      }
      toast.error(error.response?.data?.message || "Network error");
      setProducts([]);
    } finally {
      console.log("false");
      // setLoading(false);
      setInitialLoad(false);
    }
  };

  // FETCH CATEGORIES & SUBCATEGORIES
  const fetchCategories = async () => {
    try {
      const { data } = await axios.get("/api/categories");
      if (data.success) setCategories(data.categories || []);
    } catch (err) {
      toast.error("Failed to load categories");
    }
  };

  const fetchSubcategories = async () => {
    try {
      const { data } = await axios.get("/api/subcategories");
      if (data.success) setSubcategories(data.subcategories || []);
    } catch (err) {
      toast.error("Failed to load subcategories");
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchSubcategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [page, debouncedSearch, filters]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // TOGGLE ACTIVE STATUS
  const toggleActive = async (id, current) => {
    try {
      const { data } = await axios.put(`/api/products/update/${id}`, {
        isActive: !current,
      });

      if (data.success) {
        toast.success("Status updated");
        fetchProducts();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Update failed");
    }
  };

  // DELETE PRODUCT
  const handleDelete = (id) => {
    setDeleteId(id);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    try {
      const { data } = await axios.delete(`/api/products/delete/${deleteId}`);
      if (data.success) {
        toast.success("Product deleted successfully");
        fetchProducts();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Delete failed");
    } finally {
      setConfirmOpen(false);
      setDeleteId(null);
    }
  };

  const handleClearFilters = () => {
    setFilters({
      isActive: "all",
      categoryId: "",
      subcategoryId: "",
      size: "",
    });
    setShowFilterModal(false);
  };

  // Helper: Get total variants count
  const getVariantInfo = (product) => {
    const colors = [
      ...new Set(product.variants?.map((v) => v.color).filter(Boolean)),
    ];
    const totalSizes =
      product.variants?.reduce((acc, v) => acc + (v.sizes?.length || 0), 0) ||
      0;
    return { colors: colors.length, totalSizes };
  };

  const handleCopyLink = async (product) => {
    const category = product.categoryId?.name
      ?.toLowerCase()
      .replace(/\s+/g, "-"); // Suit -> suit, Men's Wear -> men's-wear

    const productUrl = `${data?.instagram?.siteBaseUrl}/products/${category}/${product._id}`;

    try {
      await navigator.clipboard.writeText(productUrl);
      toast.success("Product link copied!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to copy link");
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-hidden">
        {/* Sticky Header */}
        <div className="bg-white shadow-sm p-6 mb-6 flex-shrink-0 z-10 rounded-xl mx-6 mt-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Products</h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage your product catalog ({products.length} shown)
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <input
                type="text"
                placeholder="Search by name or SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
              />

              <button
                onClick={() => setShowFilterModal(true)}
                className="px-5 py-2.5 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition flex items-center gap-2"
              >
                Filters
                {Object.values(filters).some((v, i) => i !== 0 && v) && (
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Products Area */}
        <div className="flex-1 overflow-y-auto px-6 py-6">

        {/* Products Grid / Table */}
        {initialLoad ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <ProductCardShimmer key={i} />
            ))}
          </div>
        ) : products.length === 0 && filters.isActive != "all" ? (
          <div className="text-center py-20">
            <div className="text-gray-400 text-6xl mb-4">No products found</div>
            <p className="text-gray-600">
              Try adjusting your filters or add a new product.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => {
              const { colors, totalSizes } = getVariantInfo(product);
              const firstImage =
                product.variants?.[0]?.images?.[
                product?.variants?.[0]?.thumbnailIndex
                ] || "/no-image.png";

              return (
                <div
                  key={product._id}
                  className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden group"
                >
                  <div className="relative aspect-square bg-gray-100">
                    <img
                      src={firstImage}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />

                    {/* Status Badge */}
                    <span
                      className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-medium ${product.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                        }`}
                    >
                      {product.isActive ? "Active" : "Inactive"}
                    </span>

                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-3">
                      <button
                        onClick={() => setEditProduct(product)}
                        className="px-4 py-2 bg-white text-gray-800 rounded-lg font-medium hover:bg-gray-100"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => handleDelete(product._id)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {product.name}
                    </h3>

                    <p className="text-sm text-gray-500 mt-1">
                      SKU: <span className="font-medium">{product.sku || "—"}</span>
                    </p>

                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-600">
                      <span>
                        {colors} color{colors > 1 ? "s" : ""}
                      </span>
                      <span>•</span>
                      <span>
                        {totalSizes} size{totalSizes > 1 ? "s" : ""}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Status</span>

                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={product.isActive}
                            onChange={() =>
                              toggleActive(product._id, product.isActive)
                            }
                            className="sr-only peer"
                          />
                          <div className="w-10 h-5 bg-gray-300 rounded-full peer-checked:bg-green-600 transition"></div>
                          <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                        </label>
                      </div>

                      <button
                        onClick={() => handleCopyLink(product)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-cyan-700 bg-cyan-50 rounded-md hover:bg-cyan-100 transition"
                      >
                        <LinkIcon size={15} />
                        Copy Link
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-3 mt-10">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-5 py-2.5 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-700">
              Page <strong>{page}</strong> of <strong>{totalPages}</strong>
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-5 py-2.5 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        )}
        </div>{/* end scrollable area */}

      {/* Filter Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold mb-5">Filter Products</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={filters.isActive}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      isActive: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Products</option>
                  <option value="true">Active Only</option>
                  <option value="false">Inactive Only</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={filters.categoryId}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      categoryId: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subcategory
                </label>
                <select
                  value={filters.subcategoryId}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      subcategoryId: e.target.value,
                    }))
                  }
                  disabled={!filters.categoryId}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="">All Subcategories</option>
                  {filteredSubcategories.map((sub) => (
                    <option key={sub._id} value={sub._id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Size
                </label>
                <input
                  type="text"
                  placeholder="e.g. M, L, XL"
                  value={filters.size}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, size: e.target.value }))
                  }
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button
                onClick={handleClearFilters}
                className="px-5 py-2.5 border rounded-lg hover:bg-gray-50"
              >
                Clear All
              </button>
              <button
                onClick={() => setShowFilterModal(false)}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editProduct && (
        <EditProductModal
          product={editProduct}
          onClose={() => setEditProduct(null)}
          onUpdated={fetchProducts}
          axios={axios}
          categories={categories}
          subcategories={subcategories}
        />
      )}

      {/* Delete Confirm Modal */}
      <ConfirmModal
        isOpen={confirmOpen}
        title="Delete Product?"
        message="This action cannot be undone. All variants and images will be removed."
        onConfirm={confirmDelete}
        onCancel={() => {
          setConfirmOpen(false);
          setDeleteId(null);
        }}
      />
    </div>
  );
};

export default ProductList;
