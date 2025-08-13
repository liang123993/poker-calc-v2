// src/app/api/groups/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongoose";
import Group from "@/models/Group";
import Game from "@/models/Game";
import Player from "@/models/Player";
import Leaderboard from "@/models/Leaderboard";

// DELETE /api/groups/[id] → delete a specific group and all associated data
export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await dbConnect();
        
        const groupId = params.id;
        
        if (!groupId) {
            return NextResponse.json({ 
                error: "Group ID is required" 
            }, { status: 400 });
        }

        // Find the group first to make sure it exists
        const group = await Group.findById(groupId);
        if (!group) {
            return NextResponse.json({ 
                error: "Group not found" 
            }, { status: 404 });
        }

        // Count associated data to show user what will be deleted
        const gameCount = await Game.countDocuments({ groupId });
        const playerCount = await Player.countDocuments({ groupId });
        const leaderboardCount = await Leaderboard.countDocuments({ groupId });
        
        console.log(`Deleting group "${group.name}" with ${gameCount} games, ${playerCount} players, ${leaderboardCount} leaderboard entries`);

        // Delete all associated data
        await Game.deleteMany({ groupId });
        await Player.deleteMany({ groupId });
        await Leaderboard.deleteMany({ groupId });
        
        // Delete the group itself
        await Group.findByIdAndDelete(groupId);
        
        return NextResponse.json({
            success: true,
            message: `Group "${group.name}" and all associated data deleted successfully`,
            deletedData: {
                games: gameCount,
                players: playerCount,
                leaderboardEntries: leaderboardCount
            }
        });
        
    } catch (error) {
        console.error('Error deleting group:', error);
        return NextResponse.json({ 
            error: "Failed to delete group",
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}