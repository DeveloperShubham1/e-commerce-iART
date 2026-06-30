import React, { useEffect, useState } from "react";
import { useAppContext } from "../context/AppContext";
import { useLocation } from "react-router-dom";

const MyOrders = () => {
  const { currency, axios, user } = useAppContext();

  const [myOrders, setMyOrders] = useState([]);
  const [loading, setLoading] = useState(true); // 🔑 single source of truth

  const location = useLocation();

  useEffect(() => {
    if (location.state?.justPlaced) {
      setLoading(true);
    }
  }, []);

  /* ================= FETCH ORDERS ================= */
  const fetchMyOrders = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("/api/user/orders");
      if (data.success) {
        setMyOrders(data.orders || []);
      } else {
        setMyOrders([]);
      }
    } catch (error) {
      console.error(error);
      setMyOrders([]);
    } finally {
      setLoading(false); // 🔑 loader stops ONLY after API completes
    }
  };

  useEffect(() => {
    if (user) {
      fetchMyOrders();
    } else {
      setLoading(false);
    }
  }, [user]);

  /* ================= ORDER TRACKING ================= */
  const statusSteps = [
    { value: "pending", label: "Pending" },
    { value: "confirmed", label: "Confirmed" },
    { value: "shipped", label: "Shipped" },
    { value: "delivered", label: "Delivered" },
  ];

  const getCurrentStepIndex = (status) => {
    if (!status || status === "cancelled") return -1;
    return statusSteps.findIndex((step) => step.value === status.toLowerCase());
  };

  const getStepDate = (order, stepValue) => {
    if (stepValue === "pending")
      return new Date(order.createdAt).toLocaleDateString("en-IN");
    if (stepValue === "shipped" && order.shippedAt)
      return new Date(order.shippedAt).toLocaleDateString("en-IN");
    if (stepValue === "delivered" && order.deliveredAt)
      return new Date(order.deliveredAt).toLocaleDateString("en-IN");
    return null;
  };

  /* ================= LOADER ================= */
  const LoadingSpinner = () => (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="w-12 h-12 border-4 border-gray-300 border-t-primary rounded-full animate-spin" />
      <p className="mt-4 text-sm text-gray-500">Loading your orders...</p>
    </div>
  );

  return (
    <div className="mt-16 pb-16">
      {/* ================= HEADER ================= */}
      <div className="flex flex-col items-end w-max mb-8">
        <p className="text-2xl font-medium uppercase">My Orders</p>
        <div className="w-16 h-0.5 bg-primary rounded-full"></div>
      </div>

      {/* ================= STATES ================= */}
      {loading ? (
        <LoadingSpinner />
      ) : myOrders.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-gray-400 text-6xl mb-4">No orders found</div>
          <p className="text-gray-600">
            You haven&apos;t placed any orders yet.
          </p>
        </div>
      ) : (
        myOrders.map((order) => {
          const currentStepIdx = getCurrentStepIndex(order.orderStatus);
          const isCancelled = order.orderStatus === "cancelled";

          return (
            <div
              key={order._id}
              className="border border-gray-200 rounded-xl mb-10 p-6 bg-white max-w-5xl w-full mx-auto shadow-sm hover:shadow-md transition"
            >
              {/* ================= ORDER HEADER ================= */}
              <div className="flex flex-wrap justify-between gap-3 text-sm text-gray-600 border-b pb-3 mb-6">
                <span>
                  <strong className="text-gray-800">Order ID:</strong>{" "}
                  {order.orderId}
                </span>
                <span>
                  <strong className="text-gray-800">Payment:</strong>{" "}
                  {order.paymentType?.toUpperCase()}
                </span>
                <span>
                  <strong className="text-gray-800">Total:</strong> {currency}
                  {order.totalAmount}
                </span>
              </div>

              {/* ================= TRACKING ================= */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-6">
                  Order Tracking (Tracking ID: {order.trackingId || "N/A"})
                </h3>

                {isCancelled ? (
                  <div className="text-center py-8">
                    <p className="text-2xl font-bold text-red-600">
                      Order Cancelled
                    </p>
                    <p className="text-gray-500 mt-2">
                      Cancelled on{" "}
                      {new Date(
                        order.updatedAt || order.createdAt
                      ).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-xl p-6 border">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                      {statusSteps.map((step, idx) => {
                        const isCompleted = idx < currentStepIdx;
                        const isActive = idx === currentStepIdx;
                        const date = isCompleted
                          ? getStepDate(order, step.value)
                          : null;

                        return (
                          <div
                            key={step.value}
                            className="flex flex-col items-center text-center"
                          >
                            <div
                              className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold shadow-md ${
                                isCompleted
                                  ? "bg-green-500 text-white"
                                  : isActive
                                  ? "bg-amber-400 text-white"
                                  : "bg-gray-300 text-gray-600"
                              }`}
                            >
                              {isCompleted ? "✓" : idx + 1}
                            </div>

                            <p className="mt-4 text-sm font-semibold">
                              {step.label}
                            </p>

                            {date && (
                              <p className="text-xs text-gray-500 mt-1">
                                {date}
                              </p>
                            )}

                            {isActive && (
                              <p className="text-xs mt-2 text-amber-600 font-medium">
                                Current Status
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* ================= ADDRESS ================= */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">Shipping Address</h3>
                <div className="bg-gray-50 p-5 rounded-lg border">
                  <p className="font-medium">
                    {order.address.firstName} {order.address.lastName}
                  </p>
                  <p>{order.address.street}</p>
                  <p>
                    {order.address.city}, {order.address.state}{" "}
                    {order.address.zipcode}
                  </p>
                  <p>{order.address.country}</p>
                  <p className="mt-2 font-medium">
                    Phone: {order.address.phone}
                  </p>
                </div>
              </div>

              {/* ================= ITEMS ================= */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Order Items</h3>

                {order.items.map((item, index) => {
                  const variant = item.productId?.variants?.find((v) =>
                    v.sizes.some((s) => s.size === item.size)
                  );

                  const image = variant?.images?.[0] || "/no-image.png";

                  return (
                    <div
                      key={item._id}
                      className={`flex flex-col md:flex-row justify-between gap-6 py-6 ${
                        index !== order.items.length - 1 ? "border-b" : ""
                      }`}
                    >
                      <div className="flex gap-5">
                        <img
                          src={image}
                          alt={item.productId?.name}
                          className="w-24 h-24 object-cover rounded border"
                        />
                        <div>
                          <h4 className="font-semibold">
                            {item.productId?.name}
                          </h4>
                          <p className="text-sm text-gray-500">
                            Size: {item.size} | Qty: {item.quantity}
                          </p>
                          <p className="text-sm">Color: {item.color || "—"}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-xl font-bold text-primary">
                          {currency}
                          {item.price * item.quantity}
                        </p>
                        <p className="text-sm text-gray-500">Item Total</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default MyOrders;
