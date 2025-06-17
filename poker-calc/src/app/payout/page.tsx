"use client";

import { useState, useEffect } from "react";
import { Player, Transfer } from "@/types/player";
import Header from "@/components/Header";
import { Plus, Trash2, Calculator } from "lucide-react";
import PayoutSummaryModal from "@/components/PayoutSummaryModal";
import PasswordModal from "@/components/PasswordModal";

export default function PayoutPage() {
    const [players, setPlayers] = useState<Player[]>([]);
    const [showSummary, setShowSummary] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
    const [searchTerms, setSearchTerms] = useState<{ [key: string]: string }>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [pendingGameTitle, setPendingGameTitle] = useState<string>("");
    const [previousNames, setPreviousNames] = useState<string[]>([]);

    // Fetch player names from database
    useEffect(() => {
        fetchPlayerNames();
    }, []);

    const fetchPlayerNames = async () => {
        try {
            const response = await fetch('/api/players/names');
            if (response.ok) {
                const data = await response.json();
                setPreviousNames(data.names || []);
            }
        } catch (error) {
            console.error('Error fetching player names:', error);
        }
    };

    // add player
    const addPlayer = () => {
        const newPlayer: Player = {
            id: Date.now().toString(),
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

    // Calculate optimal transfers
    const calculateOptimalTransfers = (): Transfer[] => {
        const debtors = players.filter(p => p.net < 0).map(p => ({ name: p.name, amount: Math.abs(p.net) }));
        const creditors = players.filter(p => p.net > 0).map(p => ({ name: p.name, amount: p.net }));
        
        const transfers: Transfer[] = [];
        
        debtors.sort((a, b) => b.amount - a.amount);
        creditors.sort((a, b) => b.amount - a.amount);
        
        let i = 0, j = 0;
        
        while (i < debtors.length && j < creditors.length) {
            const debt = debtors[i].amount;
            const credit = creditors[j].amount;
            const transferAmount = Math.min(debt, credit);
            
            if (transferAmount > 0.01) {
                transfers.push({
                    from: debtors[i].name,
                    to: creditors[j].name,
                    amount: Math.round(transferAmount * 100) / 100
                });
            }
            
            debtors[i].amount -= transferAmount;
            creditors[j].amount -= transferAmount;
            
            if (debtors[i].amount < 0.01) i++;
            if (creditors[j].amount < 0.01) j++;
        }
        
        return transfers;
    };

    // calcs every players net summed tgt
    const getTotalNet = () => {
        return players.reduce((sum, player) => sum + player.net, 0);
    };

    const isGameBalanced = () => {
        return Math.abs(getTotalNet()) < 0.01;
    };

    // Check if we can calculate
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
        setShowSummary(true);
    };

    // Save game to database
    const saveGameToDatabase = async (gameTitle: string) => {
        setIsSubmitting(true);
        try {
            const transfers = calculateOptimalTransfers();
            
            const gameData = {
                title: gameTitle,
                players: players.map(player => ({
                    name: player.name,
                    buyIn: player.buyIn,
                    cashOut: player.cashOut,
                    net: player.net
                })),
                transfers
            };

            const response = await fetch('/api/games', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(gameData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to save game');
            }

            const result = await response.json();
            console.log('Game saved successfully:', result);
            
            // Refresh player names after successful save
            await fetchPlayerNames();
            
            return result;
        } catch (error) {
            console.error('Error saving game:', error);
            throw error;
        } finally {
            setIsSubmitting(false);
        }
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
            <Header currentPage="payout" />
            <main className="px-6 py-8">
                <h2 className="text-2xl font-bold mb-6 text-custom-primary">
                    Payout Entry
                </h2>
                
                <div className="bg-custom-background border border-custom rounded-lg overflow-hidden mb-6">
                    <table className="w-full">
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

                        <tbody>
                            {players.map((player) => (
                                <tr key={player.id} className="border-t border-custom">
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
                                        
                                        {dropdownOpen === player.id && getFilteredNames(player.id).length > 0 && (
                                            <div className="fixed z-50 bg-custom-surface-alt border border-custom rounded-md shadow-lg max-h-40 overflow-y-auto"
                                                style={(() => {
                                                    const element = document.getElementById(`player-input-${player.id}`);
                                                    if (!element) return {};
                                                    const rect = element.getBoundingClientRect();
                                                    return {
                                                        top: `${rect.bottom + window.scrollY + 4}px`,
                                                        left: `${rect.left + window.scrollX}px`,
                                                        width: `${rect.width}px`
                                                    };
                                                })()}>
                                                {getFilteredNames(player.id).map((name, index) => (
                                                    <button
                                                        key={index}
                                                        type="button"
                                                        onClick={() => handleNameSelect(player.id, name)}
                                                        className="w-full px-3 py-2 text-left text-custom-primary hover:bg-custom-surface focus:bg-custom-surface focus:outline-none transition-colors cursor-pointer"
                                                    >
                                                        {name}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </td>
                                    <td className="py-3 px-4">
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={player.buyIn || ""}
                                            onChange={(e) =>
                                                updatePlayer(
                                                    player.id,
                                                    "buyIn",
                                                    parseFloat(e.target.value) || 0
                                                )
                                            }
                                            className="w-full bg-custom-surface-alt border border-custom rounded px-3 py-2 text-custom-primary text-center focus:outline-none focus:border-custom-primary"
                                            placeholder="0"
                                        />
                                    </td>
                                    <td className="py-3 px-4">
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={player.cashOut || ""}
                                            onChange={(e) =>
                                                updatePlayer(
                                                    player.id,
                                                    "cashOut",
                                                    parseFloat(e.target.value) || 0
                                                )
                                            }
                                            className="w-full bg-custom-surface-alt border border-custom rounded px-3 py-2 text-custom-primary text-center focus:outline-none focus:border-custom-primary"
                                            placeholder="0"
                                        />
                                    </td>
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
                                    <td className="py-3 px-4 text-center">
                                        <button
                                            onClick={() => removePlayer(player.id)}
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

                <div className="flex justify-between items-center mb-6">
                    <button
                        onClick={addPlayer}
                        className="bg-custom-surface hover:bg-custom-border text-custom-primary px-4 py-2 rounded flex items-center gap-2 transition-colors cursor-pointer"
                    >
                        <Plus size={16} />
                        Add Player
                    </button>

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

                <div className="flex justify-center">
                    <button
                        onClick={handleCalculate}
                        disabled={!canCalculate() || isSubmitting}
                        className={`flex items-center gap-2 px-8 py-3 rounded-lg font-semibold transition-colors ${
                            canCalculate() && !isSubmitting
                                ? "bg-custom-primary hover:opacity-80 text-white cursor-pointer"
                                : "bg-gray-600 text-gray-400 cursor-not-allowed"
                        }`}
                    >
                        <Calculator size={20} />
                        {isSubmitting ? "Saving..." : "Calculate"}
                    </button>
                </div>
            </main>

            <PayoutSummaryModal
                isOpen={showSummary}
                onClose={() => setShowSummary(false)}
                players={players}
                onSubmit={(gameTitle) => {
                    setPendingGameTitle(gameTitle);
                    setShowPasswordModal(true);
                }}
            />

            <PasswordModal
                isOpen={showPasswordModal}
                onClose={() => setShowPasswordModal(false)}
                onSuccess={async () => {
                    setShowPasswordModal(false);
                    try {
                        await saveGameToDatabase(pendingGameTitle);
                        setShowSummary(false);
                        alert('Game saved successfully!');
                        setPlayers([]); // Clear the form
                        setPendingGameTitle("");
                    } catch (error) {
                        alert('Failed to save game. Please try again.');
                        setShowSummary(true); // Keep summary open on error
                    }
                }}
                title="Confirm Submission"
            />
        </div>
    );
}