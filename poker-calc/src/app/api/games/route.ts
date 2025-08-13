// src/app/api/games/route.ts
import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongoose";
import Game from "@/models/Game";
import Player from "@/models/Player";
import Leaderboard from "@/models/Leaderboard";

// GET, fetch all games (with optional group filtering)
export async function GET(req: NextRequest) {
    try {
        await dbConnect() // connect to mongoDB

        const url = new URL(req.url)
        const page = parseInt(url.searchParams.get('page') || '1'); // which page of results
        const limit = parseInt(url.searchParams.get('limit') || '10'); // how many games per page
        const search = url.searchParams.get('search') || ''; // search item
        const groupId = url.searchParams.get('groupId'); // filter by group

        const skip = (page - 1) * limit;
        
        // Build search query
        let searchQuery: any = {};
        
        // Add group filter if provided
        if (groupId) {
            searchQuery.groupId = groupId;
        }
        
        // Add text search if provided
        if (search) {
            searchQuery.title = { $regex: search, $options: 'i' };
        }

        const games = await Game.find(searchQuery) // finds game
            .sort({ createdAt: -1}) // most recent first
            .skip(skip)
            .limit(limit)

        const total = await Game.countDocuments(searchQuery) // counts total matching games

        return NextResponse.json({
            games,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching games:', error);
        return NextResponse.json({ error: "Failed to fetch games" }, { status: 500 });
    }
}

// Helper function to normalize player names (trim and proper case)
function normalizePlayerName(name: string): string {
    return name.trim()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

// POST, create new game and update leaderboard
export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        
        const body = await req.json();
        const { title, groupId, players, transfers } = body;
        
        if (!title || !groupId || !players || !Array.isArray(players) || players.length < 2) {
            return NextResponse.json({ 
                error: "Missing required fields or invalid data" 
            }, { status: 400 });
        }

        // Verify group exists
        const Group = (await import("@/models/Group")).default;
        const group = await Group.findById(groupId);
        if (!group) {
            return NextResponse.json({ 
                error: "Invalid group ID" 
            }, { status: 400 });
        }

        // Normalize player names to prevent case-sensitive duplicates
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
        
        // Create the game
        const newGame = await Game.create({
            title,
            groupId,
            totalAmount,
            playerCount,
            isBalanced: true,
            transfers: transfers || []
        });

        // Sort players by net profit (highest first) and add rank
        const rankedPlayers = normalizedPlayers
            .sort((a: any, b: any) => b.net - a.net)
            .map((player: any, index: number) => ({
                name: player.name,
                buyIn: player.buyIn,
                cashOut: player.cashOut,
                net: player.net,
                gameId: newGame._id,
                groupId: groupId,
                rank: index + 1
            }));

        // Create player entries
        await Player.insertMany(rankedPlayers);
        
        // Update leaderboard for each player in this group
        await updateLeaderboard(rankedPlayers, groupId);
        
        // Update group stats
        await updateGroupStats(groupId);
        
        return NextResponse.json({
            success: true,
            game: newGame,
            message: "Game saved successfully"
        });
        
    } catch (error) {
        console.error('Error creating game:', error);
        return NextResponse.json({ error: "Failed to create game" }, { status: 500 });
    }
}

// Helper function to update group statistics
async function updateGroupStats(groupId: string) {
    try {
        const Group = (await import("@/models/Group")).default;
        const mongoose = await import("mongoose");
        
        // Get game count and last game date for this group
        const gameStats = await Game.aggregate([
            { $match: { groupId: new mongoose.default.Types.ObjectId(groupId) } },
            {
                $group: {
                    _id: null,
                    totalGames: { $sum: 1 },
                    lastGameDate: { $max: "$createdAt" }
                }
            }
        ]);

        // Get unique player count for this group
        const playerStats = await Player.aggregate([
            { $match: { groupId: new mongoose.default.Types.ObjectId(groupId) } },
            {
                $group: {
                    _id: "$name"
                }
            },
            {
                $group: {
                    _id: null,
                    totalPlayers: { $sum: 1 }
                }
            }
        ]);

        const stats = {
            totalGames: gameStats[0]?.totalGames || 0,
            totalPlayers: playerStats[0]?.totalPlayers || 0,
            lastGameDate: gameStats[0]?.lastGameDate || null
        };

        await Group.findByIdAndUpdate(groupId, { stats });
    } catch (error) {
        console.error('Error updating group stats:', error);
    }
}

// Helper function to update leaderboard (with group awareness)
async function updateLeaderboard(players: any[], groupId: string) {
    for (const player of players) {
        try {
            // Use case-insensitive lookup for existing leaderboard entry within this group
            let leaderboardEntry = await Leaderboard.findOne({ 
                playerName: { $regex: new RegExp(`^${player.name}$`, 'i') },
                groupId: groupId
            });
            
            if (!leaderboardEntry) {
                // New player in this group - create entry with normalized name
                leaderboardEntry = await Leaderboard.create({
                    playerName: player.name, // Already normalized
                    groupId: groupId,
                    totalProfit: player.net,
                    gamesPlayed: 1,
                    currentRank: 999999, // Will be updated later
                    previousRank: null,
                    rankChange: 'new'
                });
            } else {
                // Existing player in this group - update stats and normalize the name if needed
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
    
    // Recalculate ranks for all players in this group
    await updateAllRanks(groupId);
}

// Helper function to recalculate all ranks within a group
async function updateAllRanks(groupId: string) {
    try {
        // Get all players in this group sorted by total profit (highest first)
        const allPlayers = await Leaderboard.find({ groupId })
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