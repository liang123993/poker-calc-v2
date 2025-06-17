import mongoose from "mongoose";

const PlayerSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        buyIn: { type: Number, required: true },
        cashOut: { type: Number, required: true },
        net: { type: Number, required: true},
        gameId: { type: mongoose.Schema.Types.ObjectId, ref: "Game" },
    },
    {
        timestamps: true,
    }
);

export default mongoose.models.Player || mongoose.model("Player", PlayerSchema);
