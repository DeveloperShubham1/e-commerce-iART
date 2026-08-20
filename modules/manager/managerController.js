import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Manager from "./Manager.js";
import Role from "./Role.js";

// POST /api/managers
// Create a new manager and assign a role, e.g. { name, email, password, roleId }
// Requires auth middleware to have set req.merchant (the logged-in merchant creating this manager)
export const createManager = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      roleId,
      extraPermissions = [],
      deniedPermissions = [],
    } = req.body;
    const merchantId = req.merchant?._id;

    if (!merchantId) {
      return res
        .status(401)
        .json({ success: false, message: "Merchant authentication required" });
    }

    if (!name || !email || !password || !roleId) {
      return res.status(400).json({
        success: false,
        message: "name, email, password and roleId are required",
      });
    }

    const role = await Role.findById(roleId);
    if (!role) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid roleId" });
    }

    // Email only needs to be unique within this merchant's managers, not globally
    const existing = await Manager.findOne({
      merchantId,
      email: email.toLowerCase().trim(),
    });
    if (existing) {
      return res
        .status(409)
        .json({
          success: false,
          message: "Manager with this email already exists",
        });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const manager = await Manager.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone,
      merchantId,
      passwordHash,
      role: role._id,
      extraPermissions,
      deniedPermissions,
      status: "active",
      createdBy: req.manager?._id, // set by auth middleware if a logged-in manager (not merchant) is creating this
    });

    const populated = await manager.populate("role", "name label");

    return res.status(201).json({ success: true, data: populated });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/managers/:id
// Update manager details, role assignment, permission overrides, or status
// Scoped to the logged-in merchant — a merchant can only update their own managers
export const updateManager = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      phone,
      roleId,
      extraPermissions,
      deniedPermissions,
      status,
      password,
    } = req.body;
    const merchantId = req.merchant?._id;

    if (!merchantId) {
      return res
        .status(401)
        .json({ success: false, message: "Merchant authentication required" });
    }

    const manager = await Manager.findOne({ _id: id, merchantId });
    if (!manager) {
      return res
        .status(404)
        .json({ success: false, message: "Manager not found" });
    }

    if (roleId) {
      const role = await Role.findById(roleId);
      if (!role) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid roleId" });
      }
      manager.role = role._id;
    }

    if (name !== undefined) manager.name = name.trim();
    if (phone !== undefined) manager.phone = phone;
    if (extraPermissions !== undefined)
      manager.extraPermissions = extraPermissions;
    if (deniedPermissions !== undefined)
      manager.deniedPermissions = deniedPermissions;
    if (status !== undefined) manager.status = status;

    if (password) {
      manager.passwordHash = await bcrypt.hash(password, 10);
    }

    await manager.save();
    const populated = await manager.populate("role", "name label");

    return res.status(200).json({ success: true, data: populated });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/managers  (helper, useful for listing/admin table view)
// Scoped to the logged-in merchant — only shows managers belonging to them
export const listManagers = async (req, res) => {
  try {
    const merchantId = req.merchant?._id;
    if (!merchantId) {
      return res
        .status(401)
        .json({ success: false, message: "Merchant authentication required" });
    }

    const managers = await Manager.find({ merchantId })
      .populate("role", "name label")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, data: managers });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const managerLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // passwordHash has select:false on the schema, so it must be explicitly requested here
    const manager = await Manager.findOne({ email: normalizedEmail })
      .select("+passwordHash")
      .populate("role", "name label permissions");

    if (!manager) {
      return res.status(404).json({
        success: false,
        message: "Manager not found. Please check your email.",
      });
    }

    if (manager.status !== "active") {
      return res.status(403).json({
        success: false,
        message: `This account is ${manager.status}. Contact your merchant admin.`,
      });
    }

    const isMatch = await bcrypt.compare(password, manager.passwordHash);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid password." });
    }

    const token = jwt.sign(
      {
        managerId: manager._id,
        merchantId: manager.merchantId,
        email: manager.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "5d" },
    );

    res.cookie("managerToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 5 * 24 * 60 * 60 * 1000,
    });

    manager.lastLoginAt = new Date();
    await manager.save();

    const permissions = await manager.getEffectivePermissions();

    return res.json({
      success: true,
      message: "Manager logged in successfully",
      manager: {
        _id: manager._id,
        name: manager.name,
        email: manager.email,
        phone: manager.phone,
        merchantId: manager.merchantId,
        role: manager.role
          ? {
              _id: manager.role._id,
              name: manager.role.name,
              label: manager.role.label,
            }
          : null,
        status: manager.status,
      },
      permissions,
    });
  } catch (error) {
    console.error("Manager login error:", error.message);
    res
      .status(500)
      .json({ success: false, message: "Server error during login" });
  }
};

// GET /api/managers/is-auth
// Relies on the managerAuth middleware having verified the cookie and set req.manager / req.permissions
export const isManagerAuth = async (req, res) => {
  try {
    return res.json({
      success: true,
      manager: req.manager,
      permissions: req.permissions,
    });
  } catch (error) {
    console.error("Manager auth check error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/managers/logout
export const managerLogout = async (req, res) => {
  try {
    res.clearCookie("managerToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    });
    return res.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.error("Manager logout error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};
