import { useEffect, useState } from "react";
import { PERMISSION_GROUPS } from "../utils/Permissions";

const emptyForm = {
  name: "",
  label: "",
  description: "",
  permissions: [],
  isActive: true,
};

const PRODUCT_DEPENDENCY_PERMISSIONS = [
  "product.view",
  "product.create",
];

const REQUIRED_PRODUCT_PERMISSIONS = [
  "category.view",
  "sub_category.view",
];

export default function RoleFormModal({
  open,
  mode,
  initialData,
  onClose,
  onSubmit,
  isSubmitting,
}) {
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (mode === "edit" && initialData) {
      setForm({
        name: initialData.name || "",
        label: initialData.label || "",
        description: initialData.description || "",
        permissions: initialData.permissions || [],
        isActive: initialData.isActive ?? true,
      });
    } else {
      setForm(emptyForm);
    }
  }, [mode, initialData, open]);

  if (!open) return null;

  const hasProductPermission = PRODUCT_DEPENDENCY_PERMISSIONS.some((key) =>
    form.permissions.includes(key)
  );

  const togglePermission = (key) => {
    // Required permissions cannot be manually changed
    // while product.view or product.create is selected.
    if (
      hasProductPermission &&
      REQUIRED_PRODUCT_PERMISSIONS.includes(key)
    ) {
      return;
    }

    setForm((prev) => {
      const isSelected = prev.permissions.includes(key);

      let permissions;

      if (isSelected) {
        permissions = prev.permissions.filter((p) => p !== key);
      } else {
        permissions = [...prev.permissions, key];
      }

      
      // If product.view OR product.create is selected,
      // automatically select category.view and sub_category.view.
      const productPermissionSelected =
        PRODUCT_DEPENDENCY_PERMISSIONS.some((permission) =>
          permissions.includes(permission)
        );

      if (productPermissionSelected) {
        permissions = [
          ...new Set([
            ...permissions,
            ...REQUIRED_PRODUCT_PERMISSIONS,
          ]),
        ];
      }

      return {
        ...prev,
        permissions,
      };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Safety check before submitting.
    // If product.view/create exists, required permissions
    // are always included.
    const finalPermissions = hasProductPermission
      ? [
        ...new Set([
          ...form.permissions,
          ...REQUIRED_PRODUCT_PERMISSIONS,
        ]),
      ]
      : form.permissions;

    onSubmit({
      ...form,
      permissions: finalPermissions,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-bold text-gray-900">
            {mode === "edit" ? "Edit role" : "Add role"}
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
          {/* Role information */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Role key
              </label>

              <input
                type="text"
                required
                disabled={mode === "edit"}
                placeholder="stock_manager"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    name: e.target.value,
                  }))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-100 disabled:text-gray-400"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Display name
              </label>

              <input
                type="text"
                required
                placeholder="Stock Manager"
                value={form.label}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    label: e.target.value,
                  }))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Description
            </label>

            <textarea
              rows={2}
              placeholder="What this role is responsible for"
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  description: e.target.value,
                }))
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Permissions */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                Permissions
              </label>

              <span className="text-xs text-gray-400">
                {form.permissions.length} selected
              </span>
            </div>

            <div className="max-h-64 space-y-4 overflow-y-auto rounded-lg border border-gray-200 p-4">
              {PERMISSION_GROUPS.map((group) => (
                <div key={group.label}>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                    {group.label}
                  </p>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {group.permissions.map((perm) => {
                      const isRequiredPermission =
                        REQUIRED_PRODUCT_PERMISSIONS.includes(perm.key);

                      const isDisabled =
                        hasProductPermission && isRequiredPermission;

                      const isChecked =
                        form.permissions.includes(perm.key) ||
                        (hasProductPermission && isRequiredPermission);

                      return (
                        <label
                          key={perm.key}
                          className={`flex items-center gap-2 text-sm ${isDisabled
                              ? "cursor-not-allowed text-gray-400"
                              : "cursor-pointer text-gray-700"
                            }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={isDisabled}
                            onChange={() => togglePermission(perm.key)}
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                          />

                          <span>{perm.label}</span>

                          {isDisabled && (
                            <span className="text-[10px] text-indigo-500">
                              Required
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active */}
          {mode === "edit" && (
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    isActive: e.target.checked,
                  }))
                }
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />

              Role is active
            </label>
          )}

          {/* Footer */}
          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {isSubmitting
                ? "Saving..."
                : mode === "edit"
                  ? "Save changes"
                  : "Create role"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}