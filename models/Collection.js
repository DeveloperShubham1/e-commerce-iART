import mongoose from "mongoose";

const CollectionSchema = new mongoose.Schema(
    {
        merchantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Merchants",
            required: true,
        },
        name: { type: String, required: true },
        description: { type: String },
        image: {
            key: { type: String },
            url: { type: String },
        },
    },
    {
        timestamps: true, // adds createdAt and updatedAt
    }
);

export default mongoose.model("Collection", CollectionSchema);
