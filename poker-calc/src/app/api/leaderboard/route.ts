// src/app/api/leaderboard/route.ts
import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongoose";
import Leaderboard from "@/models/Leaderboard";

// GET /api/leaderboard → fetch leaderboard data (with optional group filtering)
export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        
        const url = new URL(req.url);
        const limit = parseInt(url.searchParams.get('limit') || '50'); // Default to top 50
        const groupId = url.searchParams.get('groupId'); // Filter by group
        
        // Build query based on groupId
        let query: any = {};
        if (groupId) {
            query.groupId = groupId;
        }
        
        const leaderboard = await Leaderboard.find(query)
            .sort({ currentRank: 1 }) // Sort by rank (1st, 2nd, 3rd, etc.)
            .limit(limit);
        
        // Format the response data
        const formattedLeaderboard = leaderboard.map((entry) => ({
            rank: entry.currentRank,
            playerName: entry.playerName,
            groupId: entry.groupId?.toString(),
            totalProfit: parseFloat(entry.totalProfit.toFixed(2)),
            gamesPlayed: entry.gamesPlayed,
            rankChange: entry.rankChange,
            previousRank: entry.previousRank,
            averageProfit: entry.gamesPlayed > 0 ? 
                parseFloat((entry.totalProfit / entry.gamesPlayed).toFixed(2)) : 0
        }));
        
        return NextResponse.json({
            leaderboard: formattedLeaderboard,
            totalPlayers: leaderboard.length,
            groupId: groupId || null
        });
        
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        return NextResponse.json({ 
            error: "Failed to fetch leaderboard",
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}