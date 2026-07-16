import mongoose from "mongoose";

const superAdminSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },

        phone: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },

        password: {
            type: String,
            required: true,
            select: false, // Don't return password by default
        },

        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
        minimize: false,
        versionKey: false,
    }
);

const SuperAdmin =
    mongoose.models.SuperAdmin ||
    mongoose.model("SuperAdmin", superAdminSchema);

export default SuperAdmin;