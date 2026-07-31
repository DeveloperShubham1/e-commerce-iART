import React from "react";

const Pagination = ({
  pagination,
  onPageChange,
  className = "",
}) => {
  if (!pagination || pagination.totalPages <= 1) return null;

  const {
    page,
    totalPages,
    total,
    limit,
    hasNextPage,
    hasPrevPage,
  } = pagination;

  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  const getPages = () => {
    const pages = [];
    const sibling = 1;

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
      return pages;
    }

    pages.push(1);

    let left = Math.max(page - sibling, 2);
    let right = Math.min(page + sibling, totalPages - 1);

    if (left > 2) pages.push("left-dots");

    for (let i = left; i <= right; i++) {
      pages.push(i);
    }

    if (right < totalPages - 1) pages.push("right-dots");

    pages.push(totalPages);

    return pages;
  };

  const pages = getPages();

  const btn =
    "h-10 min-w-[40px] px-3 rounded-lg border text-sm font-medium transition-all duration-200";

  return (
    <div className={`mt-8 ${className}`}>
      {/* Desktop */}
      <div className="hidden sm:flex items-center justify-between gap-4 flex-wrap">
        <p className="text-sm text-gray-600">
          Showing <span className="font-semibold">{start}</span>–
          <span className="font-semibold">{end}</span> of{" "}
          <span className="font-semibold">{total}</span> results
        </p>

        <div className="flex items-center gap-2 flex-wrap">
          {/* First */}
          {/* <button
            onClick={() => onPageChange(1)}
            disabled={!hasPrevPage}
            className={`${btn}
            ${
              hasPrevPage
                ? "hover:bg-gray-100"
                : "opacity-40 cursor-not-allowed"
            }`}
          >
            First
          </button> */}

          {/* Previous */}
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={!hasPrevPage}
            className={`${btn}
            ${
              hasPrevPage
                ? "hover:bg-gray-100"
                : "opacity-40 cursor-not-allowed"
            }`}
          >
            Prev
          </button>

          {pages.map((item, index) =>
            item === "left-dots" || item === "right-dots" ? (
              <span
                key={index}
                className="px-2 text-gray-500 select-none"
              >
                ...
              </span>
            ) : (
              <button
                key={item}
                onClick={() => onPageChange(item)}
                className={`${btn}
                ${
                  item === page
                    ? "bg-black text-white border-black"
                    : "hover:bg-gray-100"
                }`}
              >
                {item}
              </button>
            )
          )}

          {/* Next */}
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={!hasNextPage}
            className={`${btn}
            ${
              hasNextPage
                ? "hover:bg-gray-100"
                : "opacity-40 cursor-not-allowed"
            }`}
          >
            Next
          </button>

          {/* Last */}
          {/* <button
            onClick={() => onPageChange(totalPages)}
            disabled={!hasNextPage}
            className={`${btn}
            ${
              hasNextPage
                ? "hover:bg-gray-100"
                : "opacity-40 cursor-not-allowed"
            }`}
          >
            Last
          </button> */}
        </div>
      </div>

      {/* Mobile */}
      <div className="sm:hidden flex flex-col gap-3">
        <p className="text-center text-sm text-gray-600">
          Page {page} of {totalPages}
        </p>

        <div className="flex justify-between gap-3">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={!hasPrevPage}
            className={`flex-1 h-10 rounded-lg border font-medium
            ${
              hasPrevPage
                ? "hover:bg-gray-100"
                : "opacity-40 cursor-not-allowed"
            }`}
          >
            ← Prev
          </button>

          <button
            onClick={() => onPageChange(page + 1)}
            disabled={!hasNextPage}
            className={`flex-1 h-10 rounded-lg border font-medium
            ${
              hasNextPage
                ? "hover:bg-gray-100"
                : "opacity-40 cursor-not-allowed"
            }`}
          >
            Next →
          </button>
        </div>

        <p className="text-center text-xs text-gray-500">
          Showing {start}-{end} of {total}
        </p>
      </div>
    </div>
  );
};

export default Pagination;