import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongoose";
import Player from "@/models/Player";

// GET /api/players → fetch all players
export async function GET() {
  await dbConnect();

  const players = await Player.find({});
  return NextResponse.json(players);
}

// POST /api/players → create a new player
export async function POST(req: NextRequest) {
  await dbConnect();

  const body = await req.json();
  const { name, buyIn, cashOut } = body;

  if (!name || buyIn == null || cashOut == null) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const net = cashOut - buyIn;

  const newPlayer = await Player.create({
    name,
    buyIn,
    cashOut,
    net, 
  });

  return NextResponse.json(newPlayer);
}
