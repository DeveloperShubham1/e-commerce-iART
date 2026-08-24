import { useAppContext } from "../../context/AppContext";

// Must match the role name that gets unrestricted access — same as ManagerLayout.
const FULL_ACCESS_ROLE = "super_admin";

export default function RequirePermission({ permission, children }) {
  const { managerData, managerPermissions = [] } = useAppContext();

  const hasPermission =
    !permission ||
    managerData?.role?.name === FULL_ACCESS_ROLE ||
    managerPermissions.includes(permission);

  if (!hasPermission) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 py-24 text-center">
        <p className="text-lg font-semibold text-gray-800">Access denied</p>
        <p className="text-sm text-gray-500">
          You don't have permission to view this page. Contact your store owner if you think this is a mistake.
        </p>
      </div>
    );
  }

  return children;
}