import { useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";
import { Plus, Mail, Phone, MapPin, Pencil } from "lucide-react";
import {
  Card,
  Button,
  Input,
  Table,
  Badge,
  FormModal,
  SkeletonRow,
  Pagination,
  SearchField,
} from "../components/ui";
import { validateForm } from "../utils/validateForm";
import {
  getMerchantListApi,
  createMerchantApi,
  updateMerchantApi,
} from "../api/merchant.api";

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
  const [merchants, setMerchants] = useState([]);
  const [pagination, setPagination] = useState(emptyPagination);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
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

  const fetchMerchants = useCallback(async (page, searchTerm) => {
    setLoading(true);
    try {
      const data = await getMerchantListApi({
        page,
        limit: PER_PAGE,
        search: searchTerm,
      });
      setMerchants(data.merchants || []);
      setPagination(data.pagination || emptyPagination);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMerchants(currentPage, debouncedSearch);
  }, [fetchMerchants, currentPage, debouncedSearch]);

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
      isSubscribed: merchant.isSubscribed || false,
      razorpayKey: merchant.razorpayKey || "",
      razorpaySecret: merchant.razorpaySecret || "",
      logo: merchant.logo || "",
      address: merchant.address || "",
    });
    setEditModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { errors: errs, isValid } = validateForm(form, merchantRules);
    setErrors(errs);
    if (!isValid) return;

    setSubmitting(true);
    try {
      const data = await createMerchantApi(form);
      toast.success(data.message || "Merchant created");
      setModalOpen(false);
      // new merchant should be visible — jump back to page 1 of the current search
      setCurrentPage(1);
      fetchMerchants(1, debouncedSearch);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingId) return;

    setEditSubmitting(true);
    try {
      const data = await updateMerchantApi(editingId, editForm);
      toast.success(data.message || "Merchant updated");
      setEditModalOpen(false);
      fetchMerchants(currentPage, debouncedSearch);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setEditSubmitting(false);
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
      key: "isSubscribed",
      header: "Subscription",
      render: (row) => (
        <Badge variant={row.isSubscribed ? "success" : "neutral"}>
          {row.planName || (row.isSubscribed ? "Active" : "Free")}
        </Badge>
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
    // {
    //   key: "actions",
    //   header: "Actions",
    //   render: (row) => (
    //     <button
    //       onClick={(e) => { e.stopPropagation(); openEditModal(row); }}
    //       className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-primary-50 hover:text-primary-600"
    //       title="Edit merchant"
    //     >
    //       <Pencil className="h-4 w-4" />
    //     </button>
    //   ),
    // },
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
          <Table columns={columns} data={merchants} emptyText="No merchants found" />
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
        title="Edit Merchant"
        onSubmit={handleEditSubmit}
        submitting={editSubmitting}
        submitLabel="Update Merchant"
        size="lg"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Razorpay Key" name="razorpayKey" value={editForm.razorpayKey} onChange={handleEditChange} placeholder="rzp_live_xxx" />
          <Input label="Razorpay Secret" name="razorpaySecret" value={editForm.razorpaySecret} onChange={handleEditChange} placeholder="secret_xxx" />
          <Input label="Logo URL" name="logo" value={editForm.logo} onChange={handleEditChange} placeholder="https://..." />
          <Input label="Address" name="address" value={editForm.address} onChange={handleEditChange} placeholder="123 Main St, City" />
          <label className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 sm:col-span-2">
            <input
              type="checkbox"
              name="isSubscribed"
              checked={editForm.isSubscribed}
              onChange={handleEditChange}
              className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm font-medium text-slate-700">Subscribed (active subscription)</span>
          </label>
        </div>
      </FormModal>
    </div>
  );
};

export default Merchants;