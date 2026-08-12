import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { Plus, Mail, Phone, MapPin, Link, Trash, ShoppingCart, UserCheck, CircleFadingPlus, ShoppingBasket } from "lucide-react";
import {
  Card,
  Button,
  Input,
  ResponsiveView,
  Badge,
  FormModal,
  SkeletonRow,
  Pagination,
  SearchField,
  ActionDropdown,
} from "../components/ui";
import { validateForm } from "../utils/validateForm";
import {
  fetchMerchantList,
  createMerchant,
  updateMerchant,
  toggleMerchantSubscription,
} from "../Components/Redux/MerchantSlice";
import { useNavigate } from "react-router-dom";

const PER_PAGE = 10;
const SEARCH_DEBOUNCE_MS = 300;

const merchantRules = {
  MerchantName: [{ rule: "required", message: "Merchant name is required" }],
  OwnerName: [{ rule: "required", message: "Owner name is required" }],
  phone: [
    { rule: "required", message: "Phone is required" },
    { rule: "pattern", pattern: /^[0-9+\-\s]{8,15}$/, message: "Enter a valid phone" },
  ],
  email: [
    { rule: "required", message: "Email is required" },
    { rule: "email", message: "Enter a valid email" },
  ],
  password: [
    { rule: "required", message: "Password is required" },
    { rule: "minLength", min: 6, message: "Min 6 characters" },
  ],
};

const emptyForm = {
  MerchantName: "",
  OwnerName: "",
  phone: "",
  whatsappNumber: "",
  email: "",
  password: "",
  address: "",
};

const emptyEditForm = {
  isSubscribed: false,
  razorpayKey: "",
  razorpaySecret: "",
  logo: "",
  address: "",
};

const emptyPagination = {
  current_page: 1,
  per_page: PER_PAGE,
  total_records: 0,
  total_pages: 1,
  has_next_page: false,
  has_prev_page: false,
};

