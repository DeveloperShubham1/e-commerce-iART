// src/pages/AddProductVariants.jsx
import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useAppContext } from "../../context/AppContext";
import { X, Upload, Image as ImageIcon, Plus, Trash2 } from "lucide-react";
import ntc from "@trihargianto/ntcjs";

const emptySize = (sizeName = "") => ({
  size: sizeName,
  stock: "",
  price: "",
  offerPrice: "",
  variantSku: "",
});

const emptyVariant = () => ({
  color: "",
  colorCode: "#000000",
  files: [],
  images: [],
  imageKeys: [],
  thumbnailIndex: 0,
  sizes: [
    emptySize("XS"),
    emptySize("S"),
    emptySize("M"),
    emptySize("L"),
  ],
  isTrending: false,
  trendingOrder: null,
});

export default function AddProductVariants() {
  const { axios } = useAppContext();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [brand, setBrand] = useState("");
  const [variants, setVariants] = useState([emptyVariant()]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [showProgress, setShowProgress] = useState(false);
  const [progressStage, setProgressStage] = useState(""); // "uploading" | "adding"

  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get("/api/categories");
        if (data.success) setCategories(data.categories || []);
      } catch (err) {
        toast.error("Failed to load categories");
      }
    })();
  }, [axios]);

  useEffect(() => {
    if (!categoryId) {
      setSubcategories([]);
      setSubcategoryId("");
      return;
    }
    (async () => {
      try {
        const { data } = await axios.get(
          `/api/subcategories?categoryId=${categoryId}`
        );
        if (data.success) setSubcategories(data.subcategories || []);
      } catch (err) {
        toast.error("Failed to load subcategories");
      }
    })();
  }, [categoryId, axios]);

  // Variant & Size handlers
  const addVariant = () => setVariants([...variants, emptyVariant()]);
  const removeVariant = (idx) =>
    variants.length > 1 && setVariants(variants.filter((_, i) => i !== idx));

  const updateVariant = (idx, patch) => {
    const newVars = [...variants];
    newVars[idx] = { ...newVars[idx], ...patch };
    setVariants(newVars);
  };

  const addSize = (vIdx) => {
    const newVars = [...variants];
    newVars[vIdx].sizes.push(emptySize());
    setVariants(newVars);
  };

  const removeSize = (vIdx, sIdx) => {
    const newVars = [...variants];
    if (newVars[vIdx].sizes.length > 1) {
      newVars[vIdx].sizes.splice(sIdx, 1);
      setVariants(newVars);
    }
  };

  const updateSize = (vIdx, sIdx, patch) => {
    const newVars = [...variants];
    newVars[vIdx].sizes[sIdx] = { ...newVars[vIdx].sizes[sIdx], ...patch };
    setVariants(newVars);
  };

  const handleFilesChange = (vIdx, newFileList) => {
    const currentFiles = variants[vIdx].files || [];
    const newFiles = Array.from(newFileList || []);

    const merged = [...currentFiles, ...newFiles];

    const uniqueFiles = merged.filter(
      (file, index, self) =>
        index ===
        self.findIndex(
          (f) =>
            f.name === file.name &&
            f.size === file.size &&
            f.lastModified === file.lastModified
        )
    );

    if (uniqueFiles.length > 5) {
      toast.error("Maximum 5 images per variant");
      return;
    }

    const newVars = [...variants];
    newVars[vIdx].files = uniqueFiles;

    // ⭐ ensure thumbnailIndex is not out of bounds
    if (newVars[vIdx].thumbnailIndex >= uniqueFiles.length) {
      newVars[vIdx].thumbnailIndex = 0;
    }

    setVariants(newVars);
  };

  // const handleFilesChange = (vIdx, newFileList) => {
  //   const currentFiles = variants[vIdx].files || [];
  //   const newFiles = Array.from(newFileList || []);

  //   // Merge old + new files
  //   const merged = [...currentFiles, ...newFiles];

  //   // Optional: remove duplicates by file name + size + lastModified
  //   const uniqueFiles = merged.filter(
  //     (file, index, self) =>
  //       index ===
  //       self.findIndex(
  //         (f) =>
  //           f.name === file.name &&
  //           f.size === file.size &&
  //           f.lastModified === file.lastModified
  //       )
  //   );

  //   if (uniqueFiles.length > 5) {
  //     toast.error("Maximum 5 images per variant");
  //     return;
  //   }

  //   const newVars = [...variants];
  //   newVars[vIdx].files = uniqueFiles;
  //   setVariants(newVars);
  // };

  const removeImage = (vIdx, fileIdx) => {
    const newVars = [...variants];
    newVars[vIdx].files.splice(fileIdx, 1);

    if (newVars[vIdx].thumbnailIndex === fileIdx) {
      newVars[vIdx].thumbnailIndex = 0;
    } else if (newVars[vIdx].thumbnailIndex > fileIdx) {
      newVars[vIdx].thumbnailIndex -= 1;
    }

    setVariants(newVars);
  };

  // const removeImage = (vIdx, fileIdx) => {
  //   const newVars = [...variants];
  //   newVars[vIdx].files.splice(fileIdx, 1);
  //   setVariants(newVars);
  // };

  const uploadFiles = async (filesArr) => {
    if (!filesArr?.length) return [];
    const formData = new FormData();
    filesArr.forEach((f) => formData.append("images", f));
    const { data } = await axios.post("/api/s3/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    if (!data.success) throw new Error(data.message || "Upload failed");
    return data.files || [];
  };

  const menTopSizes = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Product name is required");
    if (!categoryId) return toast.error("Please select a category");
    if (!subcategoryId) return toast.error("Please select a subcategory");

    for (let i = 0; i < variants.length; i++) {
      const v = variants[i];
      if (!v.color.trim())
        return toast.error(`Variant ${i + 1}: Color is required`);
      if (!v.files.length)
        return toast.error(`Variant ${i + 1}: At least one image required`);
      for (let j = 0; j < v.sizes.length; j++) {
        const s = v.sizes[j];
        if (!s.size.trim())
          return toast.error(
            `Variant ${i + 1}, Size ${j + 1}: Size name required`
          );
        if (!s.price || isNaN(s.price) || s.price <= 0)
          return toast.error(
            `Variant ${i + 1}, Size ${j + 1}: Valid price required`
          );
      }
    }

    try {
      setShowProgress(true);
      setProgressStage("uploading");

      const preparedVariants = await Promise.all(
        variants.map(async (v) => {
          const uploaded = await uploadFiles(v.files);

          return {
            color: v.color.trim(),
            colorCode: v.colorCode,
            images: uploaded.map((f) => f.url),
            imageKeys: uploaded.map((f) => f.key),
            thumbnailIndex: v.thumbnailIndex ?? 0, // ⭐ SEND IT
            sizes: v.sizes.map((s) => ({
              size: s.size.trim(),
              stock: Number(s.stock) || 0,
              price: Number(s.price),
              offerPrice: s.offerPrice ? Number(s.offerPrice) : undefined,
              variantSku: s.variantSku?.trim() || undefined,
            })),
            isTrending: v.isTrending || false,
            trendingOrder: v.isTrending ? v.trendingOrder ?? null : null,
          };
        })
      );

      setProgressStage("adding");
      const payload = {
        name: name.trim(),
        description: description.trim(),
        brand: brand.trim(),
        categoryId,
        subcategoryId,
        variants: preparedVariants,
      };

      const { data } = await axios.post("/api/products/add", payload);
      if (data.success) {
        toast.success("Product added successfully!");
        setName("");
        setDescription("");
        setBrand("");
        setCategoryId("");
        setSubcategoryId("");
        setVariants([emptyVariant()]);
      } else {
        toast.error(data.message || "Failed to add product");
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message || err.message || "Something went wrong"
      );
    } finally {
      setShowProgress(false);
      setProgressStage("");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-linear-to-r  px-8 py-6">
            <h1 className="text-3xl font-bold text-black flex items-center gap-3">
              <Plus className="w-8 h-8" />
              Add New Product with Variants
            </h1>
          </div>

          <form onSubmit={onSubmit} className="p-8 space-y-8">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="e.g. Premium Cotton T-Shirt"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Brand (Optional)
                </label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="e.g. Nike, Adidas"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                placeholder="Describe your product features, material, fit, etc."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  required
                >
                  <option value="">Choose category</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  Subcategory <span className="text-red-500">*</span>
                </label>
                <select
                  value={subcategoryId}
                  onChange={(e) => setSubcategoryId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  disabled={!subcategories.length}
                  required
                >
                  <option value="">
                    {subcategories.length
                      ? "Choose subcategory"
                      : "Select category first"}
                  </option>
                  {subcategories.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Variants Section */}
            <div className="border-t pt-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                  <ImageIcon className="w-7 h-7 text-blue-600" />
                  Product Variants
                </h2>
                <button
                  type="button"
                  onClick={addVariant}
                  className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition shadow-md"
                >
                  <Plus className="w-5 h-5" />
                  Add Variant
                </button>
              </div>

              <div className="space-y-6">
                {variants.map((variant, vIdx) => {
                  const detected = ntc.name(variant.colorCode);
                  const detectedName = detected[1];
                  const isExact = detected[2];

                  return (
                    <div
                      key={vIdx}
                      className="bg-gray-50 border border-gray-300 rounded-2xl p-6 relative"
                    >
                      {variants.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeVariant(vIdx)}
                          className="absolute top-4 right-4 text-red-500 hover:text-red-700 transition z-10"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}

                      {/* Color Name + Color Picker */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="space-y-2">
                          <label className="block text-sm font-semibold text-gray-700">
                            Color Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={variant.color}
                            onChange={(e) =>
                              updateVariant(vIdx, { color: e.target.value })
                            }
                            placeholder="e.g. Midnight Black, Rose Gold"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 transition"
                            required
                          />
                          {variant.colorCode && variant.color && (
                            <p className="text-xs text-gray-500">
                              {isExact ? "Exact match" : "Closest"} →{" "}
                              <strong>{detectedName}</strong>
                              {!isExact && " (shaded)"}
                            </p>
                          )}
                        </div>

                        <div className="space-y-3">
                          <label className="block text-sm font-semibold text-gray-700">
                            Color Picker (Auto-detects name)
                          </label>
                          <div className="flex items-center gap-4">
                            <input
                              type="color"
                              value={variant.colorCode}
                              onChange={(e) => {
                                const hex = e.target.value.toUpperCase();
                                const match = ntc.name(hex);
                                const name = match[1];
                                const exact = match[2];

                                updateVariant(vIdx, {
                                  colorCode: hex,
                                  color: exact
                                    ? name
                                    : variant.color || name + " Custom",
                                });
                              }}
                              className="w-20 h-20 rounded-xl border-4 border-white shadow-lg cursor-pointer hover:scale-110 transition-transform"
                            />
                            <div className="flex-1 space-y-2">
                              <input
                                type="text"
                                value={variant.colorCode}
                                onChange={(e) =>
                                  updateVariant(vIdx, {
                                    colorCode: e.target.value.toUpperCase(),
                                  })
                                }
                                placeholder="#000000"
                                className="w-full px-3 py-2 text-sm font-mono border rounded-lg focus:ring-2 focus:ring-blue-500"
                              />
                              {/* <div
                                className="w-full h-12 rounded-lg border-2 border-gray-300 shadow-inner"
                                style={{ backgroundColor: variant.colorCode }}
                              /> */}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Trending Fields */}
                      <div className="flex items-center gap-6 mb-6">
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                          <input
                            type="checkbox"
                            checked={variant.isTrending}
                            onChange={(e) =>
                              updateVariant(vIdx, {
                                isTrending: e.target.checked,
                              })
                            }
                            className="w-4 h-4 accent-blue-600"
                          />
                          Trending
                        </label>

                        {variant.isTrending && (
                          <input
                            type="number"
                            placeholder="Trending Order"
                            value={variant.trendingOrder ?? ""}
                            min={1}
                            onChange={(e) =>
                              updateVariant(vIdx, {
                                trendingOrder: Number(e.target.value),
                              })
                            }
                            className="px-3 py-2 border rounded-lg w-40 focus:ring-2 focus:ring-blue-500"
                          />
                        )}
                      </div>

                      {/* Image Upload */}
                      <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Variant Images <span className="text-red-500">*</span>{" "}
                          (up to 5)
                        </label>
                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 transition">
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={(e) =>
                              handleFilesChange(vIdx, e.target.files)
                            }
                            className="hidden"
                            id={`file-${vIdx}`}
                          />
                          <label
                            htmlFor={`file-${vIdx}`}
                            className="cursor-pointer flex flex-col items-center gap-3"
                          >
                            <Upload className="w-12 h-12 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              Click to upload images
                            </span>
                          </label>
                        </div>

                        {variant.files.length > 0 && (
                          <div className="grid grid-cols-8 gap-3 mt-4">
                            {variant.files.map((file, fIdx) => {
                              const isThumb = variant.thumbnailIndex === fIdx;

                              return (
                                <div
                                  key={fIdx}
                                  className={`relative group cursor-pointer border-2 rounded-lg ${isThumb
                                    ? "border-blue-600"
                                    : "border-gray-200"
                                    }`}
                                  onClick={() =>
                                    updateVariant(vIdx, {
                                      thumbnailIndex: fIdx,
                                    })
                                  }
                                >
                                  <img
                                    src={URL.createObjectURL(file)}
                                    alt={`preview ${fIdx}`}
                                    className="w-full h-24 object-cover rounded-md"
                                  />

                                  {/* ⭐ Thumbnail badge */}
                                  {isThumb && (
                                    <span className="absolute bottom-1 left-1 bg-blue-600 text-white text-xs px-2 py-0.5 rounded">
                                      Thumbnail
                                    </span>
                                  )}

                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeImage(vIdx, fIdx);
                                    }}
                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Sizes */}
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-semibold text-gray-800">
                            Sizes & Pricing
                          </h4>
                          <button
                            type="button"
                            onClick={() => addSize(vIdx)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                          >
                            <Plus className="w-4 h-4" /> Add Size
                          </button>
                        </div>
                        <div className="space-y-3">
                          {variant.sizes.map((size, sIdx) => (
                            <div
                              key={sIdx}
                              className="grid grid-cols-12 gap-3 items-center bg-white p-4 rounded-xl border"
                            >
                                <select
                                  value={size.size}
                                  onChange={(e) =>
                                    updateSize(vIdx, sIdx, {
                                      size: e.target.value,
                                    })
                                  }
                                className="col-span-2 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="">Select Size</option>
                                  {menTopSizes.map((s) => {
                                    const isAlreadySelected = variant.sizes.some(
                                      (sz, idx) => idx !== sIdx && sz.size === s
                                    );
                                    return (
                                      <option key={s} value={s} disabled={isAlreadySelected}>
                                        {s}
                                      </option>
                                    );
                                  })}
                                </select>

                              <input
                                type="number"
                                placeholder="Stock"
                                value={size.stock}
                                onChange={(e) =>
                                  updateSize(vIdx, sIdx, {
                                    stock: e.target.value,
                                  })
                                }
                                className="col-span-2 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                              />
                              <input
                                type="number"
                                placeholder="Price*"
                                value={size.price}
                                onChange={(e) =>
                                  updateSize(vIdx, sIdx, {
                                    price: e.target.value,
                                  })
                                }
                                className="col-span-2 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                required
                              />
                              <input
                                type="number"
                                placeholder="Discount in %"
                                value={size.offerPrice}
                                onChange={(e) =>
                                  updateSize(vIdx, sIdx, {
                                    offerPrice: e.target.value,
                                  })
                                }
                                className="col-span-2 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                              />
                              <input
                                placeholder="SKU (opt)"
                                value={size.variantSku}
                                onChange={(e) =>
                                  updateSize(vIdx, sIdx, {
                                    variantSku: e.target.value,
                                  })
                                }
                                className="col-span-3 px-3 py-2 border rounded-lg"
                              />
                              {variant.sizes.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeSize(vIdx, sIdx)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end pt-6 border-t">
              <button
                type="submit"
                disabled={showProgress}
                className="px-8 py-4 bg-linear-to-r from-blue-600 to-indigo-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-800 transform hover:scale-105 transition shadow-lg flex items-center gap-3 disabled:opacity-70"
              >
                <Plus className="w-6 h-6" />
                Add Product
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Progress Overlay */}
      {showProgress && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-sm w-full mx-4 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-6"></div>
            <p className="text-xl font-bold text-gray-800">
              {progressStage === "uploading"
                ? "Uploading Images..."
                : "Saving Product..."}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Please wait, this may take a moment.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
