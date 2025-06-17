// src/app/api/games/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongoose";
import Game from "@/models/Game";
import Player from "@/models/Player";
import Leaderboard from "@/models/Leaderboard";

// DELETE /api/games/[id] → delete a specific game and update leaderboard
export async function DELETE(
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

        // Find the game first to make sure it exists
        const game = await Game.findById(gameId);
        if (!game) {
            return NextResponse.json({ 
                error: "Game not found" 
            }, { status: 404 });
        }

        // Get all players from this game before deletion
        const players = await Player.find({ gameId });
        
        // Delete all players from this game
        await Player.deleteMany({ gameId });
        
        // Delete the game
        await Game.findByIdAndDelete(gameId);
        
        // Update leaderboard by reversing the effects of this game
        await updateLeaderboardAfterDeletion(players);
        
        return NextResponse.json({
            success: true,
            message: "Game and associated data deleted successfully"
        });
        
    } catch (error) {
        console.error('Error deleting game:', error);
        return NextResponse.json({ 
            error: "Failed to delete game",
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

// Helper function to update leaderboard after game deletion
async function updateLeaderboardAfterDeletion(players: any[]) {
    for (const player of players) {
        try {
            // Use case-insensitive lookup
            const leaderboardEntry = await Leaderboard.findOne({ 
                playerName: { $regex: new RegExp(`^${player.name}$`, 'i') }
            });
            
            if (leaderboardEntry) {
                // Subtract this game's profit and decrement games played
                leaderboardEntry.totalProfit -= player.net;
                leaderboardEntry.gamesPlayed -= 1;
                
                // If no games left, delete the leaderboard entry
                if (leaderboardEntry.gamesPlayed <= 0) {
                    await Leaderboard.findByIdAndDelete(leaderboardEntry._id);
                } else {
                    await leaderboardEntry.save();
                }
            }
        } catch (error) {
            console.error(`Error updating leaderboard for ${player.name} after deletion:`, error);
        }
    }
    
    // Recalculate ranks for all remaining players
    await updateAllRanks();
}

// Helper function to recalculate all ranks
async function updateAllRanks() {
    try {
        // Get all players sorted by total profit (highest first)
        const allPlayers = await Leaderboard.find({})
            .sort({ totalProfit: -1 });
        
        // Update ranks and track changes
        for (let i = 0; i < allPlayers.length; i++) {
            const player = allPlayers[i];
            const newRank = i + 1;
            const oldRank = player.currentRank;
            
            // Determine rank change
            let rankChange = 'same';
            if (player.previousRank === null) {
                rankChange = 'new';
            } else if (newRank < oldRank) {
                rankChange = 'up';
            } else if (newRank > oldRank) {
                rankChange = 'down';
            }
            
            // Update player record
            player.previousRank = oldRank;
            player.currentRank = newRank;
            player.rankChange = rankChange;
            
            await player.save();
        }
    } catch (error) {
        console.error('Error updating ranks:', error);
    }
}