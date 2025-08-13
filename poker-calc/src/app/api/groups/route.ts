// src/app/api/groups/route.ts
import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongoose";
import Group from "@/models/Group";
import Game from "@/models/Game";

// GET /api/groups → fetch all groups with stats
export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        
        const url = new URL(req.url);
        const includeStats = url.searchParams.get('includeStats') === 'true';
        
        let groups;
        
        if (includeStats) {
            // Aggregate to include game count and last game date
            groups = await Group.aggregate([
                { $match: { isActive: true } },
                {
                    $lookup: {
                        from: "games",
                        localField: "_id",
                        foreignField: "groupId",
                        as: "games"
                    }
                },
                {
                    $addFields: {
                        "stats.totalGames": { $size: "$games" },
                        "stats.lastGameDate": { 
                            $max: "$games.createdAt" 
                        }
                    }
                },
                {
                    $project: {
                        games: 0 // Remove the games array from output
                    }
                },
                { $sort: { "stats.totalGames": -1, createdAt: -1 } }
            ]);
        } else {
            groups = await Group.find({ isActive: true })
                .sort({ "stats.totalGames": -1, createdAt: -1 })
                .lean();
        }
        
        return NextResponse.json({
            groups: groups.map(group => ({
                _id: group._id.toString(),
                name: group.name,
                description: group.description,
                createdBy: group.createdBy,
                stats: group.stats,
                createdAt: group.createdAt,
                updatedAt: group.updatedAt
            }))
        });
        
    } catch (error) {
        console.error('Error fetching groups:', error);
        return NextResponse.json({ 
            error: "Failed to fetch groups",
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

// POST /api/groups → create new group
export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        
        const body = await req.json();
        const { name, createdBy, description } = body;
        
        if (!name || !createdBy) {
            return NextResponse.json({ 
                error: "Group name and creator name are required" 
            }, { status: 400 });
        }

        if (name.length > 100) {
            return NextResponse.json({ 
                error: "Group name must be 100 characters or less" 
            }, { status: 400 });
        }

        // Check for duplicate group names (optional - you might want to allow duplicates)
        const existingGroup = await Group.findOne({ 
            name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
            isActive: true 
        });
        
        if (existingGroup) {
            return NextResponse.json({ 
                error: "A group with this name already exists" 
            }, { status: 400 });
        }
        
        const newGroup = await Group.create({
            name: name.trim(),
            createdBy: createdBy.trim(),
            description: description ? description.trim() : "",
            stats: {
                totalGames: 0,
                totalPlayers: 0,
                lastGameDate: null
            }
        });
        
        return NextResponse.json({
            success: true,
            group: {
                _id: newGroup._id.toString(),
                name: newGroup.name,
                description: newGroup.description,
                createdBy: newGroup.createdBy,
                stats: newGroup.stats,
                createdAt: newGroup.createdAt,
                updatedAt: newGroup.updatedAt
            },
            message: "Group created successfully"
        });
        
    } catch (error) {
        console.error('Error creating group:', error);
        return NextResponse.json({ 
            error: "Failed to create group",
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}