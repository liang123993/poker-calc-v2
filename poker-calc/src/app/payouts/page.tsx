"use client";

import { useState } from "react";
import { Player } from "@/types/player";
import Header from "@/components/Header";
import { Plus, Trash2, Calculator } from "lucide-react";
import PayoutSummaryModal from "@/components/PayoutSummaryModal";
import PasswordModal from "@/components/PasswordModal";

const previousNames = [
    "Alex Johnson", "Sarah Chen", "Mike Rodriguez", "Emma Wilson", "David Kim",
    "Lisa Thompson", "James Brown", "Anna Davis", "Tom Wilson", "Kate Miller",
    "John Smith", "Mary Johnson", "Chris Lee", "Jessica Wang", "Ryan Taylor"
];


export default function PayoutPage() {

    const [players, setPlayers] = useState<Player[]>([]); // ['liang', 'michael', ...]
    const [showSummary, setShowSummary] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
    const [searchTerms, setSearchTerms] = useState<{ [key: string]: string }>({});

    // add player
    const addPlayer = () => {
        const newPlayer: Player = {
            id: Date.now().toString(), // Simple ID using timestamp
            name: "",
            buyIn: 0,
            cashOut: 0,
            net: 0,
        };
        setPlayers([...players, newPlayer]);
    };

    // remove player
    const removePlayer = (id: string) => {
        setPlayers(players.filter((player) => player.id !== id));
    };

    // update details
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
                        const buyIn = Math.round(updated.buyIn * 100) / 100;
                        const cashOut = Math.round(updated.cashOut * 100) / 100;
                        updated.net = Math.round((cashOut - buyIn) * 100) / 100;
                    }

                    return updated;
                }
                return player;
            })
        );
    };

    // calcs every players net summed tgt
    const getTotalNet = () => {
        return players.reduce((sum, player) => sum + player.net, 0);
    };

    const isGameBalanced = () => {
        return Math.abs(getTotalNet()) < 0.01;
    };

    // Check if we can calculate (at least 2 players, all have names, game is balanced)
    const canCalculate = () => {
        return (
            players.length >= 2 &&
            players.every((p) => p.name.trim() !== "") &&
            isGameBalanced()
        );
    };

    // Format currency display
    const formatCurrency = (amount: number) => {
        return `$${Math.abs(amount).toFixed(2)}`;
    };

    // Get balance message
    const getBalanceMessage = () => {
        const totalNet = getTotalNet();
        if (Math.abs(totalNet) < 0.01) {
            return <span className="text-green-400">Balanced ✓</span>;
        } else if (totalNet > 0) {
            return (
                <span className="text-red-400">
                    Over by {formatCurrency(totalNet)}
                </span>
            );
        } else {
            return (
                <span className="text-red-400">
                    Missing {formatCurrency(totalNet)}
                </span>
            );
        }
    };

    // Handle calculate button click
    const handleCalculate = () => {
        if (!canCalculate()) {
            if (players.length < 2) {
                alert("Please add at least 2 players.");
                return;
            }
            if (players.some((p) => p.name.trim() === "")) {
                alert("All players must have names.");
                return;
            }
            if (!isGameBalanced()) {
                alert(
                    `Game is not balanced. Total net: ${formatCurrency(getTotalNet())}`
                );
                return;
            }
        }
        setShowSummary(true)
    };

    // Filter names for dropdown
    const getFilteredNames = (playerId: string) => {
        const searchTerm = searchTerms[playerId] || "";
        const currentPlayerNames = players.map(p => p.name.toLowerCase());
        return previousNames.filter((name) => 
            name.toLowerCase().includes(searchTerm.toLowerCase()) &&
            !currentPlayerNames.includes(name.toLowerCase()) &&
            name.toLowerCase() !== searchTerm.toLowerCase()
        );
    };

    // Handle name selection from dropdown
    const handleNameSelect = (playerId: string, name: string) => {
        updatePlayer(playerId, "name", name);
        setDropdownOpen(null);
        setSearchTerms({ ...searchTerms, [playerId]: "" });
    };

    // Handle name input change
    const handleNameInputChange = (playerId: string, value: string) => {
        updatePlayer(playerId, "name", value);
        setSearchTerms({ ...searchTerms, [playerId]: value });
        if (value && getFilteredNames(playerId).length > 0) {
            setDropdownOpen(playerId);
        } else {
            setDropdownOpen(null);
        }
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
                <div className="bg-custom-background border border-custom rounded-lg overflow-hidden mb-6">
                    <table className="w-full">
                        {/* table head row */}
                        <thead className="bg-custom-surface">
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
                                    <td className="py-3 px-4 relative">
                                        <input
                                            type="text"
                                            value={player.name}
                                            onChange={(e) => handleNameInputChange(player.id, e.target.value)}
                                            onFocus={() => {
                                                if (player.name && getFilteredNames(player.id).length > 0) {
                                                    setDropdownOpen(player.id);
                                                }
                                            }}
                                            onBlur={() => {
                                                setTimeout(() => setDropdownOpen(null), 150);
                                            }}
                                            className="w-full bg-custom-surface-alt border border-custom rounded px-3 py-2 text-custom-primary placeholder-custom-secondary focus:outline-none focus:border-custom-primary"
                                            placeholder="Enter or select name"
                                            id={`player-input-${player.id}`}
                                        />
                                        
                                        {/* Dropdown with fixed positioning */}
                                        {dropdownOpen === player.id && getFilteredNames(player.id).length > 0 && (
                                            <div className="fixed z-50 bg-custom-surface-alt border border-custom rounded-md shadow-lg max-h-40 overflow-y-auto"
                                                style={{
                                                    top: `${document.getElementById(`player-input-${player.id}`)?.getBoundingClientRect().bottom + window.scrollY + 4}px`,
                                                    left: `${document.getElementById(`player-input-${player.id}`)?.getBoundingClientRect().left + window.scrollX}px`,
                                                    width: `${document.getElementById(`player-input-${player.id}`)?.getBoundingClientRect().width}px`
                                                }}>
                                                {getFilteredNames(player.id).map((name, index) => (
                                                    <button
                                                        key={index}
                                                        type="button"
                                                        onClick={() => handleNameSelect(player.id, name)}
                                                        className="w-full px-3 py-2 text-left text-custom-primary hover:bg-custom-surface-alt focus:bg-custom-surface-alt focus:outline-none transition-colors cursor-pointer"
                                                    >
                                                        {name}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
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
                                            className="w-full bg-custom-surface-alt border border-custom rounded px-3 py-2 text-custom-primary text-center focus:outline-none focus:border-custom-primary"
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
                                            className="w-full bg-custom-surface-alt border border-custom rounded px-3 py-2 text-custom-primary text-center focus:outline-none focus:border-custom-primary"
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
                                            className="text-red-400 hover:text-red-300 hover:bg-red-900/20 p-2 rounded transition-colors cursor-pointer"
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

                {/* Actions Row - Total and Buttons */}
                <div className="flex justify-between items-center mb-6">
                    {/* Add Player Button */}
                    <button
                        onClick={addPlayer}
                        className="bg-custom-surface hover:bg-custom-border text-custom-primary px-4 py-2 rounded flex items-center gap-2 transition-colors cursor-pointer"
                    >
                        <Plus size={16} />
                        Add Player
                    </button>

                    {/* Total Net Display */}
                    <div className="text-right">
                        <div className="text-lg font-semibold mb-1">
                            Total Net:{" "}
                            <span
                                className={`${
                                    getTotalNet() > 0
                                        ? "text-red-400"
                                        : getTotalNet() < 0
                                          ? "text-red-400"
                                          : "text-green-400"
                                }`}
                            >
                                {formatCurrency(getTotalNet())}
                            </span>
                        </div>
                        <div className="text-sm">{getBalanceMessage()}</div>
                    </div>
                </div>

                {/* Calculate Button */}
                <div className="flex justify-center">
                    <button
                        onClick={handleCalculate}
                        disabled={!canCalculate()}
                        className={`flex items-center gap-2 px-8 py-3 rounded-lg font-semibold transition-colors ${
                            canCalculate()
                                ? "bg-custom-primary hover:opacity-80 text-white cursor-pointer"
                                : "bg-gray-600 text-gray-400 cursor-not-allowed"
                        }`}
                    >
                        <Calculator size={20} />
                        Calculate
                    </button>
                </div>
            </main>

            <PayoutSummaryModal
                isOpen={showSummary}
                onClose={() => setShowSummary(false)}
                players={players}
                onSubmit={(gameTitle) => {
                    console.log('Game submitted:', gameTitle);
                    // Don't close the summary modal here
                    setShowPasswordModal(true)
                }}
            />

            <PasswordModal
                isOpen={showPasswordModal}
                onClose={() => setShowPasswordModal(false)}
                onSuccess={() => {
                    setShowPasswordModal(false);
                    // Only close the summary modal after successful password entry
                    setShowSummary(false);
                    alert('Game saved successfully!');
                    // TODO: Save to database
                    setPlayers([]); // Clear the form
                }}
                title="Confirm Submission"
            />

        </div>
    );
}