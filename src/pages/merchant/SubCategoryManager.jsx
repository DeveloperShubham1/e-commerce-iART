import React, { useEffect, useState, useMemo } from "react";
import { useAppContext } from "../../context/AppContext";
import { toast } from "react-toastify";
import ConfirmModal from "../../functions/ConfirmModal";

const SubcategoryManager = () => {
  const { axios } = useAppContext();
  const [subcategories, setSubcategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editSubcategory, setEditSubcategory] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    categoryId: "",
  });
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;

  //Fetch categories

  const fetchCategories = async () => {
    try {
      const { data } = await axios.get("/api/categories");
      if (data.success) setCategories(data.categories);
    } catch (error) {
      toast.error("Failed to load categories");
    }
  };

  //Fetch subcategories
  const fetchSubcategories = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get("/api/subcategories");
      if (data.success) {
        setSubcategories(data.subcategories);
        // toast.success(data?.message);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchSubcategories();
  }, []);

  //Filter logic
  const filteredSubcategories = useMemo(() => {
    let filtered = subcategories;

    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (sub) => sub.categoryId?._id === selectedCategory
      );
    }

    if (search.trim()) {
      filtered = filtered.filter((sub) =>
        sub.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    return filtered;
  }, [subcategories, selectedCategory, search]);

  //Pagination logic
  const totalPages = Math.ceil(filteredSubcategories.length / itemsPerPage);
  const currentData = filteredSubcategories.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) setPage(newPage);
  };

  //Open modal (for add or edit)
  const handleOpenModal = (subcategory = null) => {
    if (subcategory) {
      setEditSubcategory(subcategory);
      setForm({
        name: subcategory.name,
        description: subcategory.description || "",
        categoryId: subcategory.categoryId?._id || "",
      });
    } else {
      setEditSubcategory(null);
      setForm({
        name: "",
        description: "",
        categoryId: "",
      });
    }
    setShowModal(true);
  };

  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setConfirmOpen(true);
  };

  //Save or update subcategory
  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (!form.name.trim() || !form.categoryId) {
        toast.error("Name and category are required");
        return;
      }

      if (editSubcategory) {
        const { data } = await axios.put(
          `/api/subcategories/update/${editSubcategory._id}`,
          form
        );
        if (data.success) {
          toast.success("Subcategory updated successfully!");
          fetchSubcategories();
          setShowModal(false);
        } else toast.error(data.message);
      } else {
        const { data } = await axios.post("/api/subcategories/add", form);
        if (data.success) {
          toast.success("Subcategory added!");
          fetchSubcategories();
          setShowModal(false);
        } else toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Error saving subcategory");
    }
  };

  //Delete subcategory
  const confirmDelete = async () => {
    try {
      const { data } = await axios.delete(
        `/api/subcategories/delete/${deleteId}`
      );
      if (data.success) {
        toast.success("Deleted successfully!");
        fetchSubcategories();
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
          <h2 className="text-lg font-medium">Manage Subcategories</h2>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <input
              type="text"
              placeholder="Search subcategories..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
            />

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPage(1);
              }}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>

            <button
              onClick={() => handleOpenModal()}
              className="px-4 py-2 bg-primary text-white rounded-md font-medium hover:bg-primary/90 transition"
            >
              + Add Subcategory
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="flex flex-col items-center max-w-5xl w-full overflow-hidden rounded-md bg-white border border-gray-500/20">
          <table className="w-full table-fixed">
            <thead className="text-gray-900 text-sm text-left bg-gray-100 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold hidden md:block">
                  Description
                </th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold text-center">Actions</th>
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
                    No subcategories found
                  </td>
                </tr>
              ) : (
                currentData.map((subcategory) => (
                  <tr
                    key={subcategory._id}
                    className="border-t border-gray-500/20 hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 truncate">{subcategory.name}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="bg-gray-100 border border-gray-200 text-gray-700 text-sm px-3 py-2 rounded-md leading-relaxed">
                        {subcategory.description || "—"}
                      </div>
                    </td>

                    <td className="px-4 py-3 truncate">
                      {subcategory.categoryId?.name || "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center gap-3">
                        <button
                          onClick={() => handleOpenModal(subcategory)}
                          className="text-blue-600 hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteClick(subcategory._id)}
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
          <div className="bg-white rounded-lg shadow-lg p-6 w-[90%] max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {editSubcategory ? "Edit Subcategory" : "Add Subcategory"}
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
              <div>
                <label className="block text-sm font-medium mb-1">
                  Category
                </label>
                <select
                  value={form.categoryId}
                  onChange={(e) =>
                    setForm({ ...form, categoryId: e.target.value })
                  }
                  className="border border-gray-300 rounded-md w-full px-3 py-2 focus:outline-primary"
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
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
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
                >
                  {editSubcategory ? "Update" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ConfirmModal
        isOpen={confirmOpen}
        title="Delete Subcategory?"
        message="This action cannot be undone. Do you really want to delete this subcategory?"
        onConfirm={confirmDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
};

export default SubcategoryManager;
