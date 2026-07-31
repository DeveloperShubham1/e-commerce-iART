import React, { useMemo, useState } from "react";
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
    amountPaid: order.amountPaid ?? 0,
  });

  const [previewImage, setPreviewImage] = useState(null); // full-size screenshot viewer

  const handleChange = (field, value) => {
    setEditable((prev) => ({ ...prev, [field]: value }));
  };

  // Live-computed as the merchant types, mirroring the backend virtual
  // (totalAmount - amountPaid), so they see the effect before saving.
  const pendingAmount = useMemo(() => {
    const paid = Number(editable.amountPaid) || 0;
    return Math.max(order.totalAmount - paid, 0);
  }, [editable.amountPaid, order.totalAmount]);

  const handleAmountPaidChange = (value) => {
    // Keep it numeric and clamp to a sane range as they type
    let num = value === "" ? 0 : Number(value);
    if (Number.isNaN(num)) return;
    if (num < 0) num = 0;
    if (num > order.totalAmount) num = order.totalAmount;
    handleChange("amountPaid", num);
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-4xl rounded-xl shadow-lg overflow-y-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
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
                <strong>Name:</strong> {order.userId?.name || "N/A"}
              </p>
              <p>
                <strong>Email:</strong> {order.userId?.email || "N/A"}
              </p>
              <p>
                <strong>Phone:</strong> {order.userId?.phone || "N/A"}
              </p>
            </div>

            {/* SHIPPING */}
            <div className="bg-gray-50 p-4 rounded-md border">
              <h3 className="font-semibold text-base mb-2">Shipping Address</h3>
              <p>
                {order?.address?.firstName} {order?.address?.lastName}
              </p>
              <p>{order?.address?.street}, {order?.address?.landmark}</p>
              <p>
                {order?.address?.city}, {order?.address?.state} -{" "}
                {order?.address?.zipcode}
              </p>
              <p>{order?.address?.country}</p>
              <p className="mt-1 font-semibold">Phone: {order?.address?.phone}</p>
            </div>
          </div>

          {/* PAYMENT OVERVIEW: amount paid / pending + proof screenshots */}
          <div className="bg-gray-50 p-4 rounded-md border">
            <h3 className="font-semibold text-base mb-3">Payment Details</h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 text-sm">
              <div>
                <p className="text-gray-500">Order Total</p>
                <p className="font-semibold text-base">
                  {currency} {order.totalAmount}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Pending Amount</p>
                <p
                  className={`font-semibold text-base ${pendingAmount > 0 ? "text-red-600" : "text-green-600"
                    }`}
                >
                  {currency} {pendingAmount}
                </p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">Payment Type</p>
                <p className="font-semibold uppercase">{order.paymentType}</p>
              </div>
            </div>

            {/* Payment proof screenshots, if any */}
            {order.paymentImage?.length > 0 ? (
              <div>
                <p className="text-gray-500 text-sm mb-2">
                  Payment Screenshot{order.paymentImage.length > 1 ? "s" : ""}
                </p>
                <div className="flex flex-wrap gap-3">
                  {order.paymentImage.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPreviewImage(url)}
                      className="block"
                    >
                      <img
                        src={url}
                        alt={`Payment proof ${idx + 1}`}
                        className="h-20 w-20 object-cover rounded border hover:opacity-80 transition"
                      />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400">
                No payment screenshot uploaded
              </p>
            )}
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
                 onChange={(e) => {
  const value = e.target.value;

  setEditable((prev) => ({
    ...prev,
    paymentStatus: value,
    amountPaid:
      value === "paid"
        ? order.totalAmount
        : value === "failed"
        ? 0
        : value === "pending"
        ? 0
        : prev.amountPaid,
  }));
}}
                >
                  <option value="pending">Pending</option>
                  <option value="partial">Partially Paid</option>
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

            {/* Amount Paid */}
            {editable.paymentType != "online" && (
              <div>
                <label className="font-semibold">
                  Amount Paid ({currency})
                </label>
                <input
                  type="number"
                  min={0}
                  max={order.totalAmount}
                  className="w-full border p-2 rounded"
                  value={editable.amountPaid}
                  onChange={(e) => handleAmountPaidChange(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Pending: {currency} {pendingAmount} of {currency}{" "}
                  {order.totalAmount}
                </p>
              </div>
            )}

            <div>
              <label className="font-semibold">Payment Type</label>
              <p className="w-full border p-2 rounded uppercase">
                {editable?.paymentType}
              </p>
            </div>


            {/* Tracking Partner */}
            {(editable.orderStatus === "shipped" ||
              editable.orderStatus === "delivered") && (
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

            {/* Status tracking id */}
            {(editable.orderStatus === "shipped" ||
              editable.orderStatus === "delivered") && (
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

      {/* FULL-SIZE SCREENSHOT VIEWER */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4"
          onClick={(e) => {
            e.stopPropagation();
            setPreviewImage(null);
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setPreviewImage(null);
            }}
            className="absolute top-5 right-5 text-white"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={previewImage}
            alt="Payment proof full size"
            className="max-h-[85vh] max-w-full rounded shadow-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default UpdateOrderModal;