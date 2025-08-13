// src/models/Group.ts
import mongoose from "mongoose";

const GroupSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100
        },
        createdBy: {
            type: String,
            required: true,
            trim: true
        },
        description: {
            type: String,
            trim: true,
            maxlength: 500,
            default: ""
        },
        isActive: {
            type: Boolean,
            default: true
        },
        // Stats for quick access
        stats: {
            totalGames: { type: Number, default: 0 },
            totalPlayers: { type: Number, default: 0 },
            lastGameDate: { type: Date, default: null }
        }
    },
    {
        timestamps: true,
    }
);

// Indexes for performance
GroupSchema.index({ createdAt: -1 }); // Most recent first
GroupSchema.index({ 'stats.totalGames': -1 }); // Sort by activity
GroupSchema.index({ name: 1 }); // Quick name lookup

export default mongoose.models.Group || mongoose.model("Group", GroupSchema);