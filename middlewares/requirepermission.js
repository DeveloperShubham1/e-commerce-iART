import jwt from "jsonwebtoken";
import Merchants from "../models/Merchants.js"; // ensure the path and model name match
import Manager from "../modules/manager/Manager.js";

// Must match the role name that gets unrestricted access — same as Role.js / ManagerLayout.
const FULL_ACCESS_ROLE = "super_admin";

const requirePermission = (permission) => {
  return async (req, res, next) => {
    try {
      const { merchantToken, managerToken } = req.cookies;

      // ---- Merchant path: full access, no permission check ----
      if (merchantToken) {
        const decoded = jwt.verify(merchantToken, process.env.JWT_SECRET);
        const merchant = await Merchants.findById(decoded.merchantId).select(
          "-password -instagram -razorpaySecret -razorpayKey"
        );

        if (!merchant) {
          return res.status(401).json({
            success: false,
            message: "Merchant not found or unauthorized"
          });
        }

        req.merchant = merchant;
        return next();
      }

      // ---- Manager path: needs the specific permission (or full-access role) ----
      if (managerToken) {
        const decoded = jwt.verify(managerToken, process.env.JWT_SECRET);
        const manager = await Manager.findById(decoded.managerId).populate(
          "role",
          "name label permissions"
        );

        if (!manager) {
          return res.status(401).json({
            success: false,
            message: "Manager not found or unauthorized"
          });
        }

        if (manager.status !== "active") {
          return res.status(403).json({
            success: false,
            message: `This account is ${manager.status}.`
          });
        }

        const effectivePermissions = await manager.getEffectivePermissions();
        const hasAccess =
          !permission ||
          manager.role?.name === FULL_ACCESS_ROLE ||
          effectivePermissions.includes(permission);

        if (!hasAccess) {
          return res.status(403).json({
            success: false,
            message: `You don't have permission to perform this action.`
          });
        }

        req.manager = manager;
        // Stand-in so existing controllers using req.merchant._id keep working unchanged
        req.merchant = { _id: manager.merchantId };
        return next();
      }

      return res.status(401).json({
        success: false,
        message: "Not authorized, token missing"
      });
    } catch (error) {
      console.error("Auth error:", error.message);
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token"
      });
    }
  };
};

export default requirePermission;