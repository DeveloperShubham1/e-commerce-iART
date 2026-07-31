import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { useCollections, useDeleteCollection } from "../../../services/useCollectionQueries";
import CollectionCard from "../../../components/merchant/collections/CollectionCard";
import CollectionFormModal from "../../../components/merchant/collections/CollectionFormModal";
import CollectionProductsModal from "../../../components/merchant/collections/CollectionProductsModal";
import ConfirmDialog from "../../../components/merchant/collections/ConfirmDialog";
import EmptyState from "../../../components/ui/EmptyState";

export default function CollectionsPage() {
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState(null);
  const [openCollectionId, setOpenCollectionId] = useState(null);
  const [deletingCollection, setDeletingCollection] = useState(null);

  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading } = useCollections(page, limit);
  const deleteCollection = useDeleteCollection();

  const collections = useMemo(() => {
    const all = data?.collections || [];
    return all.filter((c) => c.name?.toLowerCase().includes(search.toLowerCase()));
  }, [data, search]);

  const pagination = data?.pagination;

  const openCreate = () => {
    setEditingCollection(null);
    setFormOpen(true);
  };

  const openEdit = (collection) => {
    setEditingCollection(collection);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    await deleteCollection.mutateAsync(deletingCollection._id);
    setDeletingCollection(null);
  };

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Collections</h1>
          <p className="mt-1 text-sm text-gray-400">
            Group products together for your storefront ({collections.length} shown)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2">
            <Search size={16} className="text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search collections..."
              className="w-48 text-sm outline-none"
            />
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            type="button"
          >
            <Plus size={16} />
            Create collection
          </button>
        </div>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-gray-100" />
            ))}
          </div>
        ) : collections.length === 0 ? (
          <EmptyState
            title="No collections yet"
            description="Create your first collection to group products for your storefront."
            actionLabel="Create collection"
            onAction={openCreate}
          />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {collections.map((collection) => (
              <CollectionCard
                key={collection._id}
                collection={collection}
                onOpen={() => setOpenCollectionId(collection._id)}
                onEdit={() => openEdit(collection)}
                onDelete={() => setDeletingCollection(collection)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {pagination && pagination.totalPages > 1 && (
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-gray-100 pt-4">
          <div className="text-sm text-gray-500">
            Showing <span className="font-medium">{((page - 1) * limit) + 1}</span> to{" "}
            <span className="font-medium">
              {Math.min(page * limit, pagination.total)}
            </span>{" "}
            of <span className="font-medium">{pagination.total}</span> results
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page === 1}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white"
            >
              Previous
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: pagination.totalPages }).map((_, idx) => {
                const pageNum = idx + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`h-9 w-9 rounded-lg text-sm font-medium transition-colors ${page === pageNum
                        ? "bg-black text-white"
                        : "text-gray-700 hover:bg-gray-100"
                      }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setPage((prev) => Math.min(prev + 1, pagination.totalPages))}
              disabled={page === pagination.totalPages}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white"
            >
              Next
            </button>
          </div>
        </div>
      )}


      <CollectionFormModal open={formOpen} onClose={() => setFormOpen(false)} collection={editingCollection} />

      {openCollectionId && (
        <CollectionProductsModal
          open={Boolean(openCollectionId)}
          onClose={() => setOpenCollectionId(null)}
          collectionId={openCollectionId}
        />
      )}

      <ConfirmDialog
        open={Boolean(deletingCollection)}
        onClose={() => setDeletingCollection(null)}
        onConfirm={handleDelete}
        title="Delete collection?"
        description={`This will permanently delete "${deletingCollection?.name}" and remove all product assignments.`}
        confirmLabel="Delete"
        loading={deleteCollection.isPending}
      />
    </div>
  );
}
