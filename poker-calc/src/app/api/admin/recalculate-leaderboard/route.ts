// Create this file: src/app/api/admin/recalculate-leaderboard/route.ts

import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongoose";
import Game from "@/models/Game";
import Player from "@/models/Player";
import Leaderboard from "@/models/Leaderboard";

export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        
        // Get password from request body
        const { password } = await req.json();
        
        // Check password 
        if (password !== 'liang123993') {
            return NextResponse.json({ 
                error: "Unauthorized" 
            }, { status: 401 });
        }

        console.log("🔄 Starting leaderboard recalculation...");

        // Step 1: Clear existing leaderboard
        await Leaderboard.deleteMany({});
        console.log("✅ Cleared existing leaderboard");

        // Step 2: Get all players from all games
        const allPlayers = await Player.find({}).populate('gameId');
        console.log(`📊 Found ${allPlayers.length} player records`);

        // Step 3: Group players by name and calculate totals
        const playerStats: { [key: string]: { totalProfit: number, gamesPlayed: number, normalizedName: string } } = {};

        for (const player of allPlayers) {
            // Normalize the name (same logic as your existing code)
            const normalizedName = player.name.trim()
                .split(' ')
                .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ');
            
            const key = normalizedName.toLowerCase();
            
            if (!playerStats[key]) {
                playerStats[key] = {
                    totalProfit: 0,
                    gamesPlayed: 0,
                    normalizedName: normalizedName
                };
            }
            
            playerStats[key].totalProfit += player.net;
            playerStats[key].gamesPlayed += 1;
        }

        console.log(`👥 Found ${Object.keys(playerStats).length} unique players`);

        // Step 4: Create new leaderboard entries
        const leaderboardEntries = Object.values(playerStats).map(stats => ({
            playerName: stats.normalizedName,
            totalProfit: Math.round(stats.totalProfit * 100) / 100, // Round to 2 decimal places
            gamesPlayed: stats.gamesPlayed,
            currentRank: 999999, // Will be updated in next step
            previousRank: null,
            rankChange: 'new'
        }));

        // Insert all entries
        if (leaderboardEntries.length > 0) {
            await Leaderboard.insertMany(leaderboardEntries);
            console.log(`✅ Created ${leaderboardEntries.length} leaderboard entries`);
        }

        // Step 5: Calculate ranks
        await updateAllRanks();
        console.log("✅ Updated all ranks");

        // Step 6: Get final leaderboard for response
        const finalLeaderboard = await Leaderboard.find({})
            .sort({ currentRank: 1 })
            .limit(10);

        return NextResponse.json({
            success: true,
            message: "Leaderboard recalculated successfully",
            playersProcessed: allPlayers.length,
            uniquePlayers: Object.keys(playerStats).length,
            topPlayers: finalLeaderboard.map(p => ({
                rank: p.currentRank,
                name: p.playerName,
                totalProfit: p.totalProfit,
                gamesPlayed: p.gamesPlayed
            }))
        });

    } catch (error) {
        console.error('Error recalculating leaderboard:', error);
        return NextResponse.json({ 
            error: "Failed to recalculate leaderboard",
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

// Helper function to recalculate all ranks (same as existing code)
async function updateAllRanks() {
    try {
        // Get all players sorted by total profit (highest first)
        const allPlayers = await Leaderboard.find({})
            .sort({ totalProfit: -1 });
        
        // Update ranks
        for (let i = 0; i < allPlayers.length; i++) {
            const player = allPlayers[i];
            const newRank = i + 1;
            
            // For recalculation, set everything as 'same' since we're rebuilding
            player.currentRank = newRank;
            player.rankChange = 'same';
            
            await player.save();
        }
    } catch (error) {
        console.error('Error updating ranks:', error);
    }
}