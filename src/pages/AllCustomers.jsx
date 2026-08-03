import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Button, Card, SearchField, Badge, Pagination, ResponsiveView, SkeletonRow } from '../components/ui';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { fetchAllCustomers } from '../Components/Redux/MerchantSlice';

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

export const AllCustomers = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const {
        allCustomers: selectAllCustomers,
    } = useSelector((state) => state.merchant);

    const customers = selectAllCustomers.allCustomers;
    console.log("customers", customers);

    const pagination = selectAllCustomers.pagination || emptyPagination;
    const loading = selectAllCustomers.loading;

    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [includeGuests, setIncludeGuests] = useState(true);

    // Debounce the raw search input before it drives a request
    useEffect(() => {
        const handle = setTimeout(() => {
            setDebouncedSearch(search);
            setCurrentPage(1);
        }, SEARCH_DEBOUNCE_MS);
        return () => clearTimeout(handle);
    }, [search]);

    useEffect(() => {
        dispatch(fetchAllCustomers({
            page: currentPage,
            per_page: PER_PAGE,
            search: debouncedSearch,
            includeGuests: includeGuests,
        }))
    }, [dispatch, debouncedSearch, currentPage, includeGuests])

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
                    {row.cartItems} Items
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
                    <span className="text-slate-400">Never</span>
                ),
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Customers</h2>
                    <p className="text-sm text-slate-500">View all Customers</p>
                </div>
            </div>

            <Card className="p-4">
                <SearchField
                    value={search}
                    onChange={handleSearchChange}
                    placeholder="Search Customers..."
                    className="max-w-sm"
                />
            </Card>

            <Card className="p-0">
                {loading ? (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                                    {["Customer", "Merchant", "Orders", "Total Spent", "Cart Items", "Last Order"].map((h) => (
                                        <th key={h} className="px-5 py-3 font-semibold">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                <SkeletonRow columns={6} />
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <ResponsiveView columns={columns} data={customers} emptyText="No customers found" />
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