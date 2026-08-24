// Mirrors the PERMISSIONS list in the backend Role model, grouped for a readable checkbox UI.
export const PERMISSION_GROUPS = [
  {
    label: "Product & Stock",
    permissions: [
      { key: "product.create", label: "Create products" },
      { key: "product.edit", label: "Edit products" },
      { key: "product.delete", label: "Delete products" },
      { key: "product.view", label: "View products" },
    ],
  },
  {
    label: "categories and sub categories",
    permissions: [
      { key: "category.create", label: "Create category" },
      { key: "category.edit", label: "Edit category" },
      { key: "category.delete", label: "Delete category" },
      { key: "category.view", label: "View category" },
      { key: "sub_category.create", label: "Create sub category" },
      { key: "sub_category.edit", label: "Edit sub category" },
      { key: "sub_category.delete", label: "Delete sub category" },
      { key: "sub_category.view", label: "View sub category" },
    ],
  },

  {
    label: "Product Collections",
    permissions: [
      { key: "collection.create", label: "Create collection" },
      { key: "collection.edit", label: "Edit collection" },
      { key: "collection.delete", label: "Delete collection" },
      { key: "collection.view", label: "View collection" },
    ],
  },

  {
    label: "Orders",
    permissions: [
      { key: "order.view", label: "View orders" },
      { key: "order.update_status", label: "Update order status" },
    ],
  },
  // {
  //   label: "Sales & Coupons",
  //   permissions: [
  //     { key: "sales.view", label: "View sales" },
  //     { key: "sales.create_offer", label: "Create offers" },
  //     { key: "coupon.create", label: "Create coupons" },
  //     { key: "coupon.edit", label: "Edit coupons" },
  //     { key: "coupon.delete", label: "Delete coupons" },
  //   ],
  // },
  {
    label: "Customers",
    permissions: [
      { key: "customer.view", label: "View customers" },
      { key: "customer.edit", label: "Edit customers" },
    ],
  },
  // {
  //   label: "Delivery",
  //   permissions: [
  //     { key: "delivery.view", label: "View deliveries" },
  //     { key: "delivery.assign", label: "Assign delivery" },
  //     { key: "delivery.update_status", label: "Update delivery status" },
  //   ],
  // },
  // {
  //   label: "Marketing & Content",
  //   permissions: [
  //     { key: "campaign.create", label: "Create campaigns" },
  //     { key: "campaign.edit", label: "Edit campaigns" },
  //     { key: "banner.manage", label: "Manage banners" },
  //     { key: "content.edit", label: "Edit content" },
  //   ],
  // },
  // {
  //   label: "Finance",
  //   permissions: [
  //     { key: "finance.view", label: "View finance" },
  //     { key: "finance.export", label: "Export finance reports" },
  //     { key: "payout.approve", label: "Approve payouts" },
  //   ],
  // },
  {
    label: "Reports",
    permissions: [
      { key: "reports.view", label: "View reports" },
      // { key: "reports.export", label: "Export reports" },
    ],
  },
];