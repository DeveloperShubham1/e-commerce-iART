import React from "react";

const TableManager = ({
  title,
  data,
  columns,
  onAdd,
  onEdit,
  onDelete,
  loading,
}) => {
  return (
    <div className="p-6 flex-1 bg-gray-50">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
        <button
          onClick={onAdd}
          className="px-4 py-2 bg-primary text-white font-medium rounded hover:bg-primary/90 transition"
        >
          + Add New
        </button>
      </div>

      <div className="overflow-x-auto bg-white shadow-md rounded-lg border">
        <table className="min-w-full border-collapse text-sm text-gray-700">
          <thead className="bg-gray-100 text-gray-800 uppercase text-xs font-semibold border-b">
            <tr>
              {columns.map((col) => (
                <th key={col.accessor} className="px-4 py-3 text-left">
                  {col.header}
                </th>
              ))}
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length + 1}
                  className="text-center py-6 text-gray-500"
                >
                  Loading...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + 1}
                  className="text-center py-6 text-gray-500"
                >
                  No records found
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr
                  key={item._id}
                  className="hover:bg-gray-50 border-b last:border-none"
                >
                  {columns.map((col) => (
                    <td key={col.accessor} className="px-4 py-3">
                      {col.render
                        ? col.render(item[col.accessor], item)
                        : item[col.accessor]}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center gap-3">
                      <button
                        onClick={() => onEdit(item)}
                        className="text-blue-600 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDelete(item._id)}
                        className="text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TableManager;
