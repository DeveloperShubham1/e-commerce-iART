import mongoose from "mongoose";
const { Schema } = mongoose;

const managerSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    merchantId: {
      type: Schema.Types.ObjectId,
      ref: "Merchants",
      required: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false, // never return password hash by default
    },
    role: {
      type: Schema.Types.ObjectId,
      ref: "Role",
      required: true,
    },
    // Per-manager overrides on top of the role's permissions
    extraPermissions: [{ type: String }],
    deniedPermissions: [{ type: String }],
    status: {
      type: String,
      enum: ["active", "suspended", "invited"],
      default: "invited",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "Manager",
    },
    lastLoginAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

// Email only needs to be unique *within* a merchant — two different merchants
// can each have a manager with the same email address.
managerSchema.index({ merchantId: 1, email: 1 }, { unique: true });

// Convenience method: compute the effective permission set for this manager
managerSchema.methods.getEffectivePermissions = async function () {
  await this.populate("role");
  const rolePerms = this.role?.permissions || [];
  const finalPerms = new Set([...rolePerms, ...(this.extraPermissions || [])]);
  (this.deniedPermissions || []).forEach((p) => finalPerms.delete(p));
  return Array.from(finalPerms);
};

const Manager = mongoose.model("Manager", managerSchema);

export default Manager;
