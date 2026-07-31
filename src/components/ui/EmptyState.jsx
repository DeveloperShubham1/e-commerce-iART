import { FolderPlus } from "lucide-react";

export default function EmptyState({ title, description, actionLabel, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
        <FolderPlus size={22} />
      </div>
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-gray-500">{description}</p>
      {actionLabel && (
        <button
          onClick={onAction}
          className="mt-4 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
