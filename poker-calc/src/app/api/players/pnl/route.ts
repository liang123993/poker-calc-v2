// src/app/api/players/pnl/route.ts
import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongoose";
import Player from "@/models/Player";
import "@/models/Game"; // register Game model for populate

// GET /api/players/pnl?groupId=X&name=Y → cumulative profit/loss per game for one player
export async function GET(req: NextRequest) {
    try {
        await dbConnect();

        const url = new URL(req.url);
        const groupId = url.searchParams.get('groupId');
        const name = url.searchParams.get('name');

        if (!groupId || !name) {
            return NextResponse.json({ error: "groupId and name are required" }, { status: 400 });
        }

        const escaped = name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        const entries = await Player.find({
            groupId,
            name: { $regex: new RegExp(`^${escaped}$`, 'i') }
        }).populate('gameId', 'title createdAt');

        let cumulative = 0;
        const points = entries
            .map((entry: any) => ({
                gameId: entry.gameId?._id?.toString() ?? null,
                title: entry.gameId?.title ?? 'Deleted game',
                date: entry.gameId?.createdAt ?? entry.createdAt,
                net: entry.net,
            }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .map(point => ({ ...point, cumulative: (cumulative += point.net) }));

        return NextResponse.json({ name: name.trim(), groupId, points });
    } catch (error) {
        console.error('Error fetching player PnL:', error);
        return NextResponse.json({ error: "Failed to fetch player PnL" }, { status: 500 });
    }
}
