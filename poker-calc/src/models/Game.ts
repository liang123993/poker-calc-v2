// src/models/Game.ts
import mongoose from "mongoose";

const GameSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        groupId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Group",
            required: true
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

// Indexes including groupId
GameSchema.index({ groupId: 1, createdAt: -1 }); // Games by group, most recent first
GameSchema.index({ title: 1, groupId: 1 }); // Search by title within group
GameSchema.index({ createdAt: -1 }); // Keep existing index for general queries

export default mongoose.models.Game || mongoose.model("Game", GameSchema);