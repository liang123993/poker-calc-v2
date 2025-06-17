import mongoose from "mongoose";

const PlayerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    buyIn: { type: Number, required: true },
    cashOut: { type: Number, required: true },
    net: { type: Number },
    gameId: { type: mongoose.Schema.Types.ObjectId, ref: "Game" },
}, {
        timestamps: true
});

PlayerSchema.pre("save", function (next) {
    this.net = this.buyIn - this.cashOut
    next()
})

export default mongoose.models.Player || mongoose.model("Player", PlayerSchema);