import React, { useState } from "react";
import { X } from "lucide-react";
import { toast } from "react-toastify";
import { courierPartners } from "../../assets/trackingPartners";

const UpdateOrderModal = ({ order, onClose, onUpdated, axios, currency }) => {
  const [editable, setEditable] = useState({
    paymentStatus: order.paymentStatus,
    orderStatus: order.orderStatus,
    status: order.status,
    isPaid: order.isPaid,
    paymentType: order.paymentType,
    trackingPartner: order.trackingPartner || "",
  });

  const handleChange = (field, value) => {
    setEditable((prev) => ({ ...prev, [field]: value }));
  };

  const handleUpdate = async () => {
    // 🚫 Validation: tracking ID required when shipped
    if (
      editable.orderStatus === "shipped" &&
      (!editable.status || editable.status.trim() === "")
    ) {
      toast.error("Tracking ID is required when order is shipped");
      return;
    }

    if (
      editable.orderStatus === "shipped" &&
      (!editable.trackingPartner || editable.trackingPartner.trim() === "")
    ) {
      toast.error("Tracking Partner is required when order is shipped");
      return;
    }

    try {
      const { data } = await axios.put(
        `/api/orders/update/${order._id}`,
        editable
      );

      if (data.success) {
        toast.success(data?.message);
        onUpdated();
        onClose();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white w-full max-w-4xl rounded-xl shadow-lg overflow-y-auto max-h-[90vh]">
        {/* HEADER */}
        <div className="flex justify-between items-center p-5 border-b">
          <div>
            <h2 className="font-semibold text-lg">Order ID: {order.orderId}</h2>
            <p className="text-sm text-gray-600">
              {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-gray-500 hover:text-black" />
          </button>
        </div>

        {/* BODY */}
        <div className="p-6 space-y-6">
          {/* ORDER ITEMS */}
          <div>
            <h3 className="font-semibold text-base mb-3">Items</h3>

            {order.items.map((item) => (
              <div
                key={item._id}
                className="flex justify-between items-center mb-3 border-b pb-2"
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

                <p className="font-semibold text-primary">
                  ₹{item.price * item.quantity}
                </p>
              </div>
            ))}
          </div>

          {/* USER & SHIPPING */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* USER DETAILS */}
            <div className="bg-gray-50 p-4 rounded-md border">
              <h3 className="font-semibold text-base mb-2">Customer Details</h3>
              <p>
                <strong>Name:</strong> {order.userId?.name}
              </p>
              <p>
                <strong>Email:</strong> {order.userId?.email}
              </p>
            </div>

            {/* SHIPPING */}
            <div className="bg-gray-50 p-4 rounded-md border">
              <h3 className="font-semibold text-base mb-2">Shipping Address</h3>
              <p>
                {order.address.firstName} {order.address.lastName}
              </p>
              <p>{order?.address?.street}, {order?.address?.landmark}</p>
              <p>
                {order.address.city}, {order.address.state} -{" "}
                {order.address.zipcode}
              </p>
              <p>{order.address.country}</p>
              <p className="mt-1 font-semibold">Phone: {order.address.phone}</p>
            </div>
          </div>

          {/* EDITABLE FIELDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {/* Payment Status */}
            {editable.paymentType != "online" && (
              <div>
                <label className="font-semibold">Payment Status</label>
                <select
                  className="w-full border p-2 rounded"
                  value={editable.paymentStatus}
                  onChange={(e) =>
                    handleChange("paymentStatus", e.target.value)
                  }
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
            )}

            {/* Order Status */}
            <div>
              <label className="font-semibold">Order Status</label>
              <select
                className="w-full border p-2 rounded"
                value={editable.orderStatus}
                onChange={(e) => handleChange("orderStatus", e.target.value)}
              >
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="font-semibold">Payment Type</label>
              <p className="w-full border p-2 rounded uppercase">
                {editable?.paymentType}
              </p>
            </div>

            {/* Status */}
            {(editable.orderStatus === "shipped" ||
              editable.orderStatus === "delivered" ||
              editable.orderStatus === "cancelled") && (
                <div>
                  <label className="font-semibold">
                    Tracking ID
                    {editable.orderStatus === "shipped" && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </label>

                  <input
                    type="text"
                    className={`w-full border p-2 rounded ${editable.orderStatus === "shipped" &&
                      (!editable.status || editable.status.trim() === "")
                      ? "border-red-500"
                      : ""
                      }`}
                    value={editable.status || ""}
                    onChange={(e) => handleChange("status", e.target.value)}
                  />

                  {editable.orderStatus === "shipped" &&
                    (!editable.status || editable.status.trim() === "") && (
                      <p className="text-xs text-red-500 mt-1">
                        Tracking ID is required for shipped orders
                      </p>
                    )}
                </div>
              )}

            {/* Tracking Partner */}
            {(editable.orderStatus === "shipped" ||
              editable.orderStatus === "delivered" ||
              editable.orderStatus === "cancelled") && (
                <div>
                  <label className="font-semibold">
                    Tracking Partner
                    <span className="text-red-500 ml-1">*</span>
                  </label>

                  <select
                    className={`w-full border p-2 rounded ${(!editable.trackingPartner || editable.trackingPartner.trim() === "")
                      ? "border-red-500"
                      : ""
                      }`}
                    value={editable.trackingPartner || ""}
                    onChange={(e) => handleChange("trackingPartner", e.target.value)}
                  >
                    <option value="">Select Tracking Partner</option>
                    {courierPartners.map((partner) => (
                      <option key={partner.value} value={partner.value}>
                        {partner.label}
                      </option>
                    ))}
                  </select>

                  {(!editable.trackingPartner || editable.trackingPartner.trim() === "") && (
                    <p className="text-xs text-red-500 mt-1">
                      Tracking Partner is required for shipped orders
                    </p>
                  )}
                </div>
              )}

            {/* Is Paid */}
            {/* {editable.paymentType != "online" && (
              <div>
                <label className="font-semibold">Is Paid</label>
                <select
                  className="w-full border p-2 rounded"
                  value={String(editable.isPaid)}
                  onChange={(e) =>
                    handleChange("isPaid", e.target.value === "true")
                  }
                >
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </div>
            )} */}
          </div>

          {/* TOTAL + SAVE */}
          <div className="flex justify-between items-center border-t pt-4">
            <p className="font-bold text-lg">
              Total: {currency} {order.totalAmount}
            </p>

            <button
              onClick={handleUpdate}
              disabled={
                editable.orderStatus === "shipped" &&
                ((!editable.status || editable.status.trim() === "") ||
                  (!editable.trackingPartner || editable.trackingPartner.trim() === ""))
              }
              className={`py-2 px-6 rounded-md text-white ${editable.orderStatus === "shipped" &&
                ((!editable.status || editable.status.trim() === "") ||
                  (!editable.trackingPartner || editable.trackingPartner.trim() === ""))
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700"
                }`}
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdateOrderModal;
