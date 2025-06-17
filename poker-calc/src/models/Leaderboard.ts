import mongoose from "mongoose";

const LeaderboardSchema = new mongoose.Schema(
    {
        playerName: { 
            type: String, 
            required: true,
            trim: true,
            unique: true // Each player appears only once in leaderboard
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

LeaderboardSchema.index({ currentRank: 1 }); // Sort by current rank
LeaderboardSchema.index({ totalProfit: -1 }); // Sort by profit (highest first)
LeaderboardSchema.index({ playerName: 1 }); // Quick player lookup

export default mongoose.models.Leaderboard || mongoose.model("Leaderboard", LeaderboardSchema);