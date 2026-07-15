import { useState } from "react";
import { Trash2, Eye, Plus, Instagram, Link, Tag } from "lucide-react";
import {
  useInstagramProducts,
  useDeleteInstagramProduct,
} from "../../services/instaProduct";
import { toast } from "react-toastify";

import CreateInstagramProductModal from "../../components/merchant/Createinstagramproductmodal";
import InstagramProductDetailModal from "../../components/merchant/Instagramproductdetailmodal";
import ConfirmModal from "../../functions/ConfirmModal";
import { useSyncInstagramAllComments } from "../../services/merchant";
import svgrepo from "../../assets/sync-svgrepo-com.svg"

export default function InstagramProductsPage() {
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedMediaId, setSelectedMediaId] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const { data, isLoading, isError } = useInstagramProducts(page, 10);
  const deleteMutation = useDeleteInstagramProduct();
  const syncMutation = useSyncInstagramAllComments();

  const products = data?.data || [];
  const pagination = data?.pagination || {};

  function handleDelete(id) {
    setDeleteTargetId(id);
    setConfirmOpen(true);
  }

  function confirmDelete() {
    if (deleteTargetId) {
      deleteMutation.mutate(deleteTargetId, {
        onSuccess: (data) => {
          toast.success(
            data?.message || "Instagram product mapping created successfully!"
          );
          setConfirmOpen(false);
          setDeleteTargetId(null);
        },
        onError: () => {
          setConfirmOpen(false);
          setDeleteTargetId(null);
        }
      });
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Instagram Products
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Map Instagram posts and reels to your store products
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <button
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
            className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed hover:cursor-pointer"
          >
            <img
              src={svgrepo}
              alt="Sync"
              className={`h-4 w-4 ${syncMutation.isPending ? "animate-spin" : ""}`}
            />
            {syncMutation.isPending ? "Syncing..." : "Sync Comments"}
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg bg-[#151F33] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#24314f] hover:cursor-pointer"
          >
            <Plus size={16} />
            Add Mapping
          </button>
        </div>
      </div>

      {/* Table card */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
            <div className="w-7 h-7 border-2 border-gray-200 border-t-purple-600 rounded-full animate-spin" />
            <span className="text-sm">Loading mappings…</span>
          </div>
        ) : isError ? (
          <div className="flex items-center justify-center py-20 text-red-500 text-sm">
            Failed to load mappings. Check your connection and try again.
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-gray-400">
            <Instagram size={40} className="text-gray-300" />
            <p className="text-sm">No mappings yet.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 transition"
            >
              Add your first mapping
            </button>
          </div>
        ) : (
          <>

            <div className="md:hidden divide-y divide-gray-100">
              {products.map((item) => (
                <div
                  key={item._id}
                  className="p-4 space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-gray-500">Media ID</p>

                      <code className="rounded bg-gray-100 px-2 py-1 text-xs">
                        {item.instagram_media_id}
                      </code>
                    </div>

                    <span
                      className={`rounded-full px-2 py-1 text-xs font-semibold ${item.active
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                        }`}
                    >
                      {item.active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="flex gap-3">
                    {item.product_id?.variants?.[0]?.images?.[0] && (
                      <img
                        src={item.product_id.variants[0].images[0]}
                        className="h-14 w-14 rounded-lg object-cover border"
                      />
                    )}

                    <div className="flex-1">
                      <p className="font-semibold">
                        {item.product_id?.name}
                      </p>

                      <p className="text-sm text-gray-500">
                        {item.title}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 border-t border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <a
                      href={item.product_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-purple-600 text-sm font-medium"
                    >
                      View Product
                    </a>

                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          setSelectedMediaId(item.instagram_media_id)
                        }
                        className="rounded-md border p-2 hover:cursor-pointer"
                      >
                        <Eye size={16} />
                      </button>

                      <button
                        onClick={() =>
                          handleDelete(item.instagram_media_id)
                        }
                        className="rounded-md border p-2 text-red-500 hover:cursor-pointer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-gray-400">
                    {new Date(item.created_at).toLocaleDateString("en-IN")}
                  </p>
                </div>
              ))}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-[950px] w-full text-sm">
                <thead>
                  <tr className="bg-gray-800">
                    {["MEDIA ID", "TITLE", "PRODUCT", "URL", "STATUS", "CREATED", "ACTIONS"].map((h) => (
                      <th
                        key={h}
                        className="text-left text-xs font-semibold text-gray-100 tracking-wider px-5 py-4"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {products.map((item) => (
                    <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                      {/* Media ID */}
                      <td className="px-5 py-4">
                        <code className="text-xs bg-gray-100 border border-gray-200 rounded px-2 py-1 font-mono text-gray-700">
                          {item.instagram_media_id}
                        </code>
                      </td>

                      {/* Title */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-gray-700">
                          <Tag size={12} className="text-gray-400" />
                          {item.title || "—"}
                        </div>
                      </td>

                      {/* Product */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          {item.product_id?.variants?.[0]?.images?.[0] && (
                            <img
                              src={item.product_id.variants[0].images[0]}
                              alt={item.product_id.name}
                              className="w-9 h-9 rounded-md object-cover border border-gray-200"
                            />
                          )}
                          <span className="text-gray-800 font-medium">
                            {item.product_id?.name || "—"}
                          </span>
                        </div>
                      </td>

                      {/* URL */}
                      <td className="px-5 py-4">
                        <a
                          href={item.product_url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-purple-600 hover:underline font-medium"
                        >
                          <Link size={12} />
                          View
                        </a>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${item.active
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                            }`}
                        >
                          {item.active ? "Active" : "Inactive"}
                        </span>
                      </td>

                      {/* Created */}
                      <td className="px-5 py-4 text-gray-500">
                        {new Date(item.created_at).toLocaleDateString("en-IN")}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex justify-center sm:justify-end items-center gap-2 flex-wrap">
                          <button
                            title="View details"
                            onClick={() => setSelectedMediaId(item?.instagram_media_id)}
                            className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 bg-white hover:bg-purple-50 hover:border-purple-400 hover:text-purple-600 text-gray-500 transition-colors hover:cursor-pointer"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            title="Delete mapping"
                            onClick={() => handleDelete(item?.instagram_media_id)}
                            disabled={deleteMutation.isPending}
                            className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 bg-white hover:bg-red-50 hover:border-red-400 hover:text-red-500 text-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:cursor-pointer"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
              <span className="text-sm text-gray-500">
                Page {pagination.current_page} of {pagination.total_pages} —{" "}
                {pagination.total_records} total
              </span>
              <div className="flex justify-center sm:justify-end items-center gap-2 flex-wrap">
                <button
                  disabled={!pagination.has_prev_page}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <span className="w-8 h-8 flex items-center justify-center text-sm font-semibold bg-[#151F33] text-white rounded-md hover:cursor-pointer">
                  {pagination.current_page}
                </span>
                <button
                  disabled={!pagination.has_next_page}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateInstagramProductModal onClose={() => setShowCreateModal(false)} />
      )}
      {selectedMediaId && (
        <InstagramProductDetailModal
          mediaId={selectedMediaId}
          onClose={() => setSelectedMediaId(null)}
        />
      )}
      <ConfirmModal
        isOpen={confirmOpen}
        title="Delete Instagram Product Mapping?"
        message="This action cannot be undone. Do you really want to delete this Instagram product mapping?"
        onConfirm={confirmDelete}
        onCancel={() => {
          setConfirmOpen(false);
          setDeleteTargetId(null);
        }}
      />
    </div>
  );
}