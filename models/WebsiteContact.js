import mongoose from "mongoose";

const WebsiteContactSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },

        phone: {
            type: String,
            required: true,
            trim: true,
        },

        company: {
            type: String,
            trim: true,
            default: "",
        },

        message: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true, // adds createdAt and updatedAt
    }
);

export default mongoose.model("WebsiteContact", WebsiteContactSchema);