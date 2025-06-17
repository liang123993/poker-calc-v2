// src/app/api/leaderboard/route.ts
import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongoose";
import Leaderboard from "@/models/Leaderboard";

// GET /api/leaderboard → fetch leaderboard data
export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        
        const url = new URL(req.url);
        const limit = parseInt(url.searchParams.get('limit') || '50'); // Default to top 50
        
        const leaderboard = await Leaderboard.find({})
            .sort({ currentRank: 1 }) // Sort by rank (1st, 2nd, 3rd, etc.)
            .limit(limit)
            .populate('lastGameId', 'title createdAt') // Include last game info
            .populate('bestGame.gameId', 'title createdAt')
            .populate('worstGame.gameId', 'title createdAt');
        
        // Format the response data
        const formattedLeaderboard = leaderboard.map((entry, index) => ({
            rank: entry.currentRank,
            playerName: entry.playerName,
            totalProfit: parseFloat(entry.totalProfit.toFixed(2)),
            gamesPlayed: entry.gamesPlayed,
            rankChange: entry.rankChange,
            previousRank: entry.previousRank,
            averageProfit: entry.gamesPlayed > 0 ? 
                parseFloat((entry.totalProfit / entry.gamesPlayed).toFixed(2)) : 0,
            lastGame: entry.lastGameId ? {
                title: entry.lastGameId.title,
                date: entry.lastGameId.createdAt
            } : null,
            bestGame: {
                profit: parseFloat(entry.bestGame.profit.toFixed(2)),
                game: entry.bestGame.gameId ? {
                    title: entry.bestGame.gameId.title,
                    date: entry.bestGame.gameId.createdAt
                } : null
            },
            worstGame: {
                profit: parseFloat(entry.worstGame.profit.toFixed(2)),
                game: entry.worstGame.gameId ? {
                    title: entry.worstGame.gameId.title,
                    date: entry.worstGame.gameId.createdAt
                } : null
            }
        }));
        
        return NextResponse.json({
            leaderboard: formattedLeaderboard,
            totalPlayers: leaderboard.length
        });
        
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
    }
}