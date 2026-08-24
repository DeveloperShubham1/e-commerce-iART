import { Loader2 } from "lucide-react";

/**
 * Reusable data table.
 * Props:
 *  - columns: [{ key, header, render?, className? }]
 *  - data: array of row objects
 *  - loading: boolean
 *  - emptyText: string
 *  - onRowClick?: (row) => void
 */
const Table = ({ columns, data = [], loading = false, emptyText = "No records found", onRowClick }) => {
  return (
    <div className="flex-1 overflow-auto">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm relative">
        <thead className="sticky top-0 z-10 shadow-sm">
          <tr className="border-b border-slate-100 bg-[#182337] text-xs uppercase tracking-wide text-primary-bg">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-5 py-3 font-semibold ${col.headerClassName || ""}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="px-5 py-12 text-center">
                <div className="flex items-center justify-center gap-2 text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading...
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-5 py-12 text-center text-slate-400">
                {emptyText}
              </td>
            </tr>
          ) : (
            data.map((row, idx) => (
              <tr
                key={row._id || idx}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={`border-b border-slate-300 transition-colors hover:bg-slate-50 ${
                  onRowClick ? "cursor-pointer" : ""
                }`}
              >
                {columns.map((col) => (
                  <td key={col.key} className={`px-5 py-3.5 align-middle ${col.className || ""}`}>
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
