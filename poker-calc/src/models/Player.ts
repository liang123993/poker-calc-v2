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
        groupId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Group", 
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

// Indexes including groupId
PlayerSchema.index({ gameId: 1, rank: 1 }); // Keep existing for game queries
PlayerSchema.index({ groupId: 1, name: 1, createdAt: -1 }); // Player history by group
PlayerSchema.index({ name: 1, groupId: 1 }); // Name lookup within group

export default mongoose.models.Player || mongoose.model("Player", PlayerSchema);