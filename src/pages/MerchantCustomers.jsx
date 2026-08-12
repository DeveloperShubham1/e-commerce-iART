import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    Button,
    Card,
    SearchField,
    Badge,
    Pagination,
    ResponsiveView,
    SkeletonRow,
    ActionDropdown,
    Modal,
} from "../components/ui";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchCustomersList } from "../Components/Redux/MerchantSlice";

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

const formatCurrency = (amount) =>
    `₹${Number(amount ?? 0).toLocaleString("en-IN")}`;

const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });

export const MerchantCustomers = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const params = useParams();

    const { customers: selectCustomers } = useSelector(
        (state) => state.merchant
    );

    const customers = selectCustomers?.customers || [];

    const pagination =
        selectCustomers?.pagination || emptyPagination;

    const loading = selectCustomers?.loading;

    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [includeGuests, setIncludeGuests] = useState(true);

    // Cart Modal
    const [cartModalOpen, setCartModalOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);

    const openCartModal = (customer) => {
        setSelectedCustomer(customer);
        setCartModalOpen(true);
    };

    const closeCartModal = () => {
        setCartModalOpen(false);
        setSelectedCustomer(null);
    };

    // Debounce search
    useEffect(() => {
        const handle = setTimeout(() => {
            setDebouncedSearch(search);
            setCurrentPage(1);
        }, SEARCH_DEBOUNCE_MS);

        return () => clearTimeout(handle);
    }, [search]);

    // Fetch customers
    useEffect(() => {
        dispatch(
            fetchCustomersList({
                merchantId: params.id,
                page: currentPage,
                per_page: PER_PAGE,
                search: debouncedSearch,
                includeGuests: includeGuests,
            })
        );
    }, [
        dispatch,
        params.id,
        debouncedSearch,
        currentPage,
        includeGuests,
    ]);

    const handleSearchChange = (value) => {
        setSearch(value);
    };

    const columns = [
        {
            key: "customer",
            header: "Customer",
            render: (row) => (
                <div>
                    <p className="font-semibold text-slate-800">
                        {row.phone || "N/A"}
                    </p>

                    <p className="text-xs text-slate-500">
                        {row.name || "N/A"}
                    </p>

                    <p className="text-xs text-slate-500">
                        {row.email || "N/A"}
                    </p>
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
            key: "orders",
            header: "Orders",
            render: (row) => (
                <span className="font-semibold">
                    {row.totalOrders}
                </span>
            ),
        },

        {
            key: "spent",
            header: "Total Spent",
            render: (row) => (
                <span className="font-semibold text-green-600">
                    {formatCurrency(row.totalSpent)}
                </span>
            ),
        },

        {
            key: "cartItems",
            header: "Cart",
            render: (row) => (
                <Badge variant="info">
                    {row.cartItems || 0} Items
                </Badge>
            ),
        },

        {
            key: "lastOrder",
            header: "Last Order",
            render: (row) =>
                row.lastOrder ? (
                    formatDate(row.lastOrder)
                ) : (
                    <span className="text-slate-400">
                        Never
                    </span>
                ),
        },

        // NEW
        {
            key: "actions",
            header: "Actions",
            render: (row) => (
                <ActionDropdown
                    actions={[
                        {
                            label: "View Cart Items",
                            icon: ShoppingCart,
                            onClick: () => openCartModal(row),
                        },
                    ]}
                />
            ),
        },
    ];

    return (
        <div className="space-y-6">

            {/* Header */}
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">
                        {customers?.[0]?.merchant?.MerchantName ||
                            "Merchant"}{" "}
                        Customers
                    </h2>

                    <p className="text-sm text-slate-500">
                        View all Customers of merchants
                    </p>
                </div>

                <Button
                    onClick={() => navigate(-1)}
                    className="bg-white text-slate-900 shadow-sm hover:bg-slate-100"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                </Button>
            </div>

            {/* Search */}
            <Card className="p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                    <SearchField
                        value={search}
                        onChange={handleSearchChange}
                        placeholder="Search Customers..."
                        className="max-w-sm"
                    />

                    <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
                        <input
                            type="checkbox"
                            checked={includeGuests}
                            onChange={(e) => {
                                setIncludeGuests(e.target.checked);
                                setCurrentPage(1);
                            }}
                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />

                        Include Guest Customers
                    </label>
                </div>
            </Card>

            {/* Customers Table */}
            <Card className="p-0">
                {loading ? (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                                    {[
                                        "Customer",
                                        "Merchant",
                                        "Orders",
                                        "Total Spent",
                                        "Cart Items",
                                        "Last Order",
                                        "Actions",
                                    ].map((h) => (
                                        <th
                                            key={h}
                                            className="px-5 py-3 font-semibold"
                                        >
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
                    <ResponsiveView
                        columns={columns}
                        data={customers}
                        emptyText="No customers found"
                    />
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

            {/* ================= CART MODAL ================= */}
            <Modal
                isOpen={cartModalOpen}
                onClose={closeCartModal}
                title={`Cart Items - ${selectedCustomer?.name ||
                    selectedCustomer?.phone ||
                    "Customer"
                    }`}
                size="xl"
            >
                {selectedCustomer && (
                    <div className="space-y-5">

                        {/* Customer Information */}
                        <div className="rounded-xl bg-slate-50 p-4">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

                                <div>
                                    <p className="text-xs text-slate-500">
                                        Customer
                                    </p>

                                    <p className="font-medium text-slate-800">
                                        {selectedCustomer.name ||
                                            "Guest"}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs text-slate-500">
                                        Phone
                                    </p>

                                    <p className="font-medium text-slate-800">
                                        {selectedCustomer.phone ||
                                            "N/A"}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs text-slate-500">
                                        Email
                                    </p>

                                    <p className="break-all font-medium text-slate-800">
                                        {selectedCustomer.email ||
                                            "N/A"}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs text-slate-500">
                                        Cart Items
                                    </p>

                                    <p className="font-semibold text-slate-800">
                                        {selectedCustomer.cartItems ||
                                            0}
                                    </p>
                                </div>

                            </div>
                        </div>

                        {/* Empty Cart */}
                        {!selectedCustomer.cart?.length ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">

                                <ShoppingCart className="mb-3 h-10 w-10 text-slate-300" />

                                <p className="font-medium text-slate-600">
                                    Cart is empty
                                </p>

                                <p className="mt-1 text-sm text-slate-400">
                                    This customer has no items in
                                    their cart.
                                </p>

                            </div>
                        ) : (
                            <div className="space-y-4">

                                {selectedCustomer.cart.map(
                                    (item, index) => {

                                        /*
                                         * Your API response is:
                                         *
                                         * item.productId = populated product
                                         * item.variantId = variant ObjectId
                                         *
                                         * Therefore find the selected
                                         * variant inside product.variants.
                                         */

                                        const product =
                                            item.productId;

                                        const variant =
                                            product?.variants?.find(
                                                (v) =>
                                                    String(v._id) ===
                                                    String(
                                                        item.variantId
                                                    )
                                            );

                                        // Thumbnail
                                        const thumbnail =
                                            variant?.images?.[
                                            variant?.thumbnailIndex
                                            ] ||
                                            variant?.images?.[0] ||
                                            product?.variants?.[0]
                                                ?.images?.[
                                            product?.variants?.[0]
                                                ?.thumbnailIndex
                                            ] ||
                                            product?.variants?.[0]
                                                ?.images?.[0];

                                        return (
                                            <div
                                                key={
                                                    item._id ||
                                                    index
                                                }
                                                className="overflow-hidden rounded-xl border border-slate-200 bg-white"
                                            >

                                                {/* Product Header */}
                                                <div className="flex flex-col gap-4 p-4 sm:flex-row">

                                                    {/* Product Image */}
                                                    <div className="shrink-0">
                                                        {thumbnail ? (
                                                            <img
                                                                src={
                                                                    thumbnail
                                                                }
                                                                alt={
                                                                    product?.name ||
                                                                    "Product"
                                                                }
                                                                className="h-28 w-28 rounded-xl border border-slate-200 object-cover"
                                                            />
                                                        ) : (
                                                            <div className="flex h-28 w-28 items-center justify-center rounded-xl bg-slate-100 text-sm text-slate-400">
                                                                No Image
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Product Details */}
                                                    <div className="min-w-0 flex-1">

                                                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">

                                                            <div className="min-w-0">

                                                                <p className="text-xs font-medium text-slate-400">
                                                                    Product #
                                                                    {index +
                                                                        1}
                                                                </p>

                                                                <h3 className="mt-1 line-clamp-2 font-semibold text-slate-800"
                                                                    title={product?.name || "Product unavailable"}
                                                                >
                                                                    {product?.name ||
                                                                        "Product unavailable"}
                                                                </h3>

                                                                {product?.brand && (
                                                                    <p className="mt-1 text-sm text-slate-500">
                                                                        Brand:{" "}
                                                                        {
                                                                            product.brand
                                                                        }
                                                                    </p>
                                                                )}

                                                                {product?.sku && (
                                                                    <p className="mt-1 break-all text-xs text-slate-500">
                                                                        SKU:{" "}
                                                                        {
                                                                            product.sku
                                                                        }
                                                                    </p>
                                                                )}

                                                            </div>

                                                            {/* Quantity */}
                                                            <div className="shrink-0">
                                                                <p className="text-xs text-slate-500">
                                                                    Quantity
                                                                </p>

                                                                <Badge variant="info">
                                                                    {
                                                                        item.quantity
                                                                    }
                                                                </Badge>
                                                            </div>

                                                        </div>

                                                        {/* Variant Details */}
                                                        <div className="mt-4 flex flex-wrap gap-3">

                                                            {/* Color */}
                                                            <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">

                                                                <span
                                                                    className="h-5 w-5 rounded-full border border-slate-300"
                                                                    style={{
                                                                        backgroundColor:
                                                                            variant?.colorCode ||
                                                                            "#e2e8f0",
                                                                    }}
                                                                />

                                                                <div>
                                                                    <p className="text-[11px] text-slate-400">
                                                                        Color
                                                                    </p>

                                                                    <p className="text-sm font-medium text-slate-700">
                                                                        {variant?.color ||
                                                                            "N/A"}
                                                                    </p>
                                                                </div>

                                                            </div>

                                                            {/* Size */}
                                                            <div className="rounded-lg bg-slate-50 px-3 py-2">
                                                                <p className="text-[11px] text-slate-400">
                                                                    Size
                                                                </p>

                                                                <p className="text-sm font-medium text-slate-700">
                                                                    {item.size ||
                                                                        "N/A"}
                                                                </p>
                                                            </div>

                                                        </div>

                                                    </div>
                                                </div>

                                                {/* Pricing */}
                                                <div className="border-t border-slate-100 bg-slate-50 px-4 py-4">

                                                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">

                                                        <div>
                                                            <p className="text-xs text-slate-500">
                                                                Unit Price
                                                            </p>

                                                            <p className="font-medium text-slate-800">
                                                                {formatCurrency(
                                                                    item.price
                                                                )}
                                                            </p>
                                                        </div>

                                                        <div>
                                                            <p className="text-xs text-slate-500">
                                                                Offer Price
                                                            </p>

                                                            <p className="font-medium text-green-600">
                                                                {item.offerPrice !=
                                                                    null
                                                                    ? formatCurrency(
                                                                        item.offerPrice
                                                                    )
                                                                    : "—"}
                                                            </p>
                                                        </div>

                                                        <div>
                                                            <p className="text-xs text-slate-500">
                                                                Quantity
                                                            </p>

                                                            <p className="font-medium text-slate-800">
                                                                {
                                                                    item.quantity
                                                                }
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                            </div>
                                        );
                                    }
                                )}

                            </div>
                        )}

                    </div>
                )}
            </Modal>
        </div>
    );
};