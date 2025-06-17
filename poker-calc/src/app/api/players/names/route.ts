// src/app/api/players/names/route.ts
import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongoose";
import Player from "@/models/Player";

// GET /api/players/names → fetch unique player names for dropdown
export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        
        // Get all unique player names from the database
        const uniqueNames = await Player.distinct("name");
        
        // Sort alphabetically and filter out empty names
        const sortedNames = uniqueNames
            .filter(name => name && name.trim() !== "")
            .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
        
        return NextResponse.json({
            names: sortedNames
        });
        
    } catch (error) {
        console.error('Error fetching player names:', error);
        return NextResponse.json({ 
            error: "Failed to fetch player names",
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}