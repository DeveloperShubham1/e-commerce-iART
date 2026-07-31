import { useMemo, useState } from "react";
import { Search, Package } from "lucide-react";
import Modal from "../../../components/ui/Modal";
import { useProductsForCollection, useAddProductsToCollection } from "../../../services/useCollectionQueries";

export default function AddProductsModal({ open, onClose, collectionId, existingProductIds = [] }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]);

  const { data, isLoading } = useProductsForCollection();
  const addProducts = useAddProductsToCollection();

  const existingSet = useMemo(
    () => new Set(existingProductIds.map(String)),
    [existingProductIds],
  );

  const products = useMemo(() => {
    const all = data?.products || [];
    return all
      .filter((p) => !existingSet.has(String(p._id)))
      .filter((p) => p.name?.toLowerCase().includes(search.toLowerCase()));
  }, [data, existingSet, search]);

  const toggleSelect = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]));
  };

  const handleAdd = async () => {
    if (!selected.length) return;
    await addProducts.mutateAsync({ id: collectionId, productIds: selected });
    setSelected([]);
    setSearch("");
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Add products" maxWidth="max-w-xl">
      <div className="mb-4 flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2">
        <Search size={16} className="text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products..."
          className="w-full text-sm outline-none"
        />
      </div>

      <div className="max-h-80 space-y-2 overflow-y-auto">
        {isLoading && <p className="py-8 text-center text-sm text-gray-400">Loading products...</p>}

        {!isLoading && products.length === 0 && (
          <p className="py-8 text-center text-sm text-gray-400">No products to add.</p>
        )}

        {products.map((product) => {
          const isSelected = selected.includes(product._id);
          return (
            <label
              key={product._id}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 transition ${
                isSelected ? "border-black bg-gray-50" : "border-gray-100 hover:bg-gray-50"
              }`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleSelect(product._id)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-gray-100 text-gray-300">
                {product.image ? (
                  <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                ) : (
                  <Package size={16} />
                )}
              </div>
              <span className="truncate text-sm text-gray-800">{product.name}</span>
            </label>
          );
        })}
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
        <span className="text-sm text-gray-500">{selected.length} selected</span>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={!selected.length || addProducts.isPending}
            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60"
          >
            {addProducts.isPending
              ? "Adding..."
              : `Add ${selected.length || ""} product${selected.length === 1 ? "" : "s"}`}
          </button>
        </div>
      </div>
    </Modal>
  );
}
