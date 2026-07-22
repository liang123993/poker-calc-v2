// src/app/history/page.tsx
"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import GroupSelector from "@/components/GroupSelector";
import { useGroupSelection } from "@/hooks/useGroupSelection";
import PasswordModal from "@/components/PasswordModal";
import EditGameModal from "@/components/EditGameModal";
import { Game, Player, GameWithPlayers } from "@/types/player";
import { Search, Eye, Edit3, Trash2, Users, DollarSign } from "lucide-react";

interface GameDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    game: GameWithPlayers | null;
    onEdit: () => void;
    onDelete: () => void;
}

function GameDetailsModal({ isOpen, onClose, game, onEdit, onDelete }: GameDetailsModalProps) {
    if (!isOpen || !game) return null;

    const formatCurrency = (amount: number) => {
        return `$${Math.abs(amount).toFixed(2)}`;
    };

    const getProfitColorClass = (profit: number) => {
        if (profit > 0) return 'text-green-400';
        if (profit < 0) return 'text-red-400';
        return 'text-gray-400';
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-custom-background rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-custom">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold text-custom-primary">{game.title}</h3>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onEdit}
                            className="text-blue-400 hover:text-blue-300 p-2 rounded transition-colors cursor-pointer"
                            title="Edit game"
                        >
                            <Edit3 size={20} />
                        </button>
                        <button 
                            onClick={onClose}
                            className="text-custom-secondary hover:text-custom-primary text-2xl cursor-pointer"
                        >
                            ×
                        </button>
                    </div>
                </div>

                <div className="mb-4 text-sm text-custom-secondary">
                    Game Date: {new Date(game.createdAt).toLocaleDateString()} at {new Date(game.createdAt).toLocaleTimeString()}
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full table-fixed">
                        <colgroup>
                            <col className="w-1/6" />
                            <col className="w-1/3" />
                            <col className="w-1/6" />
                            <col className="w-1/6" />
                            <col className="w-1/6" />
                        </colgroup>
                        <thead className="bg-custom-surface">
                            <tr>
                                <th className="text-center py-3 px-4 font-medium text-custom-primary">Rank</th>
                                <th className="text-center py-3 px-4 font-medium text-custom-primary">Name</th>
                                <th className="text-center py-3 px-4 font-medium text-custom-primary">Buy-in</th>
                                <th className="text-center py-3 px-4 font-medium text-custom-primary">Cash-out</th>
                                <th className="text-center py-3 px-4 font-medium text-custom-primary">Net</th>
                            </tr>
                        </thead>
                        <tbody>
                            {game.players
                                .sort((a, b) => (a.rank || 0) - (b.rank || 0))
                                .map((player, index) => (
                                    <tr key={player.id} className={`border-t border-custom ${index % 2 === 1 ? 'bg-custom-surface-alt' : ''}`}>
                                        <td className="py-3 px-4 text-center text-custom-primary font-semibold">#{player.rank}</td>
                                        <td className="py-3 px-4 text-center text-custom-primary">{player.name}</td>
                                        <td className="py-3 px-4 text-center text-custom-primary">{formatCurrency(player.buyIn)}</td>
                                        <td className="py-3 px-4 text-center text-custom-primary">{formatCurrency(player.cashOut)}</td>
                                        <td className={`py-3 px-4 text-center font-semibold ${getProfitColorClass(player.net)}`}>
                                            {player.net >= 0 ? '+' : '-'}{formatCurrency(player.net)}
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>

                <div className="mt-6 flex justify-between items-center">
                    <div className="text-custom-secondary">
                        Total Amount: <span className="text-custom-primary font-semibold">{formatCurrency(game.totalAmount)}</span>
                    </div>
                    <button
                        onClick={onDelete}
                        className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded transition-colors cursor-pointer flex items-center gap-2"
                    >
                        <Trash2 size={16} />
                        Delete Game
                    </button>
                </div>
            </div>
        </div>
    );
}

interface ConfirmDeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    gameName: string;
}

function ConfirmDeleteModal({ isOpen, onClose, onConfirm, gameName }: ConfirmDeleteModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
            <div className="bg-custom-surface rounded-lg p-6 max-w-md w-full border border-custom">
                <h3 className="text-lg font-semibold mb-4 text-custom-primary">Confirm Delete</h3>
                <p className="text-custom-secondary mb-6">
                    Are you sure you want to delete the game "{gameName}"? This action cannot be undone.
                </p>
                <div className="flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded transition-colors cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded transition-colors cursor-pointer"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function GameHistoryPage() {
    const [games, setGames] = useState<GameWithPlayers[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedGame, setSelectedGame] = useState<GameWithPlayers | null>(null);
    const [showDetails, setShowDetails] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [pendingAction, setPendingAction] = useState<'edit' | 'delete' | null>(null);

    // Group selection
    const { 
        groups, 
        selectedGroupId, 
        selectedGroup, 
        setSelectedGroupId, 
        loading: groupsLoading 
    } = useGroupSelection('history-selected-group');

    useEffect(() => {
        if (selectedGroupId) {
            fetchGames();
        }
    }, [selectedGroupId]);

    const fetchGames = async () => {
        if (!selectedGroupId) return;
        
        try {
            setLoading(true);
            const url = `/api/games?limit=1000&groupId=${selectedGroupId}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error('Failed to fetch games');
            }
            
            const data = await response.json();
            
            // Fetch players for each game
            const gamesWithPlayers = await Promise.all(
                data.games.map(async (game: Game) => {
                    try {
                        const playersResponse = await fetch(`/api/games/${game._id}/players`);
                        const playersData = playersResponse.ok ? await playersResponse.json() : { players: [] };
                        return {
                            ...game,
                            players: playersData.players || []
                        };
                    } catch (error) {
                        console.error(`Error fetching players for game ${game._id}:`, error);
                        return {
                            ...game,
                            players: []
                        };
                    }
                })
            );
            
            setGames(gamesWithPlayers);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const filteredGames = games.filter(game => {
        if (!searchTerm) return true;
        
        const searchLower = searchTerm.toLowerCase();
        
        // Search by game title
        if (game.title.toLowerCase().includes(searchLower)) return true;
        
        // Search by player names
        return game.players.some(player => 
            player.name.toLowerCase().includes(searchLower)
        );
    });

    const formatCurrency = (amount: number) => {
        return `$${amount.toFixed(2)}`;
    };

    const handleShowDetails = (game: GameWithPlayers) => {
        setSelectedGame(game);
        setShowDetails(true);
    };

    const handleEdit = () => {
        setPendingAction('edit');
        setShowPasswordModal(true);
    };

    const handleDelete = () => {
        setPendingAction('delete');
        setShowPasswordModal(true);
    };

    const handlePasswordSuccess = () => {
        setShowPasswordModal(false);
        
        if (pendingAction === 'edit') {
            setShowEditModal(true);
        } else if (pendingAction === 'delete') {
            setShowDeleteConfirm(true);
        }
        
        setPendingAction(null);
    };

    const handleSaveEdit = async (updatedGame: GameWithPlayers) => {
        try {
            const response = await fetch(`/api/games/${updatedGame._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: updatedGame.title,
                    players: updatedGame.players.map(player => ({
                        name: player.name,
                        buyIn: player.buyIn,
                        cashOut: player.cashOut,
                        net: player.net
                    }))
                }),
            });
            
            if (!response.ok) {
                throw new Error('Failed to update game');
            }
            
            const result = await response.json();
            
            // Update the game in our local state
            setGames(games.map(game => 
                game._id === updatedGame._id ? result.game : game
            ));
            
            // Also update selectedGame if it's the same game
            if (selectedGame?._id === updatedGame._id) {
                setSelectedGame(result.game);
            }
            
            setShowEditModal(false);
            alert('Game updated successfully!');
            
        } catch (error) {
            alert('Failed to update game. Please try again.');
        }
    };

    const handleConfirmDelete = async () => {
        if (!selectedGame) return;
        
        try {
            const response = await fetch(`/api/games/${selectedGame._id}`, {
                method: 'DELETE',
            });
            
            if (!response.ok) {
                throw new Error('Failed to delete game');
            }
            
            setShowDeleteConfirm(false);
            setShowDetails(false);
            setSelectedGame(null);
            await fetchGames(); // Refresh the list
            alert('Game deleted successfully!');
        } catch (error) {
            alert('Failed to delete game. Please try again.');
        }
    };

    if (groupsLoading) {
        return (
            <div className="min-h-screen bg-custom-background text-custom-primary">
                <Header currentPage="history" />
                <main className="px-6 py-8">
                    <div className="flex justify-center items-center h-64">
                        <div className="text-custom-secondary">Loading...</div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-custom-background text-custom-primary">
            <Header currentPage="history" />
            <main className="px-6 py-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-custom-primary">
                        Game History
                    </h2>
                    <div className="flex items-center gap-4">
                        <GroupSelector
                            groups={groups}
                            selectedGroupId={selectedGroupId}
                            onGroupChange={setSelectedGroupId}
                            loading={groupsLoading}
                            label="Filter by Group"
                            placeholder="Select a group to view..."
                        />
                        <button
                            onClick={fetchGames}
                            disabled={!selectedGroupId}
                            className="bg-custom-primary hover:opacity-80 text-white px-4 py-2 rounded transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Refresh
                        </button>
                    </div>
                </div>

                {!selectedGroupId && !groupsLoading && (
                    <div className="mb-6 p-4 bg-yellow-900/20 border border-yellow-600 rounded-lg">
                        <p className="text-yellow-200">
                            Please select a group above to view game history. If no groups exist, 
                            <a href="/groups" className="text-yellow-100 underline ml-1">create one first</a>.
                        </p>
                    </div>
                )}

                {selectedGroupId && (
                    <>
                        {/* Search Bar */}
                        <div className="mb-6">
                            <div className="relative max-w-md">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-custom-secondary" size={20} />
                                <input
                                    type="text"
                                    placeholder="Search by player name or game title..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-custom-surface border border-custom rounded-lg pl-10 pr-4 py-2 text-custom-primary placeholder-custom-secondary focus:outline-none focus:border-custom-primary"
                                />
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex justify-center items-center h-64">
                                <div className="text-custom-secondary">Loading game history...</div>
                            </div>
                        ) : error ? (
                            <div className="flex justify-center items-center h-64">
                                <div className="text-red-400">Error: {error}</div>
                            </div>
                        ) : filteredGames.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="text-custom-secondary text-lg mb-4">
                                    {searchTerm ? 'No games found matching your search' : 'No games found'}
                                </div>
                                {searchTerm ? (
                                    <button
                                        onClick={() => setSearchTerm('')}
                                        className="text-custom-primary hover:opacity-80 underline"
                                    >
                                        Clear search
                                    </button>
                                ) : selectedGroup ? (
                                    <div className="text-custom-secondary">
                                        No games in "{selectedGroup.name}" yet. <a href="/payout" className="text-custom-primary underline">Add some games!</a>
                                    </div>
                                ) : null}
                            </div>
                        ) : (
                            <>
                                <div className="bg-custom-background border border-custom rounded-lg overflow-hidden">
                                    <table className="w-full table-fixed">
                                        <colgroup>
                                            <col className="w-2/5" />
                                            <col className="w-1/5" />
                                            <col className="w-1/5" />
                                            <col className="w-1/5" />
                                        </colgroup>
                                        <thead className="bg-custom-surface">
                                            <tr>
                                                <th className="text-center py-4 px-4 font-medium text-custom-primary">Title</th>
                                                <th className="text-center py-4 px-4 font-medium text-custom-primary">Players</th>
                                                <th className="text-center py-4 px-4 font-medium text-custom-primary">Total Amount</th>
                                                <th className="text-center py-4 px-4 font-medium text-custom-primary">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredGames.map((game, index) => (
                                                <tr key={game._id} className={`border-t border-custom ${index % 2 === 1 ? 'bg-custom-surface-alt' : ''}`}>
                                                    <td className="py-4 px-4 text-center">
                                                        <div className="font-semibold text-custom-primary">{game.title}</div>
                                                        <div className="text-sm text-custom-secondary">
                                                            {new Date(game.createdAt).toLocaleDateString()}
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4 text-center text-custom-primary">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <Users size={16} />
                                                            <span>{game.playerCount}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4 text-center text-custom-primary">
                                                        <span>{formatCurrency(game.totalAmount)}</span>
                                                    </td>
                                                    <td className="py-4 px-4 text-center">
                                                        <button
                                                            onClick={() => handleShowDetails(game)}
                                                            className="bg-custom-primary hover:opacity-80 text-white px-3 py-1 rounded transition-colors cursor-pointer flex items-center gap-1 mx-auto"
                                                        >
                                                            <Eye size={16} />
                                                            Show Details
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="mt-6 text-center text-custom-secondary text-sm">
                                    Showing {filteredGames.length} of {games.length} games
                                    {selectedGroup && <span> in "{selectedGroup.name}"</span>}
                                </div>
                            </>
                        )}
                    </>
                )}
            </main>

            <GameDetailsModal
                isOpen={showDetails}
                onClose={() => {
                    setShowDetails(false);
                    setSelectedGame(null);
                }}
                game={selectedGame}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />

            <EditGameModal
                isOpen={showEditModal}
                onClose={() => {
                    setShowEditModal(false);
                    setSelectedGame(null);
                }}
                game={selectedGame}
                onSave={handleSaveEdit}
            />

            <PasswordModal
                isOpen={showPasswordModal}
                onClose={() => {
                    setShowPasswordModal(false);
                    setPendingAction(null);
                }}
                onSuccess={handlePasswordSuccess}
                title={pendingAction === 'edit' ? 'Edit Game' : 'Delete Game'}
            />

            <ConfirmDeleteModal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleConfirmDelete}
                gameName={selectedGame?.title || ''}
            />
        </div>
    );
}