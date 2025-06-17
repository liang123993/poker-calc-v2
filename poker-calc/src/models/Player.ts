// src/models/Player.ts
import mongoose from "mongoose";

const PlayerSchema = new mongoose.Schema(
    {
        name: { 
            type: String, 
            required: true,
            trim: true
        },
        buyIn: { 
            type: Number, 
            required: true,
            min: 0
        },
        cashOut: { 
            type: Number, 
            required: true,
            min: 0
        },
        net: { 
            type: Number, 
            required: true
        },
        gameId: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: "Game",
            required: true
        },
        rank: {
            type: Number,
            required: true,
            min: 1
        }
    },
    {
        timestamps: true,
    }
);

// Compound indexes for efficient querying
PlayerSchema.index({ gameId: 1, rank: 1 }); // Find players by game and rank
PlayerSchema.index({ name: 1, createdAt: -1 }); // Find player history by name
PlayerSchema.index({ name: 1 }); // General name lookup

export default mongoose.models.Player || mongoose.model("Player", PlayerSchema);