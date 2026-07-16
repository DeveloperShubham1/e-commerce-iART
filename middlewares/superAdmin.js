import jwt from "jsonwebtoken";
import SuperAdmin from "../models/SuperAdmin.js";

const authSuperAdmin = async (req, res, next) => {
    try {
        // Get token from cookies
        const { superAdminToken } = req.cookies;

        if (!superAdminToken) {
            return res.status(401).json({
                success: false,
                message: "Not authorized, token missing.",
            });
        }

        // Verify JWT
        const decoded = jwt.verify(
            superAdminToken,
            process.env.JWT_SECRET
        );

        // Ensure it's a Super Admin token
        if (decoded.role !== "super_admin") {
            return res.status(403).json({
                success: false,
                message: "Access denied.",
            });
        }

        // Fetch Super Admin
        const superAdmin = await SuperAdmin.findById(decoded.id).select(
            "-password"
        );

        if (!superAdmin) {
            return res.status(401).json({
                success: false,
                message: "Super Admin not found.",
            });
        }

        if (!superAdmin.isActive) {
            return res.status(403).json({
                success: false,
                message: "Your account has been deactivated.",
            });
        }

        req.superAdmin = superAdmin;

        next();
    } catch (error) {
        console.error("Super Admin Auth Error:", error.message);

        return res.status(401).json({
            success: false,
            message: "Invalid or expired token.",
        });
    }
};

export default authSuperAdmin;