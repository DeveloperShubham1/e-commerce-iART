import mongoose from "mongoose";

const CollectionAssignSchema = new mongoose.Schema(
    {
        collection: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Collection",
            required: true,
        },
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true,
        },
    },
    {
        timestamps: true, // adds createdAt and updatedAt
    }
);

export default mongoose.model("CollectionAssign", CollectionAssignSchema);