const Merchants = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    merchants: merchantState,
    createMerchantLoading: submitting,
    updateMerchantLoading: editSubmitting,
    toggleSubscriptionLoading,
  } = useSelector((state) => state.merchant);

  const merchants = merchantState.data;
  const pagination = merchantState.pagination || emptyPagination;
  const loading = merchantState.loading;

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [editingId, setEditingId] = useState(null);
  const [errors, setErrors] = useState({});

  // Debounce the raw search input before it drives a request
  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [search]);

  useEffect(() => {
    dispatch(
      fetchMerchantList({
        page: currentPage,
        limit: PER_PAGE,
        search: debouncedSearch,
      })
    );
  }, [dispatch, currentPage, debouncedSearch]);

  const handleSearchChange = (value) => {
    setSearch(value);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: undefined }));
  };

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === "checkbox" ? checked : value;
    setEditForm((f) => ({ ...f, [name]: val }));
  };

  const openModal = () => {
    setForm(emptyForm);
    setErrors({});
    setModalOpen(true);
  };

  const openEditModal = (merchant) => {
    setEditingId(merchant._id);
    setEditForm({
      siteBaseUrl: merchant.siteBaseUrl || "",
    });
    setEditModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { errors: errs, isValid } = validateForm(form, merchantRules);
    setErrors(errs);
    if (!isValid) return;

    try {
      await dispatch(createMerchant(form)).unwrap().then((data) => {
        if (data.success) {
          setModalOpen(false);
          setCurrentPage(1);

          dispatch(
            fetchMerchantList({
              page: 1,
              limit: PER_PAGE,
              search: debouncedSearch,
            })
          );
        }
      })
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingId) return;

    try {
      await dispatch(
        updateMerchant({
          id: editingId,
          payload: editForm,
        })
      ).unwrap().then((data) => {
        if (data.success) {
          setEditModalOpen(false)
          dispatch(
            fetchMerchantList({
              page: currentPage,
              limit: PER_PAGE,
              search: debouncedSearch,
            })
          );
        }
      })
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleSubscriptionToggle = async (merchant) => {
    try {
      await dispatch(toggleMerchantSubscription(merchant._id)).unwrap();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const columns = [
    {
      key: "MerchantName",
      header: "Merchant",
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-100 text-sm font-semibold text-primary-700">
            {row.MerchantName?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-slate-800">{row.MerchantName}</p>
            <p className="text-xs text-slate-500">{row.OwnerName}</p>
          </div>
        </div>
      ),
    },
    {
      key: "email",
      header: "Contact",
      render: (row) => (
        <div>
          <p className="flex items-center gap-1.5 text-slate-700"><Mail className="h-3.5 w-3.5 text-slate-400" />{row.email}</p>
          <p className="flex items-center gap-1.5 text-xs text-slate-500"><Phone className="h-3 w-3" />{row.phone}</p>
        </div>
      ),
    },
    {
      key: "address",
      header: "Address",
      render: (row) =>
        row.address ? (
          <span className="flex items-center gap-1.5 text-slate-600"><MapPin className="h-3.5 w-3.5 text-slate-400" />{row.address}</span>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
    {
      key: "productCount",
      header: "Product Count",
      render: (row) =>
        row.productCount ? (
          <span className="flex items-center gap-1.5 text-slate-600">{row.productCount}</span>
        ) : (
          <span className="text-slate-400">0</span>
        ),
    },
    {
      key: "isSubscribed",
      header: "Subscription",
      render: (row) => (
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={row.isSubscribed}
            disabled={toggleSubscriptionLoading}
            onChange={() => handleSubscriptionToggle(row)}
          />

          <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-green-600 transition-all after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:h-5 after:w-5 after:bg-white after:rounded-full after:transition-all peer-checked:after:translate-x-5" />
        </label>
      ),
    },
    {
      key: "instagramConnected",
      header: "Instagram",
      render: (row) => (
        <Badge variant={row.instagramConnected ? "info" : "neutral"}>
          {row.instagramConnected ? "Connected" : "Not connected"}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      header: "Joined",
      render: (row) => new Date(row.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <ActionDropdown
          actions={[
            {
              label: "Orders",
              icon: ShoppingCart,
              onClick: () => {
                navigate(`/orders/${row._id}`);
              },
            },
            {
              label: "Customer",
              icon: UserCheck,
              onClick: () => {
                navigate(`/customers/${row._id}`);
              },
            },
            {
              label: "Products",
              icon: ShoppingBasket,
              onClick: () => {
                navigate(`/products/${row._id}`);
              },
            },
            {
              label: "Site URL",
              icon: Link,
              onClick: () => openEditModal(row),
            },
            // {
            //   divider: true,
            // },
            // {
            //   label: "Delete",
            //   icon: Trash,
            //   className: "text-red-600 hover:bg-red-50",
            //   onClick: () => handleDelete(row),
            // },
          ]}
        />
      ),
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Merchants</h2>
          <p className="text-sm text-slate-500">Manage all registered merchants</p>
        </div>
        <Button onClick={openModal}>
          <Plus className="h-4 w-4" /> Add Merchant
        </Button>
      </div>

      <Card className="p-4">
        <SearchField
          value={search}
          onChange={handleSearchChange}
          placeholder="Search merchants..."
          className="max-w-sm"
        />
      </Card>

      <Card className="p-0">
        {loading ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  {["Merchant", "Contact", "Address", "Subscription", "Instagram", "Joined", "Actions"].map((h) => (
                    <th key={h} className="px-5 py-3 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <SkeletonRow columns={7} />
              </tbody>
            </table>
          </div>
        ) : (
          <ResponsiveView columns={columns} data={merchants} emptyText="No merchants found" />
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

      {/* Create modal */}
      <FormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add New Merchant"
        onSubmit={handleSubmit}
        submitting={submitting}
        submitLabel="Create Merchant"
        size="lg"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Merchant Name" name="MerchantName" value={form.MerchantName} onChange={handleChange} error={errors.MerchantName} placeholder="Acme Store" />
          <Input label="Owner Name" name="OwnerName" value={form.OwnerName} onChange={handleChange} error={errors.OwnerName} placeholder="John Doe" />
          <Input label="Email" name="email" type="email" value={form.email} onChange={handleChange} error={errors.email} placeholder="owner@store.com" />
          <Input label="Phone" name="phone" value={form.phone} onChange={handleChange} error={errors.phone} placeholder="+1 234 567 890" />
          <Input label="WhatsApp Number" name="whatsappNumber" value={form.whatsappNumber} onChange={handleChange} placeholder="+1 234 567 890" />
          <Input label="Password" name="password" type="password" value={form.password} onChange={handleChange} error={errors.password} placeholder="Min 6 characters" />
          <Input label="Address" name="address" value={form.address} onChange={handleChange} placeholder="123 Main St, City" className="sm:col-span-2" />
        </div>
      </FormModal>

      {/* Edit modal */}
      <FormModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Merchant Site URL"
        onSubmit={handleEditSubmit}
        submitting={editSubmitting}
        submitLabel="Update Site URL"
        size="lg"
      >
        <div className="grid grid-cols-1 gap-4">
          <Input label="Site Base URL" name="siteBaseUrl" value={editForm.siteBaseUrl} onChange={handleEditChange} placeholder="https://example.com" />
        </div>
      </FormModal>
    </div>
  );
};

export default Merchants;