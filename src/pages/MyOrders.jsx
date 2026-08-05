import React, { useState } from "react";
import { useAppContext } from "../context/AppContext";
import { ShoppingBag } from "lucide-react";
import { useUserOrders } from "../services/user";
import Pagination from "../components/Pagination";
import { useNavigate } from "react-router-dom";
import OrderCard from "../components/OrderCard";
import OrderListSkeleton from "../components/OrderListSkeleton";
import OrderDetailsModal from "../components/OrderDetailsModal";

const MyOrders = () => {
  const { currency } = useAppContext();
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const { data, isLoading } = useUserOrders(page, 2);

  const orders = data?.orders || [];
  const pagination = data?.pagination;

  return (
    <div className="mt-16 pb-16 max-w-7xl mx-auto px-4 sm:px-6">
      {/* ================= HEADER ================= */}
      <div className="mb-10">
        <p className="text-2xl font-semibold tracking-tight">My Orders</p>
        <div className="w-16 h-0.5 bg-primary rounded-full mt-2" />
        {!isLoading && orders.length > 0 && (
          <p className="text-sm text-gray-500 mt-3">
            {pagination?.total ?? orders.length} order
            {(pagination?.total ?? orders.length) === 1 ? "" : "s"} on record
          </p>
        )}
      </div>

      {/* ================= STATES ================= */}
      {isLoading ? (
        <>
          <OrderListSkeleton />
          <OrderListSkeleton />
          <OrderListSkeleton />
        </>
      ) : orders.length === 0 ? (
        <div className="text-center py-24 max-w-lg mx-auto">
          <div className="w-16 h-16 mx-auto rounded-full bg-gray-100 flex items-center justify-center mb-5">
            <ShoppingBag className="w-7 h-7 text-gray-400" strokeWidth={1.5} />
          </div>
          <p className="text-lg font-semibold text-gray-900">No orders yet</p>
          <p className="text-sm text-gray-500 mt-1.5">
            Once you place an order, you'll be able to track its progress here.
          </p>
          <a
            onClick={() => navigate("/products")}
            className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 cursor-pointer rounded-full bg-primary text-white text-sm font-medium hover:opacity-90 transition"
          >
            Start shopping
          </a>
        </div>
      ) : (
        <>
          {orders.map((order) => (
            <OrderCard
              key={order._id}
              order={order}
              currency={currency}
              onClick={setSelectedOrder}
            />
          ))}
          <Pagination pagination={pagination} onPageChange={(p) => setPage(p)} />
        </>
      )}

      {/* ================= ORDER DETAILS MODAL ================= */}
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          currency={currency}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
};

export default MyOrders;