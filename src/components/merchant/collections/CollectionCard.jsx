import { Pencil, Trash2, Package } from "lucide-react";

export default function CollectionCard({ collection, onOpen, onEdit, onDelete }) {
  const { name, description, image, productCount = 0 } = collection;

  return (
    <div className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:shadow-md">
      <button onClick={onOpen} className="block w-full text-left" type="button">
        <div className="aspect-square w-full overflow-hidden bg-gray-100">
          {image ? (
            <img
              src={typeof image === "object" ? image.url : image}
              alt={name}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-gray-300">
              <Package size={32} />
            </div>
          )}
        </div>
      </button>

      <div className="p-4">
        <button onClick={onOpen} className="block text-left" type="button">
          <h3 className="truncate font-semibold text-gray-900">{name}</h3>
        </button>
        {description && (
          <p className="mt-0.5 line-clamp-1 text-sm text-gray-400">{description}</p>
        )}

        <div className="mt-3 flex items-center justify-between">
          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-600">
            {productCount} {productCount === 1 ? "product" : "products"}
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={onEdit}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              title="Edit collection"
              type="button"
            >
              <Pencil size={15} />
            </button>
            <button
              onClick={onDelete}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
              title="Delete collection"
              type="button"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
