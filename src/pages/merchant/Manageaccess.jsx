import { useState } from "react";
import { useRoles, useCreateRole, useUpdateRole } from "../../services/role";
import { useManagers, useCreateManager, useUpdateManager } from "../../services/manager";
import Badge from "../../components/Badge";
import ResponsiveView from "../../components/ResponsiveView";
import RoleFormModal from "../../components/Roleformmodal";
import ManagerFormModal from "../../components/Managerformmodal";

// manager.status / role active-state -> Badge variant
const STATUS_VARIANTS = {
  active: "success",
  suspended: "error",
  inactive: "neutral",
  pending: "warning",
};

const statusVariant = (status) => STATUS_VARIANTS[status] || "neutral";

export default function ManageAccess() {
  const [activeTab, setActiveTab] = useState("managers"); // "managers" | "roles"

  const { data: roles, isLoading: rolesLoading } = useRoles();
  const { data: managers, isLoading: managersLoading } = useManagers();

  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const createManager = useCreateManager();
  const updateManager = useUpdateManager();

  const [roleModal, setRoleModal] = useState({ open: false, mode: "create", data: null });
  const [managerModal, setManagerModal] = useState({ open: false, mode: "create", data: null });

  const handleRoleSubmit = (form) => {
    const action =
      roleModal.mode === "edit"
        ? updateRole.mutateAsync({ id: roleModal.data._id, payload: form })
        : createRole.mutateAsync(form);

    action.then(() => setRoleModal({ open: false, mode: "create", data: null }));
  };

  const handleManagerSubmit = (form) => {
    if (managerModal.mode === "edit") {
      const { email, password, ...editable } = form; // email locked, password not changed here
      updateManager
        .mutateAsync({ id: managerModal.data._id, payload: editable })
        .then(() => setManagerModal({ open: false, mode: "create", data: null }));
    } else {
      createManager.mutateAsync(form).then(() => setManagerModal({ open: false, mode: "create", data: null }));
    }
  };

  const managerColumns = [
    {
      key: "name",
      header: "Name",
      render: (row) => (
        <div>
          <p className="font-semibold text-gray-900">{row.name}</p>
          <p className="text-xs text-gray-500">{row.email}</p>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      render: (row) => row.role?.label || "—",
    },
    {
      key: "phone",
      header: "Phone",
      render: (row) => row.phone || "—",
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <Badge variant={statusVariant(row.status)}>{row.status}</Badge>,
    },
    {
      key: "lastLoginAt",
      header: "Last Login",
      render: (row) => (row.lastLoginAt ? new Date(row.lastLoginAt).toLocaleDateString() : "Never"),
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-right",
      className: "text-right",
      render: (row) => (
        <button
          onClick={() => setManagerModal({ open: true, mode: "edit", data: row })}
          className="text-sm font-semibold text-indigo-600 hover:text-indigo-800"
        >
          Edit
        </button>
      ),
    },
  ];

  const roleColumns = [
    {
      key: "role",
      header: "Role",
      render: (row) => (
        <div>
          <p className="font-semibold text-gray-900">{row.label}</p>
          <p className="text-xs text-gray-500">{row.name}</p>
        </div>
      ),
    },
    {
      key: "description",
      header: "Description",
      render: (row) => row.description || "—",
    },
    {
      key: "permissions",
      header: "Permissions",
      render: (row) => `${row.permissions?.length || 0} granted`,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <Badge variant={statusVariant(row.isActive ? "active" : "suspended")}>
          {row.isActive ? "active" : "suspended"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-right",
      className: "text-right",
      render: (row) => (
        <button
          onClick={() => setRoleModal({ open: true, mode: "edit", data: row })}
          className="text-sm font-semibold text-indigo-600 hover:text-indigo-800"
        >
          Edit
        </button>
      ),
    },
  ];

  return (
    <div className="px-8 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-extrabold text-gray-900">Roles & Managers</h1>
        {activeTab === "managers" ? (
          <button
            onClick={() => setManagerModal({ open: true, mode: "create", data: null })}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            + Add Manager
          </button>
        ) : (
          <button
            onClick={() => setRoleModal({ open: true, mode: "create", data: null })}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            + Add Role
          </button>
        )}
      </div>

      {/* Tabs, styled like the "Filter By Status" pill row */}
      <div className="mb-6 flex gap-3">
        {[
          { key: "managers", label: "Managers" },
          { key: "roles", label: "Roles" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${activeTab === tab.key
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200">
        {activeTab === "managers" ? (
          <ResponsiveView
            columns={managerColumns}
            data={managers}
            loading={managersLoading}
            emptyText="No managers yet. Add your first one to get started."
            titleKey="name"
            actionsKey="actions"
          />
        ) : (
          <ResponsiveView
            columns={roleColumns}
            data={roles}
            loading={rolesLoading}
            emptyText="No roles yet. Create one to start adding managers."
            titleKey="role"
            actionsKey="actions"
          />
        )}
      </div>

      <RoleFormModal
        open={roleModal.open}
        mode={roleModal.mode}
        initialData={roleModal.data}
        onClose={() => setRoleModal({ open: false, mode: "create", data: null })}
        onSubmit={handleRoleSubmit}
        isSubmitting={createRole.isPending || updateRole.isPending}
      />

      <ManagerFormModal
        open={managerModal.open}
        mode={managerModal.mode}
        initialData={managerModal.data}
        roles={roles}
        onClose={() => setManagerModal({ open: false, mode: "create", data: null })}
        onSubmit={handleManagerSubmit}
        isSubmitting={createManager.isPending || updateManager.isPending}
      />
    </div>
  );
}