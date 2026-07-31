import Modal from "../../../components/ui/Modal";

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = "Are you sure?",
  description,
  confirmLabel = "Delete",
  loading = false,
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth="max-w-sm">
      <p className="text-sm text-gray-500">{description}</p>
      <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={onClose}
          className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
        >
          {loading ? "Deleting..." : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
