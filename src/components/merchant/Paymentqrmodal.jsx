import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { uploadSingleFile } from "../merchant/Uploadsinglefile";

// ---------------------------------------------------------------------------
const PaymentQrModal = ({
    open,
    mode, // "cod" | "upi"
    onClose,
    onConfirm,
    qrCodeImage,
    upiId,
    amount,
}) => {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState("");
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (!open) {
            setFile(null);
            setPreview("");
        }
    }, [open]);

    useEffect(() => {
        return () => {
            if (preview) URL.revokeObjectURL(preview);
        };
    }, [preview]);

    if (!open) return null;

    const handleFileChange = (e) => {
        const f = e.target.files?.[0];
        if (!f) return;
        if (!f.type.startsWith("image/")) {
            toast.error("Please upload an image of your payment screenshot");
            return;
        }
        setFile(f);
        setPreview(URL.createObjectURL(f));
    };

    const handleCopyUpi = async () => {
        try {
            await navigator.clipboard.writeText(upiId);
            toast.success("UPI ID copied");
        } catch {
            // clipboard can fail silently on some browsers/permissions — not critical
        }
    };

    const handleConfirm = async () => {
        if (!file) {
            toast.error("Please upload your payment screenshot to continue");
            return;
        }
        setUploading(true);
        try {
            const url = await uploadSingleFile(file);
            onConfirm(url);
        } catch (err) {
            toast.error(err.message || "Failed to upload screenshot");
        } finally {
            setUploading(false);
        }
    };

    const title =
        mode === "upi" ? `Pay ₹${amount} via UPI` : `Pay ₹${amount} Advance for COD`;
    const description =
        mode === "upi"
            ? "Scan the QR code or pay to the UPI ID below to pay the full order amount, then upload your payment screenshot to place your order."
            : "Scan the QR code or pay to the UPI ID below, then upload your payment screenshot to confirm your Cash on Delivery order.";

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
            onClick={onClose}
        >
            <div
                className="w-full max-w-sm rounded-xl bg-white p-5 sm:p-6 max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                <p className="mt-1 text-sm text-gray-500">{description}</p>

                {qrCodeImage && (
                    <div className="mt-4 flex justify-center">
                        <img
                            src={qrCodeImage}
                            alt="Payment QR code"
                            className="h-44 w-44 rounded border border-gray-200 object-contain bg-white"
                        />
                    </div>
                )}

                {upiId && (
                    <div className="mt-3 flex items-center justify-center gap-2">
                        <span className="text-sm font-medium text-gray-700">{upiId}</span>
                        <button
                            type="button"
                            onClick={handleCopyUpi}
                            className="text-xs text-primary hover:underline"
                        >
                            Copy
                        </button>
                    </div>
                )}

                <div className="mt-5 border-t pt-4">
                    <label className="block text-xs font-medium text-gray-600 mb-2">
                        Upload payment screenshot
                    </label>

                    <div className="flex items-center gap-3">
                        {preview ? (
                            <img
                                src={preview}
                                alt="Payment screenshot preview"
                                className="h-16 w-16 rounded border border-gray-200 object-cover"
                            />
                        ) : (
                            <div className="h-16 w-16 rounded border border-dashed border-gray-300 flex items-center justify-center text-[10px] text-gray-400 text-center px-1">
                                No file
                            </div>
                        )}

                        <label className="cursor-pointer text-sm font-medium text-primary hover:underline">
                            {preview ? "Change screenshot" : "Choose screenshot"}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        </label>
                    </div>
                </div>

                <div className="mt-6 flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-2.5 text-sm border rounded text-gray-600 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={uploading}
                        className="flex-1 py-2.5 text-sm bg-primary text-white rounded font-medium hover:bg-primary-dull disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {uploading ? "Uploading…" : "Confirm Payment"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentQrModal;