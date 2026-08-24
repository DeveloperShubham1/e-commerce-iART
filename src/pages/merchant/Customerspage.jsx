import { useState, useEffect } from "react";
import { Search, ShoppingCart } from "lucide-react";
import ResponsiveView from "../../components/ResponsiveView";
import ActionDropdown from "../../components/ActionDropdown";
import Modal from "../../components/Model";
import Badge from "../../components/Badge";
import { useFetchCustomersByMerchant } from "../../services/merchant";
import Pagination from "@/components/Pagination";

const PER_PAGE = 10;

const formatCurrency = (amount) =>
  `₹${Number(amount || 0).toLocaleString("en-IN")}`;

const formatDate = (dateString) => {
  if (!dateString) return null;
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const CustomersPage = () => {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [includeGuests, setIncludeGuests] = useState(true);
  const [cartModalOpen, setCartModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const openCartModal = (row) => {
    setSelectedCustomer(row);
    setCartModalOpen(true);
  };

  const closeCartModal = () => {
    setCartModalOpen(false);
    setSelectedCustomer(null);
  };

  // Debounce the search box so we don't fire a request on every keystroke
  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const { data, isLoading, isFetching } = useFetchCustomersByMerchant({
    page,
    per_page: PER_PAGE,
    search,
    includeGuests,
  });

  const customers = data?.customers || [];
  const pagination = data?.pagination;

  const columns = [
    {
      key: "customer",
      header: "Customer",
      render: (row) => (
        <div>
          <p className="font-semibold text-slate-800">{row.phone || "N/A"}</p>
          <p className="text-sm text-slate-500">{row.name || "N/A"}</p>
          <p className="text-sm text-slate-400">{row.email || "N/A"}</p>
        </div>
      ),
    },
    {
      key: "merchant",
      header: "Merchant",
      render: (row) => (
        <div>
          <p className="font-semibold text-slate-800">{row.merchant?.MerchantName || "N/A"}</p>
          <p className="text-sm text-slate-400">{row.merchant?.email || "N/A"}</p>
        </div>
      ),
    },
    {
      key: "totalOrders",
      header: "Orders",
      render: (row) => <span className="text-slate-700">{row.totalOrders}</span>,
    },
    {
      key: "totalSpent",
      header: "Total Spent",
      render: (row) => (
        <span className="font-semibold text-emerald-600">{formatCurrency(row.totalSpent)}</span>
      ),
    },
    {
      key: "cartItems",
      header: "Cart",
      render: (row) => (
        <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
          {row.cartItems} Item{row.cartItems === 1 ? "" : "s"}
        </span>
      ),
    },
    {
      key: "lastOrder",
      header: "Last Order",
      render: (row) =>
        row.lastOrder ? (
          <span className="text-slate-700">{formatDate(row.lastOrder)}</span>
        ) : (
          <span className="text-slate-400">Never</span>
        ),
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      headerClassName: "text-right",
      render: (row) => (
        <div className="flex justify-end">
          <ActionDropdown
            actions={[
              {
                label: "View Cart Items",
                icon: ShoppingCart,
                onClick: () => openCartModal(row),
              },
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col min-h-0 max-h-full h-full">
      {/* Header */}
      <div className="mb-6 flex-shrink-0">
        <h1 className="text-2xl font-bold text-slate-800">Customers</h1>
        <button className="text-sm font-medium text-primary hover:underline">
          View all Customers
        </button>
      </div>

      {/* Filters bar */}
      <div className="mb-4 flex flex-col gap-3 rounded-xl border border-slate-100 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search Customers..."
            className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={includeGuests}
            onChange={(e) => {
              setIncludeGuests(e.target.checked);
              setPage(1);
            }}
            className="h-4 w-4 rounded border-slate-300 accent-primary"
          />
          Include Guest Customers
        </label> */}
      </div>

      {/* Table / cards */}
      <div className="flex-1 flex flex-col overflow-hidden rounded-xl border border-slate-100 bg-white">
        <ResponsiveView
          columns={columns}
          data={customers}
          loading={isLoading}
          emptyText="No customers found"
          titleKey="customer"
          actionsKey="actions"
        />
      </div>

      {/* Pagination */}
      <div className="flex-shrink-0 mt-2">
        <Pagination
        pagination={{
          page: pagination?.current_page || 1,
          totalPages: pagination?.total_pages || 1,
          total: pagination?.total_records || 0,
          limit: pagination?.per_page || 10,
          hasNextPage: pagination?.has_next_page || false,
          hasPrevPage: pagination?.has_prev_page || false,
        }}
        onPageChange={(newPage) => setPage(newPage)}
      />
      </div>

      {/* View Cart Items modal */}
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

            {/* ================= CUSTOMER / MERCHANT INFORMATION ================= */}
            <div className="rounded-xl bg-slate-50 p-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

                {/* Customer */}
                <div>
                  <p className="text-xs text-slate-500">
                    Customer
                  </p>

                  <p className="font-medium text-slate-800">
                    {selectedCustomer.name || "Guest"}
                  </p>
                </div>

                {/* Phone */}
                <div>
                  <p className="text-xs text-slate-500">
                    Phone
                  </p>

                  <p className="font-medium text-slate-800">
                    {selectedCustomer.phone || "N/A"}
                  </p>
                </div>

                {/* Merchant */}
                <div>
                  <p className="text-xs text-slate-500">
                    Email
                  </p>

                  <p className="max-w-[200px] truncate font-medium text-slate-800">
                    {selectedCustomer.email || "N/A"}
                  </p>
                </div>

                {/* Cart Items */}
                <div>
                  <p className="text-xs text-slate-500">
                    Cart Items
                  </p>

                  <p className="font-semibold text-slate-800">
                    {selectedCustomer.cartItems || 0}
                  </p>
                </div>

              </div>


            </div>

            {/* ================= EMPTY CART ================= */}
            {!selectedCustomer.cart?.length ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">

                <ShoppingCart className="mb-3 h-10 w-10 text-slate-300" />

                <p className="font-medium text-slate-600">
                  Cart is empty
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  This customer has no items in their cart.
                </p>

              </div>
            ) : (
              <div className="space-y-4">

                {/* ================= CART ITEMS ================= */}
                {selectedCustomer.cart.map((item, index) => {

                  const product = item.productId;

                  // Find the exact variant using variantId
                  const variant = product?.variants?.find(
                    (v) => String(v._id) === String(item.variantId)
                  );

                  // Find selected size inside variant
                  const sizeData = variant?.sizes?.find(
                    (size) => String(size.size) === String(item.size)
                  );

                  // Thumbnail
                  const thumbnail =
                    variant?.images?.[variant?.thumbnailIndex] ||
                    variant?.images?.[0];

                  // Calculate effective price
                  const unitPrice = Number(item.price || 0);
                  const offerPrice = Number(item.offerPrice || 0);

                  return (
                    <div
                      key={item._id || index}
                      className="overflow-hidden rounded-xl border border-slate-200 bg-white"
                    >

                      {/* ================= PRODUCT HEADER ================= */}
                      <div className="flex flex-col gap-4 p-4 sm:flex-row">

                        {/* Product Image */}
                        <div className="shrink-0">

                          {thumbnail ? (
                            <img
                              src={thumbnail}
                              alt={product?.name || "Product"}
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

                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">

                            {/* Product Info */}
                            <div className="min-w-0">

                              <p className="text-xs font-medium text-slate-400">
                                Product #{index + 1}
                              </p>

                              <h3
                                className="mt-1 line-clamp-2 font-semibold text-slate-800"
                                title={
                                  product?.name ||
                                  "Product unavailable"
                                }
                              >
                                {product?.name ||
                                  "Product unavailable"}
                              </h3>

                              {/* Brand */}
                              {product?.brand && (
                                <p className="mt-1 text-sm text-slate-500">
                                  Brand: {product.brand}
                                </p>
                              )}

                              {/* SKU */}
                              {product?.sku && (
                                <p className="mt-1 break-all text-xs text-slate-500">
                                  SKU: {product.sku}
                                </p>
                              )}

                            </div>

                            {/* Quantity */}
                            <div className="shrink-0">

                              <p className="text-xs text-slate-500">
                                Quantity
                              </p>

                              <Badge variant="info">
                                {item.quantity || 0}
                              </Badge>
                            </div>

                          </div>

                          {/* ================= VARIANT DETAILS ================= */}
                          <div className="mt-4 flex flex-wrap gap-3">

                            {/* Color */}
                            <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">

                              <span
                                className="h-5 w-5 shrink-0 rounded-full border border-slate-300"
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
                                  {variant?.color || "N/A"}
                                </p>
                              </div>

                            </div>

                            {/* Size */}
                            <div className="rounded-lg bg-slate-50 px-3 py-2">

                              <p className="text-[11px] text-slate-400">
                                Size
                              </p>

                              <p className="text-sm font-medium text-slate-700">
                                {item.size || "N/A"}
                              </p>

                            </div>

                            {/* Stock */}
                            <div className="rounded-lg bg-slate-50 px-3 py-2">

                              <p className="text-[11px] text-slate-400">
                                Stock
                              </p>

                              <p
                                className={`text-sm font-medium ${Number(sizeData?.stock || 0) > 0
                                  ? "text-green-600"
                                  : "text-red-500"
                                  }`}
                              >
                                {sizeData?.stock ?? 0}
                              </p>

                            </div>

                            {/* Trending */}
                            {variant?.isTrending && (
                              <div className="rounded-lg bg-amber-50 px-3 py-2">

                                <p className="text-[11px] text-amber-500">
                                  Status
                                </p>

                                <p className="text-sm font-medium text-amber-600">
                                  Trending
                                </p>

                              </div>
                            )}

                          </div>

                        </div>
                      </div>

                      {/* ================= PRICING ================= */}
                      <div className="border-t border-slate-100 bg-slate-50 px-4 py-4">

                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">

                          {/* Unit Price */}
                          <div>
                            <p className="text-xs text-slate-500">
                              Unit Price
                            </p>

                            <p className="font-medium text-slate-800">
                              {formatCurrency(unitPrice)}
                            </p>
                          </div>

                          {/* Offer Price */}
                          <div>
                            <p className="text-xs text-slate-500">
                              Discount
                            </p>

                            <p className="font-medium text-green-600">
                              {offerPrice > 0
                                ? `${offerPrice}%`
                                : "—"}
                            </p>
                          </div>

                          {/* Quantity */}
                          <div>
                            <p className="text-xs text-slate-500">
                              Quantity
                            </p>

                            <p className="font-medium text-slate-800">
                              {item.quantity || 0}
                            </p>
                          </div>

                          {/* Cart Total */}
                          {/* <div>
                            <p className="text-xs text-slate-500">
                              Total
                            </p>

                            <p className="font-semibold text-slate-800">
                              {formatCurrency(
                                (offerPrice > 0
                                  ? offerPrice
                                  : unitPrice) *
                                Number(item.quantity || 0)
                              )}
                            </p>
                          </div> */}

                        </div>

                      </div>

                    </div>
                  );
                })}

                {/* ================= CART SUMMARY ================= */}
                {/* <div className="rounded-xl border border-slate-200 bg-white p-4">

                  <div className="flex items-center justify-between">

                    <div>
                      <p className="text-sm text-slate-500">
                        Total Cart Items
                      </p>

                      <p className="font-semibold text-slate-800">
                        {selectedCustomer.cartItems || 0}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-slate-500">
                        Cart Total
                      </p>

                      <p className="text-lg font-bold text-slate-900">
                        {formatCurrency(
                          selectedCustomer.cart.reduce(
                            (total, item) => {
                              const price =
                                Number(item.offerPrice) > 0
                                  ? Number(item.offerPrice)
                                  : Number(item.price || 0);

                              return (
                                total +
                                price *
                                Number(item.quantity || 0)
                              );
                            },
                            0
                          )
                        )}
                      </p>
                    </div>

                  </div>

                </div> */}

              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CustomersPage;