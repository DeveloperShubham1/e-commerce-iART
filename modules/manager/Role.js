import mongoose from "mongoose";
const { Schema } = mongoose;

// Predefined role names for the e-commerce portal.
// You can still create custom roles beyond this list, but these are the
// standard ones the UI should show as quick-select options.
export const ROLE_NAMES = [
  "super_admin",
  "sales_manager",
  "stock_manager",
  "inventory_manager",
  "order_manager",
  "customer_support_manager",
  "marketing_manager",
  "finance_manager",
  "content_manager",
  "delivery_manager",
];

// Master list of permission keys available in the system (resource.action format)
export const PERMISSIONS = [
  // Product / Stock
  "product.create",
  "product.edit",
  "product.delete",
  "product.view",
  "inventory.view",
  "inventory.update",
  // Orders
  "order.view",
  "order.update_status",
  "order.cancel",
  "order.refund",
  // Sales
  "sales.view",
  "sales.create_offer",
  "coupon.create",
  "coupon.edit",
  "coupon.delete",
  // Customers
  "customer.view",
  "customer.edit",
  "customer.delete",
  // Delivery
  "delivery.view",
  "delivery.assign",
  "delivery.update_status",
  // Marketing / Content
  "campaign.create",
  "campaign.edit",
  "banner.manage",
  "content.edit",
  // Finance
  "finance.view",
  "finance.export",
  "payout.approve",
  // Managers / Settings (super admin territory)
  "manager.create",
  "manager.edit",
  "manager.delete",
  "role.create",
  "role.edit",
  "role.delete",
  "settings.edit",
  // Reports
  "reports.view",
  "reports.export",
  // category management
  "category.create",
  "category.edit",
  "category.delete",
  "category.view",
  "sub_category.create",
  "sub_category.edit",
  "sub_category.delete",
  "sub_category.view",
  "collection.create",
  "collection.edit",
  "collection.delete",
  "collection.view",
];

const roleSchema = new Schema(
  {
    merchantId: {
      type: Schema.Types.ObjectId,
      ref: "Merchants",
      required: true,
      // Each role belongs to the merchant who created it; used to build
      // that merchant's managers against their own set of roles.
    },
    name: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      // e.g. "sales_manager", "stock_manager", "order_manager", "custom_role_x"
    },
    label: {
      type: String,
      required: true,
      trim: true,
      // Human friendly display name, e.g. "Sales Manager", "Stock Manager"
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    permissions: [
      {
        type: String,
        enum: PERMISSIONS,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

// Role name only needs to be unique *within* a merchant — two different
// merchants can each have their own "stock_manager" role.
roleSchema.index({ merchantId: 1, name: 1 }, { unique: true });

roleSchema.statics.ROLE_NAMES = ROLE_NAMES;
roleSchema.statics.PERMISSIONS = PERMISSIONS;

const Role = mongoose.model("Role", roleSchema);

export default Role;
