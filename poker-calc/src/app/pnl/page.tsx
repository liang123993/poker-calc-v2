// src/app/pnl/page.tsx
"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import GroupSelector from "@/components/GroupSelector";
import PnlChart, { PnlPoint } from "@/components/PnlChart";
import { useGroupSelection } from "@/hooks/useGroupSelection";

export default function PnlPage() {
    const [names, setNames] = useState<string[]>([]);
    const [selectedName, setSelectedName] = useState<string>("");
    const [points, setPoints] = useState<PnlPoint[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const {
        groups,
        selectedGroupId,
        selectedGroup,
        setSelectedGroupId,
        loading: groupsLoading
    } = useGroupSelection('pnl-selected-group');

    // Load player names whenever the group changes
    useEffect(() => {
        if (!selectedGroupId) return;
        setPoints([]);
        setSelectedName("");

        fetch(`/api/players/names?groupId=${selectedGroupId}`)
            .then(res => res.json())
            .then(data => setNames(data.names || []))
            .catch(() => setError('Failed to load players'));
    }, [selectedGroupId]);

    // Load the selected player's PnL history
    useEffect(() => {
        if (!selectedGroupId || !selectedName) return;

        setLoading(true);
        setError(null);
        fetch(`/api/players/pnl?groupId=${selectedGroupId}&name=${encodeURIComponent(selectedName)}`)
            .then(res => res.json())
            .then(data => setPoints(data.points || []))
            .catch(() => setError('Failed to load profit history'))
            .finally(() => setLoading(false));
    }, [selectedGroupId, selectedName]);

    const money = (v: number) => `${v >= 0 ? '+' : '-'}$${Math.abs(v).toFixed(2)}`;
    const colorFor = (v: number) => v > 0 ? 'text-green-400' : v < 0 ? 'text-red-400' : 'text-gray-400';

    const total = points.length ? points[points.length - 1].cumulative : 0;
    const best = points.length ? Math.max(...points.map(p => p.net)) : 0;
    const worst = points.length ? Math.min(...points.map(p => p.net)) : 0;

    return (
        <div className="min-h-screen bg-custom-background text-custom-primary">
            <Header currentPage="pnl" />
            <main className="px-4 py-2 sm:px-6">
                <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:justify-between sm:items-center">
                    <h2 className="text-2xl font-bold text-custom-primary">Profit / Loss</h2>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                        <GroupSelector
                            groups={groups}
                            selectedGroupId={selectedGroupId}
                            onGroupChange={setSelectedGroupId}
                            loading={groupsLoading}
                            label="Filter by Group"
                            placeholder="Select a group to view..."
                        />
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2 w-full sm:w-auto">
                            <span className="text-sm text-custom-secondary">Player:</span>
                            <select
                                value={selectedName}
                                onChange={(e) => setSelectedName(e.target.value)}
                                disabled={!selectedGroupId || names.length === 0}
                                className="bg-custom-surface border border-custom text-custom-primary rounded px-3 py-2 focus:outline-none focus:border-custom-primary w-full sm:min-w-[200px] disabled:opacity-50"
                            >
                                <option value="">Select a player...</option>
                                {names.map(name => (
                                    <option key={name} value={name}>{name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {!selectedGroupId && !groupsLoading && (
                    <div className="mb-6 p-4 bg-yellow-900/20 border border-yellow-600 rounded-lg">
                        <p className="text-yellow-200">
                            Please select a group above to view profit history. If no groups exist,
                            <a href="/groups" className="text-yellow-100 underline ml-1">create one first</a>.
                        </p>
                    </div>
                )}

                {error && <div className="text-red-400 py-4">Error: {error}</div>}

                {selectedGroupId && !selectedName && (
                    <div className="text-center py-20 text-custom-secondary">
                        Select a player to see how their profit changed game by game
                        {selectedGroup && <span> in &quot;{selectedGroup.name}&quot;</span>}.
                    </div>
                )}

                {loading && <div className="text-center py-20 text-custom-secondary">Loading...</div>}

                {!loading && selectedName && points.length === 0 && !error && (
                    <div className="text-center py-20 text-custom-secondary">
                        No games found for {selectedName} in this group.
                    </div>
                )}

                {!loading && points.length > 0 && (
                    <>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                            {[
                                { label: 'Total', value: total },
                                { label: 'Best Game', value: best },
                                { label: 'Worst Game', value: worst },
                            ].map(stat => (
                                <div key={stat.label} className="bg-custom-surface border border-custom rounded-lg p-3">
                                    <div className="text-custom-secondary text-sm">{stat.label}</div>
                                    <div className={`text-lg ${colorFor(stat.value)}`}>{money(stat.value)}</div>
                                </div>
                            ))}
                            <div className="bg-custom-surface border border-custom rounded-lg p-3">
                                <div className="text-custom-secondary text-sm">Games</div>
                                <div className="text-lg text-custom-primary">{points.length}</div>
                            </div>
                        </div>

                        <div className="bg-custom-surface border border-custom rounded-lg p-3 sm:p-4">
                            <PnlChart points={points} />
                        </div>

                        <div className="mt-6 bg-custom-background border border-custom rounded-lg overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-custom-surface">
                                    <tr>
                                        <th className="text-left py-2 px-4 font-medium">Game</th>
                                        <th className="text-right py-2 px-4 font-medium">Net</th>
                                        <th className="text-right py-2 px-4 font-medium">Running Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {points.slice().reverse().map((p, i) => (
                                        <tr key={`${p.gameId}-${i}`} className={`border-t border-custom ${i % 2 === 1 ? 'bg-custom-surface-alt' : ''}`}>
                                            <td className="py-2 px-4">
                                                <div className="text-custom-primary">{p.title}</div>
                                                <div className="text-custom-secondary text-xs">{new Date(p.date).toLocaleDateString()}</div>
                                            </td>
                                            <td className={`py-2 px-4 text-right ${colorFor(p.net)}`}>{money(p.net)}</td>
                                            <td className={`py-2 px-4 text-right ${colorFor(p.cumulative)}`}>{money(p.cumulative)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
