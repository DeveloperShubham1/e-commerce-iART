import React, { use, useEffect, useState } from "react";
import { useAppContext } from "../../context/AppContext";
import { toast } from "react-toastify";
import UpdateOrderModal from "../merchant/UpdateOrderModal";

// Reusable Status Badge
const StatusBadge = ({ value }) => {
  const map = {
    paid: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
    pending: "bg-yellow-100 text-yellow-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
    confirmed: "bg-blue-100 text-blue-800",
    shipped: "bg-purple-100 text-purple-800",
  };

  return (
    <span
      className={`px-2.5 py-1 rounded-full text-xs font-medium uppercase ${
        map[value?.toLowerCase()] || "bg-gray-100 text-gray-800"
      }`}
    >
      {value || "unknown"}
    </span>
  );
};

// Status Filter Tabs (Single Select)
const StatusFilterTabs = ({ selectedStatus, onChange }) => {
  const statuses = [
    "Pending",
    "Confirmed",
    "Shipped",
    "Delivered",
    "Cancelled",
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {statuses.map((status) => (
        <button
          key={status}
          onClick={() =>
            onChange(status === "All" ? null : status.toLowerCase())
          }
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            selectedStatus === (status === "All" ? null : status.toLowerCase())
              ? "bg-indigo-600 text-white shadow-md"
              : "bg-gray-200 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {status}
        </button>
      ))}
    </div>
  );
};

