import { useState } from "react";
import { Plus, Trash2, Package } from "lucide-react";
import Modal from "../../../components/ui/Modal";
import AddProductsModal from "./AddProductsModal";
import ConfirmDialog from "./ConfirmDialog";
import { useCollection, useRemoveProductFromCollection } from "../../../services/useCollectionQueries";

export default function CollectionProductsModal({ open, onClose, collectionId }) {
  const [addOpen, setAddOpen] = useState(false);
  const [productToRemove, setProductToRemove] = useState(null);

  const { data, isLoading } = useCollection(collectionId);
  const removeProduct = useRemoveProductFromCollection();

  const collection = data?.collection;
  const products = data?.products || [];

  const handleRemove = async () => {
    await removeProduct.mutateAsync({ id: collectionId, productId: productToRemove._id });
    setProductToRemove(null);
  };

  return (
    <>
      <Modal open={open} onClose={onClose} title={collection?.name || "Collection"} maxWidth="max-w-2xl">
        {isLoading ? (
          <p className="py-8 text-center text-sm text-gray-400">Loading...</p>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                {products.length} {products.length === 1 ? "product" : "products"} in this collection
              </p>
              <button
                onClick={() => setAddOpen(true)}
                className="flex items-center gap-1.5 rounded-lg bg-black px-3 py-2 text-sm font-medium text-white hover:bg-gray-800"
                type="button"
              >
                <Plus size={16} />
                Add products
              </button>
            </div>

            {products.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 py-10 text-center text-sm text-gray-400">
                No products in this collection yet.
              </div>
            ) : (
              <div className="space-y-2">
                {products.map((product) => (
                  <div
                    key={product._id}
                    className="flex items-center gap-3 rounded-xl border border-gray-100 px-3 py-2"
                  >
                    <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg bg-gray-100 text-gray-300">
                      {product.variants?.[0]?.image ? (
                        <img
                          src={product.variants[0].image}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Package size={18} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-800">{product.name}</p>
                      {product.variants?.[0]?.price && (
                        <p className="text-xs text-gray-400">₹{product.variants[0].price}</p>
                      )}
                    </div>
                    <button
                      onClick={() => setProductToRemove(product)}
                      className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                      title="Remove from collection"
                      type="button"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </Modal>

      <AddProductsModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        collectionId={collectionId}
        existingProductIds={products.map((p) => p._id)}
      />

      <ConfirmDialog
        open={Boolean(productToRemove)}
        onClose={() => setProductToRemove(null)}
        onConfirm={handleRemove}
        title="Remove product?"
        description={`Remove "${productToRemove?.name}" from this collection?`}
        confirmLabel="Remove"
        loading={removeProduct.isPending}
      />
    </>
  );
}
