// src/app/leaderboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import GroupSelector from "@/components/GroupSelector";
import { useGroupSelection } from "@/hooks/useGroupSelection";
import { LeaderboardEntry } from "@/types/player";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function LeaderboardPage() {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Group selection
    const { 
        groups, 
        selectedGroupId, 
        selectedGroup, 
        setSelectedGroupId, 
        loading: groupsLoading 
    } = useGroupSelection('leaderboard-selected-group');

    useEffect(() => {
        if (selectedGroupId) {
            fetchLeaderboard();
        }
    }, [selectedGroupId]);

    const fetchLeaderboard = async () => {
        if (!selectedGroupId) return;
        
        try {
            setLoading(true);
            const url = `/api/leaderboard?groupId=${selectedGroupId}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error('Failed to fetch leaderboard');
            }
            
            const data = await response.json();
            setLeaderboard(data.leaderboard || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return `$${Math.abs(amount).toFixed(2)}`;
    };

    const getRankIcon = (rank: number) => {
        return <span className="text-custom-primary">#{rank}</span>;
    };

    const getRankChangeIcon = (rankChange: string, previousRank: number | null, currentRank: number) => {
        switch (rankChange) {
            case 'up':
                return (
                    <div className="flex items-center justify-center gap-1 text-custom-primary">
                        <TrendingUp size={16} className="text-green-400" />
                    </div>
                );
            case 'down':
                return (
                    <div className="flex items-center justify-center gap-1 text-custom-primary">
                        <TrendingDown size={16} className="text-red-400" />
                    </div>
                );
            case 'new':
                return (
                    <div className="flex items-center justify-center gap-1 text-custom-primary">
                        <span className="text-xs font-semibold">NEW</span>
                    </div>
                );
            case 'same':
            default:
                return (
                    <div className="flex items-center justify-center gap-1 text-custom-primary">
                        <span className="text-sm">-</span>
                    </div>
                );
        }
    };

    const getProfitColorClass = (profit: number) => {
        if (profit > 0) return 'text-green-400';
        if (profit < 0) return 'text-red-400';
        return 'text-gray-400';
    };

    if (groupsLoading) {
        return (
            <div className="min-h-screen bg-custom-background text-custom-primary">
                <Header currentPage="leaderboard" />
                <main className="px-6 py-2">
                    <div className="flex justify-center items-center h-64">
                        <div className="text-custom-secondary">Loading...</div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-custom-background text-custom-primary">
            <Header currentPage="leaderboard" />
            <main className="px-6 py-2">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-custom-primary">
                        Leaderboard
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
                            onClick={fetchLeaderboard}
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
                            Please select a group above to view the leaderboard. If no groups exist, 
                            <a href="/groups" className="text-yellow-100 underline ml-1">create one first</a>.
                        </p>
                    </div>
                )}

                {selectedGroupId && (
                    <>
                        {loading ? (
                            <div className="flex justify-center items-center h-64">
                                <div className="text-custom-secondary">Loading leaderboard...</div>
                            </div>
                        ) : error ? (
                            <div className="flex justify-center items-center h-64">
                                <div className="text-red-400">Error: {error}</div>
                            </div>
                        ) : leaderboard.length === 0 ? (
                            <div className="text-center py-22">
                                <div className="text-custom-secondary text-lg mb-4">
                                    No players on the leaderboard yet
                                </div>
                                <div className="text-custom-secondary">
                                    {selectedGroup ? `Add some games to "${selectedGroup.name}" to see rankings!` : 'Play some games to see rankings!'}
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="bg-custom-background border border-custom rounded-lg overflow-hidden">
                                    <table className="w-full table-fixed">
                                        <colgroup>
                                            <col className="w-1/5" />
                                            <col className="w-1/5" />
                                            <col className="w-1/5" />
                                            <col className="w-1/5" />
                                            <col className="w-1/5" />
                                        </colgroup>
                                        <thead className="bg-custom-surface">
                                            <tr>
                                                <th className="text-center py-2 px-4 font-medium text-custom-primary">
                                                    Rank Change
                                                </th>
                                                <th className="text-center py-2 px-4 font-medium text-custom-primary">
                                                    Rank
                                                </th>
                                                <th className="text-center py-2 px-4 font-medium text-custom-primary">
                                                    Player
                                                </th>
                                                <th className="text-center py-2 px-4 font-medium text-custom-primary">
                                                    Games Played
                                                </th>
                                                <th className="text-center py-2 px-4 font-medium text-custom-primary">
                                                    Total Profit/Loss
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {leaderboard.map((player, index) => (
                                                <tr 
                                                    key={player.playerName} 
                                                    className={`border-t border-custom ${
                                                        index % 2 === 1 ? 'bg-custom-surface-alt' : ''
                                                    }`}
                                                >
                                                    <td className="py-2 px-4 text-center">
                                                        {getRankChangeIcon(player.rankChange, player.previousRank, player.rank)}
                                                    </td>
                                                    <td className="py-2 px-4 text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            {getRankIcon(player.rank)}
                                                        </div>
                                                    </td>
                                                    <td className="py-2 px-4 text-center">
                                                        <div className="text-custom-primary">
                                                            {player.playerName}
                                                        </div>
                                                    </td>
                                                    <td className="py-2 px-4 text-center text-custom-primary">
                                                        {player.gamesPlayed}
                                                    </td>
                                                    <td className={`py-2 px-4 text-center text-lg ${getProfitColorClass(player.totalProfit)}`}>
                                                        {player.totalProfit >= 0 ? '+' : '-'}{formatCurrency(player.totalProfit)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="mt-6 text-center text-custom-secondary text-sm">
                                    Showing {leaderboard.length} players
                                    {selectedGroup && <span> in "{selectedGroup.name}"</span>}
                                </div>
                            </>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}