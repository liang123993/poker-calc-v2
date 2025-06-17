import mongoose from "mongoose";

const GameSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        totalAmount: {
            type: Number,
            required: true,
            min: 0,
        },
        playerCount: {
            type: Number,
            required: true,
            min: 2,
        },
        isBalanced: {
            type: Boolean,
            required: true,
            default: true,
        },
        transfers: [{
            from: { type: String, required: true },
            to: { type: String, required: true },
            amount: { type: Number, required: true },
        }],
    },
    {
        timestamps: true, // Adds createdAt and updatedAt
    }
);

GameSchema.index({ createdAt: -1 }); // Most recent games first
GameSchema.index({ title: 1 }); // Search by title

export default mongoose.models.Game || mongoose.model("Game", GameSchema);
