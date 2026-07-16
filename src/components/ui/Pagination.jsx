import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

/**
 * Reusable pagination control.
 * Props:
 *  - pagination: { current_page, per_page, total_records, total_pages, has_next_page, has_prev_page }
 *  - onPageChange: (page) => void
 *  - className
 */
const Pagination = ({ pagination, onPageChange, className = "" }) => {
  if (!pagination) return null;

  const {
    current_page = 1,
    per_page = 10,
    total_records = 0,
    total_pages = 1,
    has_next_page = false,
    has_prev_page = false,
  } = pagination;

  if (total_records === 0) return null;

  // Build a compact page list with ellipsis
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (total_pages <= maxVisible) {
      for (let i = 1; i <= total_pages; i++) pages.push(i);
      return pages;
    }

    pages.push(1);

    const start = Math.max(2, current_page - 1);
    const end = Math.min(total_pages - 1, current_page + 1);

    if (start > 2) pages.push("...");
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < total_pages - 1) pages.push("...");

    pages.push(total_pages);
    return pages;
  };

  const from = (current_page - 1) * per_page + 1;
  const to = Math.min(current_page * per_page, total_records);

  return (
    <div className={`flex flex-col items-center justify-between gap-3 px-5 py-4 sm:flex-row ${className}`}>
      <p className="text-sm text-slate-500">
        Showing <span className="font-semibold text-slate-700">{from}</span>–
        <span className="font-semibold text-slate-700">{to}</span> of{" "}
        <span className="font-semibold text-slate-700">{total_records}</span> records
      </p>

      <div className="flex items-center gap-1">
        <button
          onClick={() => has_prev_page && onPageChange(current_page - 1)}
          disabled={!has_prev_page}
          className="flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Prev</span>
        </button>

        {getPageNumbers().map((page, idx) =>
          page === "..." ? (
            <span key={`ellipsis-${idx}`} className="flex h-9 w-9 items-center justify-center text-slate-400">
              <MoreHorizontal className="h-4 w-4" />
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-sm font-medium transition-colors ${
                page === current_page
                  ? "bg-primary-600 text-white"
                  : "border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {page}
            </button>
          ),
        )}

        <button
          onClick={() => has_next_page && onPageChange(current_page + 1)}
          disabled={!has_next_page}
          className="flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
