// src/app/api/games/[id]/players/route.ts
import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongoose";
import Player from "@/models/Player";

// GET /api/games/[id]/players → fetch players for a specific game
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await dbConnect();
        
        const gameId = params.id;
        
        if (!gameId) {
            return NextResponse.json({ 
                error: "Game ID is required" 
            }, { status: 400 });
        }

        const players = await Player.find({ gameId })
            .sort({ rank: 1 }) // Sort by rank (1st, 2nd, 3rd, etc.)
            .lean();

        return NextResponse.json({
            players: players.map((player: any) => ({
                id: player._id.toString(),
                name: player.name,
                buyIn: player.buyIn,
                cashOut: player.cashOut,
                net: player.net,
                rank: player.rank,
                gameId: player.gameId.toString(),
                createdAt: player.createdAt,
                updatedAt: player.updatedAt
            }))
        });
        
    } catch (error) {
        console.error('Error fetching players for game:', error);
        return NextResponse.json({ 
            error: "Failed to fetch players",
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}