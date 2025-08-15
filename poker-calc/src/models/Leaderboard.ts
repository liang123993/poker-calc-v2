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
            default: 999999
        },
        previousRank: {
            type: Number,
            default: null
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

// ONLY keep these indexes (remove any others to avoid conflicts)
LeaderboardSchema.index({ groupId: 1, currentRank: 1 }); // Leaderboard by group
LeaderboardSchema.index({ groupId: 1, totalProfit: -1 }); // Sort by profit within group

// The MAIN unique constraint - one leaderboard entry per player per group
LeaderboardSchema.index({ playerName: 1, groupId: 1 }, { unique: true });

export default mongoose.models.Leaderboard || mongoose.model("Leaderboard", LeaderboardSchema);