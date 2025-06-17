"use client";

import { useState } from "react";
import { Player } from "@/types/player"
import Header from "@/components/Header";
import { Plus } from "lucide-react"

export default function PayoutPage() {
    // store players in array
    const [players, setPlayers] = useState<Player[]>([]); // ['liang', 'michael', ...]

    const addPlayer = () => {
        const newPlayer: Player = {
            id: Date.now().toString(),  // Simple ID using timestamp
            name: "",
            buyIn: 0,
            cashOut: 0,
            net: 0,
        }
        setPlayers([...players, newPlayer])
        console.log(players)
    }

    return (
        <div className="min-h-screen bg-custom-background text-custom-primary">
            {/* header */}
            <Header currentPage="payout" />
            {/* main content */}
            <main className="px-6 py-8">
                <h2 className="text-2xl font-bold mb-6 text-custom-primary">
                    Payout Entry
                </h2>
                {/* table */}


                {/* add player button */}
                <div className="mb-6">
                    <button
                        onClick={addPlayer}
                        className="bg-custom-surface hover:bg-custom-border text-custom-primary px-4 py-2 rounded flex items-center gap-2 transition-colors"
                    >
                        <Plus size={16} />Add Player
                    </button>
                </div>

            </main>
        </div>
    );
}
