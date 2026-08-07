import { loadRazorpay } from "../components/utils/loadRazorpay";
import { toast } from "react-toastify";
import { useAppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";

const PayNowButton = ({ merchantId, items, addressId }) => {
  const navigate = useNavigate();
  const { axios } = useAppContext();
  const handlePayment = async () => {
    try {
      const loaded = await loadRazorpay();
      if (!loaded) {
        toast.error("Razorpay SDK failed to load");
        return;
      }

      if (!addressId) {
        toast.error("Please select a delivery address ");
        return;
      }

      // 1️⃣ Create order (Backend)
      const { data } = await axios.post(
        "/api/orders/stripe",
        {
          merchantId,
          items,
          address: addressId,
        },
        { withCredentials: true },
      );

      if (!data.success) {
        toast.error(data.message);
        return;
      }

      const { razorpayOrder, key } = data;

      // 2️⃣ Razorpay options
      const options = {
        key,
        amount: razorpayOrder.amount,
        currency: "INR",
        name: "My Store",
        description: "Order Payment",
        order_id: razorpayOrder.id,

        handler: async function (response) {
          try {
            // 3️⃣ Verify payment (Backend)
            const verifyRes = await axios.post(
              "/api/orders/verify-payment",
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              },
              { withCredentials: true },
            );

            if (verifyRes.data.success) {
              toast.success("Payment successful 🎉");
              // 👉 redirect to orders page
              navigate("/my-orders", { state: { justPlaced: true } });
            } else {
              toast.error("Payment verification failed");
            }
          } catch (err) {
            toast.error(
              err.response.data.message || "Payment verification error",
            );
          }
        },

        prefill: {
          name: "Customer Name",
          email: "customer@email.com",
          contact: "9999999999",
        },

        theme: {
          color: "#0f172a",
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();

      // ❌ Payment cancelled
      razorpay.on("payment.failed", function (response) {
        toast.error("Payment failed");
        console.error(response.error);
      });
    } catch (error) {
      toast.error(
        error.response.data.message || "Order creation failed",
      );
    }
  };

  return (
    <button
      onClick={handlePayment}
      className="w-full py-3 bg-primary text-white font-medium rounded cursor-pointer hover:bg-primary/80"
    >
      Pay Now
    </button>
  );
};

export default PayNowButton;
