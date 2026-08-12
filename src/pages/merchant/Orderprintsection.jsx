import React, { forwardRef } from "react";

/**
 * Printable order summary — Order ID/date, Items, Customer Details,
 * and Shipping Address. Rendered off-screen inside the modal and
 * shown only when printing (see PrintStyles.jsx).
 */
const OrderPrintSection = forwardRef(({ order, currency }, ref) => {
  if (!order) return null;

  return (
    <div ref={ref} className="printable-order text-black bg-white">
      {/* HEADER */}
      <div className="mb-5 pb-3 border-b border-gray-300">
        <h2 className="font-bold text-lg">Order ID: {order.orderId}</h2>
        <p className="text-sm text-gray-600">
          {new Date(order.createdAt).toLocaleString()}
        </p>
      </div>

      {/* ITEMS */}
      <div className="mb-6">
        <h3 className="font-semibold text-base mb-3">Items</h3>

        {order.items?.map((item) => (
          <div
            key={item._id}
            className="flex justify-between items-center mb-2 border-b border-gray-200 pb-2"
          >
            <div>
              <p className="font-medium">
                {item.productId?.name || "Product"}
              </p>
              <p className="text-sm text-gray-600">
                Size: {item?.size} | Qty: {item?.quantity} | Color:{" "}
                {item?.color}
              </p>
            </div>

            <p className="font-semibold">
              {currency} {item.price * item.quantity}
            </p>
          </div>
        ))}
      </div>

      {/* CUSTOMER + SHIPPING */}
      <div className="grid grid-cols-2 gap-5">
        <div className="border border-gray-300 rounded-md p-4">
          <h3 className="font-semibold text-base mb-2">Customer Details</h3>
          <p>
            <strong>Name:</strong> {order.userId?.name || "N/A"}
          </p>
          <p>
            <strong>Email:</strong> {order.userId?.email || "N/A"}
          </p>
          <p>
            <strong>Phone:</strong> {order.userId?.phone || "N/A"}
          </p>
        </div>

        <div className="border border-gray-300 rounded-md p-4">
          <h3 className="font-semibold text-base mb-2">Shipping Address</h3>
          <p>
            {order?.address?.firstName} {order?.address?.lastName}
          </p>
          <p>
            {order?.address?.street}, {order?.address?.landmark}
          </p>
          <p>
            {order?.address?.city}, {order?.address?.state} -{" "}
            {order?.address?.zipcode}
          </p>
          <p>{order?.address?.country}</p>
          <p className="mt-1 font-semibold">
            Phone: {order?.address?.phone}
          </p>
        </div>
      </div>

      {/* TOTAL */}
      <div className="mt-6 pt-3 border-t border-gray-300 flex justify-end">
        <p className="font-bold text-lg">
          Total: {currency} {order.totalAmount}
        </p>
      </div>
    </div>
  );
});

OrderPrintSection.displayName = "OrderPrintSection";

export default OrderPrintSection;