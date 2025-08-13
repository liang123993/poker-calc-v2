// src/models/Leaderboard.ts
import mongoose from "mongoose";

const LeaderboardSchema = new mongoose.Schema(
    {
        playerName: { 
            type: String, 
            required: true,
            trim: true
        },
        groupId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Group",
            required: true
        },
        totalProfit: { 
            type: Number, 
            required: true,
            default: 0
        },
        gamesPlayed: { 
            type: Number, 
            required: true,
            default: 0,
            min: 0
        },
        currentRank: {
            type: Number,
            required: true,
            default: 999999 // Start with high number, will be updated
        },
        previousRank: {
            type: Number,
            default: null // null for new players
        },
        rankChange: {
            type: String,
            enum: ['up', 'down', 'same', 'new'],
            default: 'new'
        },
        lastGameId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Game"
        },
    },
    {
        timestamps: true,
    }
)

// Indexes including groupId
LeaderboardSchema.index({ groupId: 1, currentRank: 1 }); // Leaderboard by group
LeaderboardSchema.index({ groupId: 1, totalProfit: -1 }); // Sort by profit within group
LeaderboardSchema.index({ playerName: 1, groupId: 1 }); // Unique player per group lookup

// Compound unique index to ensure one leaderboard entry per player per group
LeaderboardSchema.index({ playerName: 1, groupId: 1 }, { unique: true });

export default mongoose.models.Leaderboard || mongoose.model("Leaderboard", LeaderboardSchema);