// Date Filter Component
const DateFilter = ({
  dateType,
  setDateType,
  fromDate,
  setFromDate,
  toDate,
  setToDate,
  onClear,
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-3 items-end">
      <div>
        <select
          value={dateType}
          onChange={(e) => setDateType(e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
        >
          <option value="All">All Time</option>
          <option value="Today">Today</option>
          <option value="Week">Last 7 Days</option>
          <option value="Month">Last 30 Days</option>
          <option value="Custom">Custom Range</option>
        </select>
      </div>

      {dateType === "Custom" && (
        <div className="flex gap-2">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
          />
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
          />
        </div>
      )}

      <button
        onClick={onClear}
        className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium"
      >
        Clear Filters
      </button>
    </div>
  );
};

// Search Bar
const SearchBar = ({ searchTerm, setSearchTerm }) => (
  <div className="relative max-w-md w-full">
    <input
      type="text"
      placeholder="Search by Order ID, Name or Email..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
    />
    <svg
      className="absolute left-3 top-3.5 h-5 w-5 text-gray-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  </div>
);

// Pagination Component
const Pagination = ({
  currentPage,
  totalPages,
  limit,
  onLimitChange,
  onPageChange,
}) => {
  const limits = [5, 10, 15, 20, 50, 100];

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div className="flex items-center gap-3 text-sm text-gray-600">
        <span>
          Page {currentPage} of {totalPages}
        </span>

        <div className="flex items-center gap-2">
          <span>Rows:</span>
          <select
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
          >
            {limits.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-4 py-2 rounded-lg bg-gray-100 disabled:opacity-50 hover:bg-gray-200"
        >
          Previous
        </button>

        {[...Array(totalPages)].map((_, i) => (
          <button
            key={i}
            onClick={() => onPageChange(i + 1)}
            className={`px-3 py-2 rounded-lg text-sm font-medium ${
              currentPage === i + 1
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            {i + 1}
          </button>
        ))}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-4 py-2 rounded-lg bg-gray-100 disabled:opacity-50 hover:bg-gray-200"
        >
          Next
        </button>
      </div>
    </div>
  );
};

// Desktop Table
const OrdersTable = ({ orders, onSelectOrder }) => (
  <div className="hidden lg:block overflow-x-auto">
    <table className="w-full min-w-[1000px]">
      <thead className="bg-gradient-to-r from-slate-800 to-slate-900 text-white">
        <tr>
          {[
            "Order ID",
            "Customer",
            "Items",
            "Payment Type",
            "Amount",
            "Payment",
            "Status",
            "Date",
          ].map((h) => (
            <th
              key={h}
              className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider"
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200">
        {orders.map((order) => (
          <tr
            key={order._id}
            onClick={() => onSelectOrder(order)}
            className="hover:bg-indigo-50 cursor-pointer transition"
          >
            <td className="px-6 py-4 font-semibold text-sm">{order.orderId}</td>
            <td className="px-6 py-4">
              <div className="font-semibold text-sm">
                {order.userId?.name || "N/A"}
              </div>
              <div className="text-xs text-gray-500">{order.userId?.email}</div>
            </td>
            <td className="px-6 py-4 text-sm">{order.items?.length} items</td>
            <td className="px-6 py-4 text-sm uppercase">{order.paymentType}</td>
            <td className="px-6 py-4 font-bold">₹{order.totalAmount}</td>
            <td className="px-6 py-4">
              <StatusBadge value={order.paymentStatus} />
            </td>
            <td className="px-6 py-4">
              <StatusBadge value={order.orderStatus} />
            </td>
            <td className="px-6 py-4 text-xs text-gray-600">
              {new Date(order.createdAt).toLocaleDateString()}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// Mobile Cards
const OrdersMobileCards = ({ orders, onSelectOrder }) => (
  <div className="lg:hidden space-y-4">
    {orders.map((order) => (
      <div
        key={order._id}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-lg transition"
        onClick={() => onSelectOrder(order)}
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="font-bold text-lg">#{order.orderId}</div>
            <div className="text-sm text-gray-500">
              {new Date(order.createdAt).toLocaleDateString()}
            </div>
          </div>
          <div className="text-right">
            <div className="font-bold text-xl">₹{order.totalAmount}</div>
            <div className="text-xs text-gray-500 uppercase">
              {order.paymentType}
            </div>
          </div>
        </div>

        <div className="space-y-3 text-sm">
          <div>
            <span className="font-medium text-gray-600">Customer:</span>
            <div className="font-semibold">{order.userId?.name || "N/A"}</div>
            <div className="text-xs text-gray-500">{order.userId?.email}</div>
          </div>
          <div>
            <span className="font-medium text-gray-600">Items:</span>{" "}
            {order.items?.length} items
          </div>
          <div className="flex gap-4">
            <div>
              <span className="text-gray-600">Payment:</span>
              <div className="mt-1">
                <StatusBadge value={order.paymentStatus} />
              </div>
            </div>
            <div>
              <span className="text-gray-600">Status:</span>
              <div className="mt-1">
                <StatusBadge value={order.orderStatus} />
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelectOrder(order);
          }}
          className="mt-5 w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
        >
          View / Update Order
        </button>
      </div>
    ))}
  </div>
);

// Empty State
const EmptyState = ({ onClearFilters }) => (
  <div className="text-center py-16">
    <div className="text-6xl mb-4">📋</div>
    <h3 className="text-xl font-semibold text-gray-800 mb-2">
      No Orders Found
    </h3>
    <p className="text-gray-600 mb-8">
      Try adjusting your filters or search term.
    </p>
    <button
      onClick={onClearFilters}
      className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
    >
      Clear All Filters
    </button>
  </div>
);

// Main Orders Component
const Orders = () => {
  const { currency, axios } = useAppContext();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [dateType, setDateType] = useState("All");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedStatus, setSelectedStatus] = useState(null); // null = All
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedOrder, setSelectedOrder] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(10);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const fetchOrders = async () => {
    try {
      setLoading(true);

      const params = {
        type: dateType,
        page: currentPage,
        orderStatus: selectedStatus,
        limit,
        search: debouncedSearch,
      };

      if (dateType === "Custom" && fromDate && toDate) {
        params.from = fromDate;
        params.to = toDate;
      }

      const { data } = await axios.get("/api/orders/merchant/all", { params });

      if (data.success) {
        setOrders(data.orders);
        setCurrentPage(data.currentPage);
        setTotalPages(data.totalPages);
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error("Failed to fetch orders");
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    fetchOrders();
  }, [limit, selectedStatus, debouncedSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (dateType !== "Custom" || (fromDate && toDate)) {
      setCurrentPage(1);
      fetchOrders();
    }
  }, [dateType, fromDate, toDate]);

  useEffect(() => {
    fetchOrders();
  }, [currentPage]);

  // const indexOfLast = currentPage * ordersPerPage;
  // const indexOfFirst = indexOfLast - ordersPerPage;
  // const currentOrders = filteredOrders.slice(indexOfFirst, indexOfLast);
  // const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  const clearFilters = () => {
    setSelectedStatus(null);
    setSearchTerm("");
    setDateType("All");
    setFromDate("");
    setToDate("");
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-300 border-t-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-bold mb-2">Failed to Load Orders</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={fetchOrders}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 lg:p-10 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">All Orders</h1>
        <p className="text-gray-600 mt-1">
          Monitor and manage your orders efficiently
        </p>
      </div>

      {/* Filters Section */}
      <div className="space-y-3">
        <p>Filter By Status</p>
        <StatusFilterTabs
          selectedStatus={selectedStatus}
          onChange={setSelectedStatus}
        />

        <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
          <DateFilter
            dateType={dateType}
            setDateType={setDateType}
            fromDate={fromDate}
            setFromDate={setFromDate}
            toDate={toDate}
            setToDate={setToDate}
            onClear={clearFilters}
          />
          <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        </div>
      </div>

      {/* Orders Display */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {orders.length === 0 ? (
          <EmptyState onClearFilters={clearFilters} />
        ) : (
          <>
            <OrdersTable orders={orders} onSelectOrder={setSelectedOrder} />
            <OrdersMobileCards
              orders={orders}
              onSelectOrder={setSelectedOrder}
            />
            <div className="p-6 border-t">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                limit={limit}
                onLimitChange={setLimit}
                onPageChange={setCurrentPage}
              />
            </div>
          </>
        )}
      </div>

      {/* Update Modal */}
      {selectedOrder && (
        <UpdateOrderModal
          order={selectedOrder}
          axios={axios}
          currency={currency}
          onClose={() => setSelectedOrder(null)}
          onUpdated={fetchOrders}
        />
      )}
    </div>
  );
};

export default Orders;
