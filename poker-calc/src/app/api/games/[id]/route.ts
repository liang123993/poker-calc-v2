// src/app/api/games/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongoose";
import Game from "@/models/Game";
import Player from "@/models/Player";
import Leaderboard from "@/models/Leaderboard";

// Helper function to normalize player names (trim and proper case)
function normalizePlayerName(name: string): string {
    return name.trim()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

// PUT /api/games/[id] → update a specific game and recalculate leaderboard
export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await dbConnect();
        
        const gameId = params.id;
        const body = await req.json();
        const { title, players } = body;
        
        if (!gameId) {
            return NextResponse.json({ 
                error: "Game ID is required" 
            }, { status: 400 });
        }

        if (!title || !players || !Array.isArray(players) || players.length < 2) {
            return NextResponse.json({ 
                error: "Missing required fields or invalid data" 
            }, { status: 400 });
        }

        // Find the existing game
        const existingGame = await Game.findById(gameId);
        if (!existingGame) {
            return NextResponse.json({ 
                error: "Game not found" 
            }, { status: 404 });
        }

        // Get existing players to reverse their leaderboard effects
        const existingPlayers = await Player.find({ gameId });

        // Normalize new player names
        const normalizedPlayers = players.map(player => ({
            ...player,
            name: normalizePlayerName(player.name)
        }));

        // Validate that game is balanced
        const totalNet = normalizedPlayers.reduce((sum: number, player: any) => sum + player.net, 0);
        if (Math.abs(totalNet) > 0.01) {
            return NextResponse.json({ 
                error: "Game is not balanced" 
            }, { status: 400 });
        }

        // Calculate game totals
        const totalAmount = normalizedPlayers.reduce((sum: number, player: any) => sum + player.buyIn, 0);
        const playerCount = normalizedPlayers.length;

        // Update the game
        await Game.findByIdAndUpdate(gameId, {
            title,
            totalAmount,
            playerCount,
            isBalanced: true
        });

        // Remove old players
        await Player.deleteMany({ gameId });

        // Add new players with ranks
        const rankedPlayers = normalizedPlayers
            .sort((a: any, b: any) => b.net - a.net)
            .map((player: any, index: number) => ({
                name: player.name,
                buyIn: player.buyIn,
                cashOut: player.cashOut,
                net: player.net,
                gameId: gameId,
                rank: index + 1
            }));

        await Player.insertMany(rankedPlayers);

        // Update leaderboard: reverse old effects, apply new effects
        await updateLeaderboardForEdit(existingPlayers, rankedPlayers);

        // Get updated game with players
        const updatedGame = await Game.findById(gameId);
        const updatedPlayers = await Player.find({ gameId }).sort({ rank: 1 });

        return NextResponse.json({
            success: true,
            game: {
                ...updatedGame.toObject(),
                players: updatedPlayers.map(player => ({
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
            },
            message: "Game updated successfully"
        });
        
    } catch (error) {
        console.error('Error updating game:', error);
        return NextResponse.json({ 
            error: "Failed to update game",
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

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

// Helper function to update leaderboard when editing a game
async function updateLeaderboardForEdit(oldPlayers: any[], newPlayers: any[]) {
    // First, reverse the effects of the old game
    await updateLeaderboardAfterDeletion(oldPlayers);
    
    // Then, apply the effects of the new game
    for (const player of newPlayers) {
        try {
            // Use case-insensitive lookup for existing leaderboard entry
            let leaderboardEntry = await Leaderboard.findOne({ 
                playerName: { $regex: new RegExp(`^${player.name}$`, 'i') }
            });
            
            if (!leaderboardEntry) {
                // New player - create entry with normalized name
                leaderboardEntry = await Leaderboard.create({
                    playerName: player.name, // Already normalized
                    totalProfit: player.net,
                    gamesPlayed: 1,
                    currentRank: 999999, // Will be updated later
                    previousRank: null,
                    rankChange: 'new'
                });
            } else {
                // Existing player - update stats and normalize the name if needed
                if (leaderboardEntry.playerName !== player.name) {
                    leaderboardEntry.playerName = player.name; // Update to normalized version
                }
                leaderboardEntry.totalProfit += player.net;
                leaderboardEntry.gamesPlayed += 1;
                await leaderboardEntry.save();
            }
        } catch (error) {
            console.error(`Error updating leaderboard for ${player.name}:`, error);
        }
    }
    
    // Recalculate ranks for all players
    await updateAllRanks();
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