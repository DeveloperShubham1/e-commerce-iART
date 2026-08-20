import Role, { PERMISSIONS } from './Role.js';

// POST /api/roles
// Create a new role for the logged-in merchant, e.g. { name: "sales_manager", label: "Sales Manager", permissions: [...] }
// Requires merchant auth middleware to have set req.merchant
export const createRole = async (req, res) => {
  try {
    const { name, label, description, permissions = [] } = req.body;
    const merchantId = req.merchant?._id;

    if (!merchantId) {
      return res.status(401).json({ success: false, message: 'Merchant authentication required' });
    }

    if (!name || !label) {
      return res.status(400).json({ success: false, message: 'name and label are required' });
    }

    // Validate permissions against master list
    const invalidPerms = permissions.filter((p) => !PERMISSIONS.includes(p));
    if (invalidPerms.length) {
      return res.status(400).json({
        success: false,
        message: `Invalid permission keys: ${invalidPerms.join(', ')}`
      });
    }

    // Role name only needs to be unique within this merchant's own roles
    const existing = await Role.findOne({ merchantId, name: name.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Role with this name already exists' });
    }

    const role = await Role.create({
      merchantId,
      name: name.toLowerCase().trim(),
      label: label.trim(),
      description,
      permissions
    });

    return res.status(201).json({ success: true, data: role });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/roles/:id
// Update label, description, permissions, or active status of a role
// Scoped to the logged-in merchant — a merchant can only update their own roles
export const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { label, description, permissions, isActive } = req.body;
    const merchantId = req.merchant?._id;

    if (!merchantId) {
      return res.status(401).json({ success: false, message: 'Merchant authentication required' });
    }

    const role = await Role.findOne({ _id: id, merchantId });
    if (!role) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }

    if (permissions) {
      const invalidPerms = permissions.filter((p) => !PERMISSIONS.includes(p));
      if (invalidPerms.length) {
        return res.status(400).json({
          success: false,
          message: `Invalid permission keys: ${invalidPerms.join(', ')}`
        });
      }
      role.permissions = permissions;
    }

    if (label !== undefined) role.label = label.trim();
    if (description !== undefined) role.description = description;
    if (isActive !== undefined) role.isActive = isActive;

    await role.save();

    return res.status(200).json({ success: true, data: role });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/roles  (helper, useful for the UI dropdown when creating a manager)
// Scoped to the logged-in merchant — only returns roles they created
export const listRoles = async (req, res) => {
  try {
    const merchantId = req.merchant?._id;
    if (!merchantId) {
      return res.status(401).json({ success: false, message: 'Merchant authentication required' });
    }

    const roles = await Role.find({ merchantId }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: roles });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};