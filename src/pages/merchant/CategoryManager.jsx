import React, { useEffect, useState, useMemo } from "react";
import { useAppContext } from "../../context/AppContext";
import { toast } from "react-toastify";
import { X } from "lucide-react";
import ConfirmModal from "../../functions/ConfirmModal";

const CategoryManager = () => {
  const { axios } = useAppContext();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editCategory, setEditCategory] = useState(null);
  const [form, setForm] = useState({ name: "", description: "" });
  const [image, setImage] = useState(null); // local file (for upload)
  const [preview, setPreview] = useState(null); // local preview or existing
  const [uploading, setUploading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;

  // ✅ Fetch all categories
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get("/api/categories");
      if (data.success) {
        setCategories(data.categories);
        // toast.success(data?.message)
      }
    } catch (error) {
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // ✅ Filtered categories (search)
  const filteredCategories = useMemo(() => {
    if (!search.trim()) return categories;
    return categories.filter((cat) =>
      cat.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [categories, search]);

  // ✅ Pagination
  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
  const currentData = filteredCategories.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) setPage(newPage);
  };

  // ✅ Open modal (Add/Edit)
  const handleOpenModal = (category = null) => {
    setEditCategory(category);
    setForm(
      category
        ? { name: category.name, description: category.description || "" }
        : { name: "", description: "" }
    );
    if (category?.image) {
      setPreview(category.image.url);
    } else {
      setPreview(null);
    }
    setImage(null);
    setShowModal(true);
  };

  // ✅ Upload image to S3
  const uploadImageToS3 = async () => {
    if (!image) return null;
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("images", image);
      const { data } = await axios.post("/api/s3/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (!data.success) throw new Error(data.message);
      const file = data.files[0];
      return { key: file.key, url: file.url };
    } catch (error) {
      toast.error("Image upload failed");
      return null;
    } finally {
      setUploading(false);
    }
  };

  // ✅ Save category (add / update)
  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (!form.name.trim()) {
        toast.error("Category name is required");
        return;
      }

      let uploadedImage = null;

      // If a new image file is selected → upload it
      if (image) {
        uploadedImage = await uploadImageToS3();
        if (!uploadedImage) return; // Stop if upload failed
      }

      let payload = { ...form };

      // Include image if uploaded
      if (uploadedImage) {
        payload.imageKey = uploadedImage.key;
        payload.imageUrl = uploadedImage.url;
      }

      // Remove image if user cleared it
      if (!preview && editCategory?.image) {
        payload.removeImage = "true";
      }

      // API call
      const { data } = editCategory
        ? await axios.put(`/api/categories/update/${editCategory._id}`, payload)
        : await axios.post("/api/categories/add", payload);

      if (data.success) {
        toast.success(
          editCategory ? "Category updated successfully!" : "Category added!"
        );
        fetchCategories();
        setShowModal(false);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Error saving category");
    }
  };

  // open modal Instead
  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setConfirmOpen(true);
  };

  // ✅ Delete category
  const confirmDelete = async () => {
    try {
      const { data } = await axios.delete(`/api/categories/delete/${deleteId}`);
      if (data.success) {
        toast.success("Deleted successfully!");
        fetchCategories();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Error deleting");
    } finally {
      setConfirmOpen(false);
    }
  };

  return (
    <div className="no-scrollbar flex-1 h-[95vh] overflow-y-scroll flex flex-col justify-between">
      <div className="w-full md:p-10 p-4">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4">
          <h2 className="text-lg font-medium">Manage Categories</h2>

          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search categories..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              onClick={() => handleOpenModal()}
              className="px-4 py-2 bg-primary text-white rounded-md font-medium hover:bg-primary/90 transition"
            >
              + Add Category
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="flex flex-col items-center max-w-4xl w-full overflow-hidden rounded-md bg-white border border-gray-500/20">
          <table className="md:table-auto table-fixed w-full overflow-hidden">
            <thead className="text-gray-900 text-sm text-left bg-gray-100 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 font-semibold truncate">Image</th>
                <th className="px-4 py-3 font-semibold truncate">Name</th>
                <th className="px-4 py-3 font-semibold truncate hidden md:block">
                  Description
                </th>
                <th className="px-4 py-3 font-semibold truncate text-center">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-600">
              {loading ? (
                <tr>
                  <td colSpan="4" className="text-center py-5 text-gray-400">
                    Loading...
                  </td>
                </tr>
              ) : currentData.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-5 text-gray-400">
                    No categories found
                  </td>
                </tr>
              ) : (
                currentData.map((category) => (
                  <tr
                    key={category._id}
                    className="border-t border-gray-500/20 hover:bg-gray-50"
                  >
                    <td className="px-4 py-3">
                      {category.image?.url ? (
                        <img
                          src={category.image.url}
                          alt="Category"
                          className="w-12 h-12 object-cover rounded border"
                        />
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 truncate">{category.name}</td>
                    <td className="px-4 py-3 whitespace-normal break-words hidden md:table-cell">
                      {category.description || "—"}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center gap-3">
                        <button
                          onClick={() => handleOpenModal(category)}
                          className="text-blue-600 hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteClick(category._id)}
                          className="text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-3 mt-5">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-100"
            >
              Prev
            </button>
            <span className="text-sm text-gray-700">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages}
              className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-100"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-[90%] max-w-md relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>
            <h3 className="text-lg font-semibold mb-4">
              {editCategory ? "Edit Category" : "Add Category"}
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="border border-gray-300 rounded-md w-full px-3 py-2 focus:outline-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="border border-gray-300 rounded-md w-full px-3 py-2 resize-none focus:outline-primary"
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium mb-1">Image</label>
                {preview ? (
                  <div className="relative w-28 h-28">
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-full h-full object-cover rounded border"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPreview(null);
                        setImage(null);
                      }}
                      className="absolute top-1 right-1 bg-white/80 text-red-600 rounded-full p-1"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      setImage(file);
                      if (file) setPreview(URL.createObjectURL(file));
                    }}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                )}
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-md hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
                >
                  {uploading ? "Uploading..." : editCategory ? "Update" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ConfirmModal
        isOpen={confirmOpen}
        title="Delete Category?"
        message="This action cannot be undone. Do you really want to delete this category?"
        onConfirm={confirmDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
};

export default CategoryManager;
