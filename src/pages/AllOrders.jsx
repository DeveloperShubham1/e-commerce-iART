import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Button, Card, SearchField, Badge, Pagination, ResponsiveView, SkeletonRow } from '../components/ui';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { fetchAllOrders } from '../Components/Redux/MerchantSlice';

const PER_PAGE = 10;
const SEARCH_DEBOUNCE_MS = 300;

const emptyPagination = {
    current_page: 1,
    per_page: PER_PAGE,
    total_records: 0,
    total_pages: 1,
    has_next_page: false,
    has_prev_page: false,
};

const ORDER_STATUS = [
    { label: "All", value: "" },
    { label: "Pending", value: "pending" },
    { label: "Confirmed", value: "confirmed" },
    { label: "Shipped", value: "shipped" },
    { label: "Delivered", value: "delivered" },
    { label: "Cancelled", value: "cancelled" },
];

const orderStatusVariant = (status) => {
    switch (status) {
        case "pending": return "warning";
        case "confirmed": return "info";
        case "shipped": return "info";
        case "delivered": return "success";
        case "cancelled": return "danger";
        case "returned": return "warning";
        default: return "neutral";
    }
};

const paymentStatusVariant = (status) => {
    switch (status) {
        case "paid": return "success";
        case "pending": return "warning";
        case "failed": return "danger";
        case "refunded": return "neutral";
        case "partial": return "neutral";
        default: return "neutral";
    }
};

const formatCurrency = (amount) =>
    `₹${Number(amount ?? 0).toLocaleString("en-IN")}`;

const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });

export const AllOrders = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const {
        allOrders: selectAllOrders,
    } = useSelector((state) => state.merchant);
    const orders = selectAllOrders.data;
    const pagination = selectAllOrders.pagination || emptyPagination;
    const loading = selectAllOrders.loading;

    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [status, setStatus] = useState("");

    // Debounce the raw search input before it drives a request
    useEffect(() => {
        const handle = setTimeout(() => {
            setDebouncedSearch(search);
            setCurrentPage(1);
        }, SEARCH_DEBOUNCE_MS);
        return () => clearTimeout(handle);
    }, [search]);

    useEffect(() => {
        dispatch(fetchAllOrders({
            page: currentPage,
            per_page: PER_PAGE,
            search: debouncedSearch,
            status: status,
        }))
    }, [dispatch, debouncedSearch, currentPage, status])

    const handleSearchChange = (value) => {
        setSearch(value);
    };

    const columns = [
        {
            key: "order",
            header: "Order",
            render: (row) => (
                <div>
                    <p className="font-semibold text-slate-800">{row.orderId}</p>
                    <p className="text-xs text-slate-500">
                        {formatDate(row.createdAt)}
                    </p>
                </div>
            ),
        },

        {
            key: "customer",
            header: "Customer",
            render: (row) => (
                <div>
                    <p className="font-semibold text-slate-800">
                        {row.customer?.phone || "N/A"}
                    </p>
                    <p className="font-medium text-slate-800">
                        {row.customer?.name || "N/A"}
                    </p>

                    <p className="text-xs text-slate-500">
                        {row.customer?.email || "N/A"}
                    </p>

                    {row.customer?.isGuest && (
                        <Badge variant="warning" className="mt-1">
                            Guest
                        </Badge>
                    )}
                </div>
            ),
        },

        {
            key: "merchant",
            header: "Merchant",
            render: (row) => (
                <div>
                    <p className="font-medium text-slate-800">
                        {row.merchant?.MerchantName || "-"}
                    </p>

                    <p className="text-xs text-slate-500">
                        {row.merchant?.email || "-"}
                    </p>
                </div>
            ),
        },

        {
            key: "items",
            header: "Items",
            render: (row) => (
                <span className="font-semibold">
                    {row.totalItems}
                </span>
            ),
        },

        {
            key: "amount",
            header: "Amount",
            render: (row) => (
                <div>
                    <p className="font-semibold text-slate-800">
                        {formatCurrency(row.totalAmount)}
                    </p>

                    <p className="text-xs text-green-600">
                        Paid: {formatCurrency(row.amountPaid)}
                    </p>

                    <p className="text-xs text-red-500">
                        Pending: {formatCurrency(
                            (row.totalAmount || 0) - (row.amountPaid || 0)
                        )}
                    </p>
                </div>
            ),
        },

        {
            key: "payment",
            header: "Payment",
            render: (row) => (
                <div className="space-y-1">
                    <Badge variant={paymentStatusVariant(row.paymentStatus)}>
                        {row.paymentStatus}
                    </Badge>

                    <p className="text-xs uppercase text-slate-500">
                        {row.paymentType}
                    </p>
                </div>
            ),
        },

        {
            key: "status",
            header: "Order Status",
            render: (row) => (
                <Badge variant={orderStatusVariant(row.orderStatus)}>
                    {row.orderStatus}
                </Badge>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                    <h2 className="text-xl font-bold text-slate-800"> Orders</h2>
                    <p className="text-sm text-slate-500">View all order</p>
                </div>
                <Button onClick={() => navigate(-1)} className="bg-white text-slate-900 shadow-sm hover:bg-slate-100">
                    <ArrowLeft className="h-4 w-4" /> Back
                </Button>
            </div>

            <Card className="p-4">
                <SearchField
                    value={search}
                    onChange={handleSearchChange}
                    placeholder="Search Customer..."
                    className="max-w-sm"
                />
            </Card>

            <Card className="p-4">
                <div className="flex flex-wrap gap-2">
                    {ORDER_STATUS.map((tab) => (
                        <button
                            key={tab.value || "all"}
                            onClick={() => {
                                setStatus(tab.value);
                                setCurrentPage(1);
                            }}
                            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all
                    ${status === tab.value
                                    ? "bg-primary-600 text-white shadow"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </Card>

            <Card className="p-0">
                {loading ? (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                                    {[
                                        "Order",
                                        "Customer",
                                        "Merchant",
                                        "Items",
                                        "Amount",
                                        "Payment",
                                        "Order Status",
                                    ].map((h) => (
                                        <th key={h} className="px-5 py-3 font-semibold">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>

                            <tbody>
                                <SkeletonRow columns={7} />
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <ResponsiveView columns={columns} data={orders} emptyText="No orders found" />
                )}
                {!loading && pagination.total_records > 0 && (
                    <div className="border-t border-slate-100">
                        <Pagination
                            pagination={pagination}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                )}
            </Card>
        </div>
    )
}