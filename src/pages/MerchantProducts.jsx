import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Button, Card, SearchField, Badge, Pagination, ResponsiveView, SkeletonRow, Modal, ActionDropdown } from '../components/ui';
import { ArrowLeft, Eye } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchProductList } from '../Components/Redux/MerchantSlice';

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

// Products don't have an order/payment status — they have an active/inactive
// flag. Swapped the old ORDER_STATUS tabs for that instead.
const PRODUCT_STATUS = [
    { label: "All", value: "" },
    { label: "Active", value: "active" },
    { label: "Inactive", value: "inactive" },
];

const formatCurrency = (amount) =>
    `₹${Number(amount ?? 0).toLocaleString("en-IN")}`;

const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });

export const MerchantProducts = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const params = useParams();

    // Was reading `state.merchant.orders` — this page shows products, so it
    // needs the products slice. Mirrors the { pagination, products, success }
    // shape your API returns (same pattern as merchants: data lives under a
    // named key, pagination/loading sit alongside it).
    const {
        products: selectProducts,
    } = useSelector((state) => state.merchant);

    const products = selectProducts.products;
    const pagination = selectProducts.pagination || emptyPagination;
    const loading = selectProducts.loading;

    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [status, setStatus] = useState("");

    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    const openViewModal = (product) => {
        setSelectedProduct(product);
        setViewModalOpen(true);
    };

    // Debounce the raw search input before it drives a request
    useEffect(() => {
        const handle = setTimeout(() => {
            setDebouncedSearch(search);
            setCurrentPage(1);
        }, SEARCH_DEBOUNCE_MS);
        return () => clearTimeout(handle);
    }, [search]);

    useEffect(() => {
        dispatch(fetchProductList({
            merchantId: params.id,
            page: currentPage,
            per_page: PER_PAGE,
            search: debouncedSearch,
            status: status,
        }))
    }, [dispatch, params.id, debouncedSearch, currentPage, status])

    const handleSearchChange = (value) => {
        setSearch(value);
    };

    const columns = [
        {
            key: "name",
            header: "Product",
            render: (row) => {
                const firstVariant = row.variants?.[0];
                const thumb =
                    firstVariant?.images?.[firstVariant?.thumbnailIndex] ||
                    firstVariant?.images?.[0];

                return (
                    <div className="flex items-center gap-3">
                        {thumb ? (
                            <img
                                src={thumb}
                                alt={row.name}
                                className="h-10 w-10 shrink-0 rounded-lg border border-slate-200 object-cover"
                            />
                        ) : (
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-sm font-semibold text-primary-700">
                                {row.name?.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <div className="max-w-xs">
                            <p className="line-clamp-1 font-semibold text-slate-800">{row.name}</p>
                            <p className="text-xs text-slate-500">{row.sku}</p>
                        </div>
                    </div>
                );
            },
        },
        {
            key: "category",
            header: "Category",
            render: (row) => (
                <div>
                    <p className="text-slate-700">{row.category?.name || "—"}</p>
                    <p className="text-xs text-slate-500">{row.subcategory?.name || ""}</p>
                </div>
            ),
        },
        {
            key: "variants",
            header: "Variants",
            render: (row) => (
                <div className="flex items-center gap-2">
                    <div className="flex -space-x-1">
                        {row.variants?.slice(0, 4).map((v, i) => (
                            <span
                                key={v._id || i}
                                title={v.color}
                                className="h-4 w-4 rounded-full border border-white shadow-sm"
                                style={{ backgroundColor: v.colorCode || "#e2e8f0" }}
                            />
                        ))}
                    </div>
                    <span className="text-xs text-slate-500">
                        {row.variantCount} variant{row.variantCount === 1 ? "" : "s"} · {row.sizeCount} size{row.sizeCount === 1 ? "" : "s"}
                    </span>
                </div>
            ),
        },
        {
            key: "price",
            header: "Price",
            render: (row) => (
                <div>
                    <p className="font-medium text-slate-800">
                        {row.minPrice === row.maxPrice
                            ? formatCurrency(row.minPrice)
                            : `${formatCurrency(row.minPrice)} - ${formatCurrency(row.maxPrice)}`}
                    </p>
                    {row.minOfferPrice ? (
                        <p className="text-xs text-green-600">Offer from {formatCurrency(row.minOfferPrice)}</p>
                    ) : null}
                </div>
            ),
        },
        {
            key: "totalStock",
            header: "Stock",
            render: (row) => (
                <Badge variant={row.totalStock > 0 ? "success" : "danger"}>
                    {row.totalStock > 0 ? `${row.totalStock} in stock` : "Out of stock"}
                </Badge>
            ),
        },
        {
            key: "isActive",
            header: "Status",
            render: (row) => (
                <Badge variant={row.isActive ? "success" : "neutral"}>
                    {row.isActive ? "Active" : "Inactive"}
                </Badge>
            ),
        },
        {
            key: "createdAt",
            header: "Added",
            render: (row) => formatDate(row.createdAt),
        },
        {
            key: "actions",
            header: "Actions",
            render: (row) => (
                <ActionDropdown
                    actions={[
                        {
                            label: "View Variants",
                            icon: Eye,
                            onClick: () => openViewModal(row),
                        },
                    ]}
                />
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">
                        {products?.[0]?.merchant?.MerchantName || "Merchant"} Products
                    </h2>
                    <p className="text-sm text-slate-500">View all {pagination?.total_records || 0} products of merchant</p>
                </div>
                <Button onClick={() => navigate(-1)} className="bg-white text-slate-900 shadow-sm hover:bg-slate-100">
                    <ArrowLeft className="h-4 w-4" /> Back
                </Button>
            </div>

            <Card className="p-4">
                <SearchField
                    value={search}
                    onChange={handleSearchChange}
                    placeholder="Search products..."
                    className="max-w-sm"
                />
            </Card>

            <Card className="p-4">
                <div className="flex flex-wrap gap-2">
                    {PRODUCT_STATUS.map((tab) => (
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
                        <table className="w-full min-w-[820px] border-collapse text-left text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                                    {["Product", "Category", "Variants", "Price", "Stock", "Status", "Added", "Actions"].map((h) => (
                                        <th key={h} className="px-5 py-3 font-semibold">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                <SkeletonRow columns={8} />
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <ResponsiveView columns={columns} data={products} emptyText="No products found" />
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

            {/* View variants modal */}
            <Modal
                isOpen={viewModalOpen}
                onClose={() => setViewModalOpen(false)}
                title={selectedProduct?.name || "Product Variants"}
                size="xl"
            >
                {selectedProduct && (
                    <div className="space-y-6">
                        {selectedProduct.sku && (
                            <p className="text-xs text-slate-500">SKU: {selectedProduct.sku}</p>
                        )}

                        {selectedProduct.variants?.map((variant) => (
                            <div
                                key={variant._id}
                                className="space-y-4 rounded-xl border border-slate-100 p-4"
                            >
                                <div className="flex items-center gap-2">
                                    <span
                                        className="h-5 w-5 rounded-full border border-slate-200 shadow-sm"
                                        style={{ backgroundColor: variant.colorCode || "#e2e8f0" }}
                                    />
                                    <p className="font-semibold text-slate-800">{variant.color}</p>
                                    {variant.isTrending && <Badge variant="info">Trending</Badge>}
                                </div>

                                {variant.images?.length > 0 && (
                                    <div className="flex gap-2 overflow-x-auto pb-1">
                                        {variant.images.map((img, i) => (
                                            <img
                                                key={i}
                                                src={img}
                                                alt={`${variant.color} ${i + 1}`}
                                                className={`h-20 w-20 shrink-0 rounded-lg border object-cover ${
                                                    i === variant.thumbnailIndex
                                                        ? "border-primary-500 ring-2 ring-primary-200"
                                                        : "border-slate-200"
                                                }`}
                                            />
                                        ))}
                                    </div>
                                )}

                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[420px] border-collapse text-left text-sm">
                                        <thead>
                                            <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                                                <th className="py-2 pr-4 font-semibold">Size</th>
                                                <th className="py-2 pr-4 font-semibold">Stock</th>
                                                <th className="py-2 pr-4 font-semibold">Price</th>
                                                <th className="py-2 pr-4 font-semibold">Offer Price</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {variant.sizes?.map((s) => (
                                                <tr key={s._id} className="border-b border-slate-50 last:border-0">
                                                    <td className="py-2 pr-4 font-medium text-slate-700">{s.size}</td>
                                                    <td className="py-2 pr-4">
                                                        <Badge variant={s.stock > 0 ? "success" : "danger"}>
                                                            {s.stock > 0 ? s.stock : "Out of stock"}
                                                        </Badge>
                                                    </td>
                                                    <td className="py-2 pr-4 text-slate-700">{formatCurrency(s.price)}</td>
                                                    <td className="py-2 pr-4 text-green-600">
                                                        {s.offerPrice ? formatCurrency(s.offerPrice) : "—"}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Modal>
        </div>
    )
}