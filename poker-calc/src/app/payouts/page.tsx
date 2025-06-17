"use client";

import { useState } from "react";
import { Player } from "@/types/player";
import Header from "@/components/Header";
import { Plus, Trash2 } from "lucide-react";

export default function PayoutPage() {
    // store players in array
    const [players, setPlayers] = useState<Player[]>([]); // ['liang', 'michael', ...]

    const addPlayer = () => {
        const newPlayer: Player = {
            id: Date.now().toString(), // Simple ID using timestamp
            name: "",
            buyIn: 0,
            cashOut: 0,
            net: 0,
        };
        setPlayers([...players, newPlayer]);
        console.log(players);
    };

    const removePlayer = (id: string) => {
        setPlayers(players.filter(player => player.id !== id))
    };

    const updatePlayer = (
        id: string,
        field: keyof Player,
        value: string | number
    ) => {
        setPlayers(
            players.map((player) => {
                if (player.id == id) {
                    const updated = { ...player, [field]: value };

                    if (field === "buyIn" || field === "cashOut") {
                        updated.net = updated.cashOut - updated.buyIn;
                    }

                    return updated;
                }
                return player;
            })
        );
    };

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
                <div className="bg-custom-surface border border-custom rounded-lg overflow-hidden mb-6">
                    <table className="w-full">
                        {/* table head row */}
                        <thead className="bg-custom-surface-alt">
                            <tr>
                                <th className="text-center py-3 px-4 font-medium text-custom-primary">
                                    Player Name
                                </th>
                                <th className="text-center py-3 px-4 font-medium text-custom-primary">
                                    Buy-in
                                </th>
                                <th className="text-center py-3 px-4 font-medium text-custom-primary">
                                    Cashout
                                </th>
                                <th className="text-center py-3 px-4 font-medium text-custom-primary">
                                    Net Gain/Loss
                                </th>
                                <th className="text-center py-3 px-4 font-medium text-custom-primary">
                                    Actions
                                </th>
                            </tr>
                        </thead>

                        {/* table body */}
                        <tbody>
                            {players.map((player) => (
                                // for every player create a new row
                                <tr key={player.id}>
                                    {/* name */}
                                    <td className="py-3 px-4">
                                        <input
                                            type="text"
                                            value={player.name}
                                            onChange={(e) =>
                                                updatePlayer(
                                                    player.id,
                                                    "name",
                                                    e.target.value
                                                )
                                            }
                                            className="w-full bg-custom-background border border-custom rounded px-3 py-2 text-custom-primary placeholder-custom-secondary focus:outline-none focus:border-custom-primary"
                                            placeholder="Enter name"
                                        />
                                    </td>
                                    {/* buy in */}
                                    <td className="py-3 px-4">
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={player.buyIn || ""}
                                            onChange={(e) =>
                                                updatePlayer(
                                                    player.id,
                                                    "buyIn",
                                                    parseFloat(
                                                        e.target.value
                                                    ) || 0
                                                )
                                            }
                                            className="w-full bg-custom-background border border-custom rounded px-3 py-2 text-custom-primary text-center focus:outline-none focus:border-custom-primary"
                                            placeholder="0"
                                        />
                                    </td>
                                    {/* cash out */}
                                    <td className="py-3 px-4">
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={player.cashOut || ""}
                                            onChange={(e) =>
                                                updatePlayer(
                                                    player.id,
                                                    "cashOut",
                                                    parseFloat(
                                                        e.target.value
                                                    ) || 0
                                                )
                                            }
                                            className="w-full bg-custom-background border border-custom rounded px-3 py-2 text-custom-primary text-center focus:outline-none focus:border-custom-primary"
                                            placeholder="0"
                                        />
                                    </td>
                                    {/* net */}
                                    <td className="py-3 px-4 text-center">
                                        <span
                                            className={`font-semibold ${
                                                player.net > 0
                                                    ? "text-green-400"
                                                    : player.net < 0
                                                      ? "text-red-400"
                                                      : "text-gray-400"
                                            }`}
                                        >
                                            ${player.net.toFixed(2)}
                                        </span>
                                    </td>
                                    {/* actions */}
                                    <td className="py-3 px-4 text-center">
                                        <button
                                            onClick={() =>
                                                removePlayer(player.id)
                                            }
                                            className="text-red-400 hover:text-red-300 hover:bg-red-900/20 p-2 rounded transition-colors"
                                            title="Delete player"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* add player button */}
                <div className="mb-6">
                    <button
                        onClick={addPlayer}
                        className="bg-custom-surface hover:bg-custom-border text-custom-primary px-4 py-2 rounded flex items-center gap-2 transition-colors"
                    >
                        <Plus size={16} />
                        Add Player
                    </button>
                </div>
            </main>
        </div>
    );
}
