// components/merchant/EditProductModal.jsx
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { X } from "lucide-react";
import ntc from "@trihargianto/ntcjs";
const EditProductModal = ({
  product,
  onClose,
  onUpdated,
  axios,
  categories: propCategories = [],
  subcategories: propSubcategories = [],
}) => {
  const initialVariants = Array.isArray(product?.variants)
    ? product.variants.map((v) => ({
      color: v.color || "",
      colorCode: v.colorCode || "",
      isTrending: v.isTrending || false,
      trendingOrder: v.trendingOrder ?? "",
      thumbnailIndex: v.thumbnailIndex ?? 0, // ⭐ ADD
      existingImages: Array.isArray(v.images)
        ? v.images.map((url, idx) => ({
          url,
          key: v.imageKeys?.[idx] || null,
          toDelete: false,
        }))
        : [],
      newFiles: [],
      sizes: Array.isArray(v.sizes)
        ? v.sizes.map((s) => ({
          size: s.size || "",
          stock: Number(s.stock) || 0,
          price: s.price != null ? Number(s.price) : "",
          offerPrice: s.offerPrice != null ? Number(s.offerPrice) : 0,
          variantSku: s.variantSku || "",
        }))
        : [],
    }))
    : [
      {
        color: "",
        colorCode: "",
        existingImages: [],
        newFiles: [],
        sizes: [
          { size: "", stock: 0, price: "", offerPrice: "", variantSku: "" },
        ],
      },
    ];

  const [form, setForm] = useState({
    name: product?.name || "",
    description: product?.description || "",
    brand: product?.brand || "",
    sku: product?.sku || "",
    categoryId: product?.categoryId?._id || product?.categoryId || "",
    subcategoryId: product?.subcategoryId?._id || product?.subcategoryId || "",
    variants: initialVariants,
    isSeprate: product?.isSeprate || false, // ✅ ADD
  });

  const menTopSizes = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];

  const [categories, setCategories] = useState(propCategories);
  const [subcategories, setSubcategories] = useState(propSubcategories);
  const [loadingStage, setLoadingStage] = useState(null);
  const [color, setColor] = useState("");

  const handleColorChange = (e) => {
    const color = e.target.value;
    setColor("stickColor", color, { shouldValidate: true });
  };

  // Load categories/subcategories if not passed
  useEffect(() => {
    if (propCategories.length) return;
    axios
      .get("/api/categories")
      .then((res) => {
        if (res.data.success) setCategories(res.data.categories || []);
      })
      .catch(() => toast.error("Failed to load categories"));
  }, [axios, propCategories]);

  useEffect(() => {
    if (propSubcategories.length || !form.categoryId) return;
    axios
      .get(`/api/subcategories?categoryId=${form.categoryId}`)
      .then((res) => {
        if (res.data.success) setSubcategories(res.data.subcategories || []);
      })
      .catch(() => toast.error("Failed to load subcategories"));
  }, [form.categoryId, axios, propSubcategories]);

  const setField = (key, value) => setForm((p) => ({ ...p, [key]: value }));

  const addVariant = () =>
    setForm((p) => ({
      ...p,
      variants: [
        ...p.variants,
        {
          color: "",
          colorCode: "",
          isTrending: false,
          trendingOrder: "",
          existingImages: [],
          newFiles: [],
          sizes: [
            { size: "", stock: 0, price: "", offerPrice: "", variantSku: "" },
          ],
        },
      ],
    }));

  const removeVariant = (i) => {
    if (form.variants.length === 1) {
      toast.error("At least one variant is required");
      return;
    }
    setForm((p) => ({
      ...p,
      variants: p.variants.filter((_, idx) => idx !== i),
    }));
  };

  const updateVariant = (i, updates) =>
    setForm((p) => {
      const v = [...p.variants];
      v[i] = { ...v[i], ...updates };
      return { ...p, variants: v };
    });

  const addSize = (vi) =>
    updateVariant(vi, {
      sizes: [
        ...form.variants[vi].sizes,
        { size: "", stock: 0, price: "", offerPrice: "", variantSku: "" },
      ],
    });

  const removeSize = (vi, si) =>
    updateVariant(vi, {
      sizes: form.variants[vi].sizes.filter((_, i) => i !== si),
    });

  const updateSize = (vi, si, field, value) => {
    const numFields = ["stock", "price", "offerPrice"];
    const val =
      numFields.includes(field) && value !== "" ? Number(value) || 0 : value;
    const sizes = [...form.variants[vi].sizes];
    sizes[si] = { ...sizes[si], [field]: val };
    updateVariant(vi, { sizes });
  };

  const handleNewFilesAdd = (vi, files) => {
    const fileArr = Array.from(files || []);
    const totalImages = form.variants.reduce((sum, v, i) => {
      const kept = v.existingImages.filter((img) => !img.toDelete).length;
      const newCount =
        i === vi ? v.newFiles.length + fileArr.length : v.newFiles.length;
      return sum + kept + newCount;
    }, 0);

    if (totalImages > 5) {
      toast.error("Maximum 5 images allowed per product");
      return;
    }

    updateVariant(vi, {
      newFiles: [...form.variants[vi].newFiles, ...fileArr],
    });
  };

  const removeNewFile = (vi, fi) => {
    const v = form.variants[vi];
    const index = getAllImages(v).findIndex(
      (img) => img.type === "new" && img.file === v.newFiles[fi]
    );

    let newThumb = v.thumbnailIndex;
    if (v.thumbnailIndex === index) newThumb = 0;
    if (v.thumbnailIndex > index) newThumb -= 1;

    updateVariant(vi, {
      newFiles: v.newFiles.filter((_, i) => i !== fi),
      thumbnailIndex: newThumb,
    });
  };

  const toggleExistingImage = (vi, key) => {
    const v = form.variants[vi];

    const index = getAllImages(v).findIndex(
      (img) => img.type === "existing" && img.key === key
    );

    let newThumb = v.thumbnailIndex;
    if (v.thumbnailIndex === index) newThumb = 0;
    if (v.thumbnailIndex > index) newThumb -= 1;

    const images = v.existingImages.map((img) =>
      img.key === key ? { ...img, toDelete: !img.toDelete } : img
    );

    updateVariant(vi, {
      existingImages: images,
      thumbnailIndex: newThumb,
    });
  };

  const uploadFiles = async (files) => {
    if (!files.length) return [];
    const fd = new FormData();
    files.forEach((f) => fd.append("images", f));
    const { data } = await axios.post("/api/s3/upload", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    if (!data.success) throw new Error(data.message);
    return data.files || [];
  };

  const deleteS3Keys = async (keys) => {
    if (!keys.length) return;
    try {
      await axios.delete("/api/s3/delete-multiple", { data: { keys } });
    } catch (e) {
      console.warn("Failed to delete old images:", e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Frontend validation matching backend
    if (!form.name.trim()) return toast.error("Product name is required");
    if (!form.categoryId) return toast.error("Please select a category");

    if (!form.variants.length)
      return toast.error("At least one variant required");

    for (let vi = 0; vi < form.variants.length; vi++) {
      const v = form.variants[vi];
      if (!v.color?.trim())
        return toast.error(`Variant ${vi + 1}: Color is required`);
      if (!v.sizes?.length)
        return toast.error(`Variant ${vi + 1}: Add at least one size`);

      for (let si = 0; si < v.sizes.length; si++) {
        const s = v.sizes[si];
        if (!s.size?.trim())
          return toast.error(
            `Variant ${vi + 1}, Size ${si + 1}: Size is required`
          );
        if (!s.price || isNaN(s.price) || s.price <= 0) {
          return toast.error(
            `Variant ${vi + 1}, Size ${si + 1}: Valid price is required`
          );
        }
      }
    }

    try {
      setLoadingStage("Uploading images...");

      const removedKeys = [];
      const variantsPayload = [];

      for (const v of form.variants) {
        // Collect keys to delete
        v.existingImages.forEach((img) => {
          if (img.toDelete && img.key) removedKeys.push(img.key);
        });

        // Upload new files
        const uploaded = v.newFiles.length ? await uploadFiles(v.newFiles) : [];

        const keptImages = v.existingImages
          .filter((img) => !img.toDelete)
          .map((img) => ({ url: img.url, key: img.key }));

        const finalImages = [
          ...keptImages.map((i) => i.url),
          ...uploaded.map((u) => u.url),
        ];
        const finalKeys = [
          ...keptImages.map((i) => i.key).filter(Boolean),
          ...uploaded.map((u) => u.key),
        ];

        const finalSizes = v.sizes.map((s) => ({
          size: s.size.trim().toUpperCase(),
          stock: Number(s.stock) || 0,
          price: Number(s.price),
          offerPrice: Number(s.offerPrice ?? 0),
          variantSku: s.variantSku?.trim() || undefined,
        }));

        variantsPayload.push({
          color: v.color.trim(),
          colorCode: v.colorCode?.trim() || undefined,
          images: finalImages,
          imageKeys: finalKeys,
          thumbnailIndex: Math.min(v.thumbnailIndex, finalImages.length - 1), // ⭐ SAFE
          sizes: finalSizes,
          isTrending: v.isTrending,
          trendingOrder: v.isTrending ? v.trendingOrder : null,
        });
      }

      // Fire-and-forget delete old images
      if (removedKeys.length) deleteS3Keys(removedKeys);

      setLoadingStage("Saving product...");

      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        brand: form.brand.trim(),
        sku: form.sku.trim(),
        categoryId: form.categoryId,
        subcategoryId: form.subcategoryId || undefined,
        variants: variantsPayload,
        isSeprate: form.isSeprate, // ✅ ADD
      };

      const { data } = await axios.put(
        `/api/products/update/${product._id}`,
        payload
      );

      if (data.success) {
        toast.success("Product updated successfully!");
        onUpdated();
        onClose();
      } else {
        toast.error(data.message || "Update failed");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update product");
    } finally {
      setLoadingStage(null);
    }
  };

  const getAllImages = (v) => [
    ...v.existingImages
      .filter((i) => !i.toDelete)
      .map((i) => ({
        type: "existing",
        ...i,
      })),
    ...v.newFiles.map((f) => ({
      type: "new",
      file: f,
    })),
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-5 border-b">
          <h2 className="text-xl font-bold">Edit Product</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-5 grid md:grid-cols-2 gap-6"
        >
          {/* Left Column */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Product Name *
              </label>
              <input
                required
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Description
              </label>
              <textarea
                rows={4}
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Brand</label>
                <input
                  value={form.brand}
                  onChange={(e) => setField("brand", e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Main SKU
                </label>
                <input
                  value={form.sku}
                  onChange={(e) => setField("sku", e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Category *
              </label>
              <select
                required
                value={form.categoryId}
                onChange={(e) => {
                  setField("categoryId", e.target.value);
                  setField("subcategoryId", "");
                }}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Subcategory
              </label>
              <select
                value={form.subcategoryId}
                onChange={(e) => setField("subcategoryId", e.target.value)}
                disabled={!form.categoryId}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="">Select Subcategory (optional)</option>
                {subcategories.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3 mt-2">
              <input
                type="checkbox"
                checked={form.isSeprate}
                onChange={(e) => setField("isSeprate", e.target.checked)}
                className="w-4 h-4"
              />
              <label className="text-sm font-medium">
                Treat this product as Separate Item
              </label>
            </div>

            <p className="text-xs text-gray-500 ml-7">
              Enable this if this product should be handled independently (no
              variant grouping).
            </p>

            <div className="pt-4 border-t">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold">
                  Variants ({form.variants.length})
                </h3>
                <button
                  type="button"
                  onClick={addVariant}
                  className="text-blue-600 text-sm"
                >
                  + Add Variant
                </button>
              </div>
              <p className="text-xs text-gray-600">
                Max 5 images total across all variants
              </p>
            </div>
          </div>

          {/* Right Column - Variants */}
          <div className="space-y-6 overflow-y-auto">
            {form.variants.map((v, vi) => (
              <div key={vi} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex gap-3">
                    <input
                      required
                      placeholder="Color name"
                      value={v.color}
                      onChange={(e) =>
                        updateVariant(vi, { color: e.target.value })
                      }
                      className="border rounded px-3 w-[140px] py-1.5"
                    />

                    <input
                      type="text"
                      className="w-[100px] border rounded px-3"
                      value={v.colorCode}
                      disabled
                    />

                    <input
                      type="color"
                      value={v.colorCode || "#000000"}
                      onChange={(e) => {
                        const selectedHex = e.target.value;

                        // Get the REAL color name dynamically
                        const colorMatch = ntc.name(selectedHex);
                        const colorName = colorMatch[1]; // e.g., "Cornflower Blue", "Crimson", "Lime Green"

                        // Update both fields automatically
                        updateVariant(vi, {
                          color: colorName, // Exact human-readable name
                          colorCode: selectedHex, // Hex from picker
                        });
                      }}
                      className="border rounded w-[60px] h-10 cursor-pointer"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeVariant(vi)}
                    className="text-red-600 text-sm"
                  >
                    Remove
                  </button>
                </div>

                {/* Trending Controls */}
                <div className="mt-3 p-3 border rounded bg-white">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={v.isTrending}
                      onChange={(e) =>
                        updateVariant(vi, { isTrending: e.target.checked })
                      }
                      className="w-4 h-4"
                    />
                    <label className="text-sm font-medium">
                      Mark this variant as Top Selling Item
                    </label>
                  </div>

                  {v.isTrending && (
                    <div className="mt-2">
                      <label className="block text-xs font-medium mb-1">
                        Trending Priority (lower = higher rank)
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={v.trendingOrder}
                        onChange={(e) =>
                          updateVariant(vi, {
                            trendingOrder:
                              e.target.value === ""
                                ? ""
                                : Number(e.target.value),
                          })
                        }
                        className="w-32 border rounded px-2 py-1"
                        placeholder="1, 2, 3"
                      />
                    </div>
                  )}
                </div>

                {/* Images */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    Images
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {getAllImages(v).map((img, idx) => {
                      const isThumb = v.thumbnailIndex === idx;

                      return (
                        <div
                          key={idx}
                          onClick={() =>
                            updateVariant(vi, { thumbnailIndex: idx })
                          }
                          className={`relative cursor-pointer border-2 rounded ${isThumb ? "border-indigo-600" : "border-gray-200"
                            }`}
                        >
                          <img
                            src={
                              img.type === "existing"
                                ? img.url
                                : URL.createObjectURL(img.file)
                            }
                            alt=""
                            className="w-20 h-20 object-cover rounded"
                          />

                          {isThumb && (
                            <span className="absolute bottom-1 left-1 bg-indigo-600 text-white text-xs px-2 py-0.5 rounded">
                              Thumbnail
                            </span>
                          )}

                          {img.type === "existing" ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExistingImage(vi, img.key);
                              }}
                              className="absolute top-1 right-1 bg-white rounded-full p-1 shadow"
                            >
                              ×
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeNewFile(vi, v.newFiles.indexOf(img.file));
                              }}
                              className="absolute top-1 right-1 bg-white rounded-full p-1 shadow"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      );
                    })}

                    {/* Add Image Button */}
                    <label className="w-20 h-20 border-2 border-dashed rounded flex items-center justify-center cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => handleNewFilesAdd(vi, e.target.files)}
                        className="hidden"
                      />
                      +
                    </label>
                  </div>
                </div>

                {/* Sizes */}
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Sizes</span>
                    <button
                      type="button"
                      onClick={() => addSize(vi)}
                      className="text-blue-600 text-sm"
                    >
                      + Add
                    </button>
                  </div>
                  {/* {v.sizes.map((s, si) => (
                    <div
                      key={si}
                      className="grid grid-cols-12 gap-4 mb-2 items-center"
                    >
                      <select
                        required
                        value={s.size}
                        onChange={(e) =>
                          updateSize(vi, si, "size", e.target.value)
                        }
                        className="col-span-2 border rounded px-2 py-1"
                      >
                        <option value="">Select Size</option>
                        {menTopSizes.map((size) => (
                          <option key={size} value={size}>
                            {size}
                          </option>
                        ))}
                      </select>

                      <input
                        type="number"
                        placeholder="Stock"
                        value={s.stock}
                        onChange={(e) =>
                          updateSize(vi, si, "stock", e.target.value)
                        }
                        className="col-span-2 border rounded px-2 py-1"
                      />
                      <input
                        type="number"
                        required
                        placeholder="Price"
                        value={s.price}
                        onChange={(e) =>
                          updateSize(vi, si, "price", e.target.value)
                        }
                        className="col-span-2 border rounded px-2 py-1"
                      />
                      <input
                        type="number"
                        placeholder="Discount in %"
                        value={s.offerPrice || ""}
                        onChange={(e) =>
                          updateSize(vi, si, "offerPrice", e.target.value)
                        }
                        className="col-span-2 border rounded px-2 py-1 w-20"
                      />
                      <input
                        placeholder="Var SKU"
                        value={s.variantSku}
                        onChange={(e) =>
                          updateSize(vi, si, "variantSku", e.target.value)
                        }
                        className="col-span-2 border rounded px-2 py-1"
                      />
                      <button
                        type="button"
                        onClick={() => removeSize(vi, si)}
                        className="col-span-1 text-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))} */}

                  {v.sizes.map((s, si) => (
                    <div
                      key={si}
                      className="grid grid-cols-12 gap-4 mb-6 items-end" // increased mb for spacing
                    >
                      {/* Size */}
                      <div className="col-span-2">
                        <p className="text-xs text-gray-600 mb-1">Size</p>
                        <select
                          required
                          value={s.size}
                          onChange={(e) =>
                            updateSize(vi, si, "size", e.target.value)
                          }
                          className="w-full border rounded px-2 py-1"
                        >
                          <option value="">Select Size</option>
                          {menTopSizes.map((size) => (
                            <option key={size} value={size}>
                              {size}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Stock */}
                      <div className="col-span-2">
                        <p className="text-xs text-gray-600 mb-1">Stock</p>
                        <input
                          type="number"
                          placeholder="Stock"
                          value={s.stock}
                          onChange={(e) =>
                            updateSize(vi, si, "stock", Number(e.target.value))
                          }
                          className="w-full border rounded px-2 py-1"
                        />
                      </div>

                      {/* Price */}
                      <div className="col-span-2">
                        <p className="text-xs text-gray-600 mb-1">Price *</p>
                        <input
                          type="number"
                          required
                          placeholder="Price"
                          value={s.price}
                          onChange={(e) =>
                            updateSize(vi, si, "price", Number(e.target.value))
                          }
                          className="w-full border rounded px-2 py-1"
                        />
                      </div>

                      {/* Discount % */}
                      <div className="col-span-2">
                        <p className="text-xs text-gray-600 mb-1">
                          Discount (%)
                        </p>
                        <input
                          type="number"
                          placeholder="Discount in %"
                          value={s.offerPrice ?? 0}
                          onChange={(e) =>
                            updateSize(
                              vi,
                              si,
                              "offerPrice",
                              e.target.value === "" ? 0 : Number(e.target.value)
                            )
                          }
                          className="w-full border rounded px-2 py-1"
                        />
                      </div>

                      {/* Variant SKU */}
                      <div className="col-span-2">
                        <p className="text-xs text-gray-600 mb-1">
                          Variant SKU
                        </p>
                        <input
                          placeholder="Var SKU"
                          value={s.variantSku || ""}
                          onChange={(e) =>
                            updateSize(vi, si, "variantSku", e.target.value)
                          }
                          className="w-full border rounded px-2 py-1"
                        />
                      </div>

                      {/* Remove Button */}
                      <div className="col-span-1 flex items-end justify-center mb-1">
                        <button
                          type="button"
                          onClick={() => removeSize(vi, si)}
                          className="text-red-600 text-2xl leading-none hover:text-red-800"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </form>

        <div className="p-5 border-t flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 border rounded-lg"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={!!loadingStage}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50"
          >
            {loadingStage || "Save Changes"}
          </button>
        </div>

        {loadingStage && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full mb-3" />
              <p className="font-medium">{loadingStage}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditProductModal;
