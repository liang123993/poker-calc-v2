// src/components/PayoutSummaryModal.tsx
import React from 'react';
import { Player } from '@/types/player';

interface PayoutSummaryModalProps {
    isOpen: boolean;
    onClose: () => void;
    players: Player[];
    onSubmit: () => void;
}

export default function PayoutSummaryModal({ 
    isOpen, 
    onClose, 
    players, 
    onSubmit 
}: PayoutSummaryModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-custom-surface rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-custom">
                {/* Modal Header */}
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold text-custom-primary">Payout Summary</h3>
                    <button 
                        onClick={onClose}
                        className="text-custom-secondary hover:text-custom-primary text-2xl"
                    >
                        ×
                    </button>
                </div>

                {/* Results Table */}
                <div className="overflow-x-auto mb-6">
                    <table className="w-full">
                        <thead className="bg-custom-surface-alt">
                            <tr>
                                <th className="text-left py-3 px-4 font-medium text-custom-primary">Rank</th>
                                <th className="text-left py-3 px-4 font-medium text-custom-primary">Name</th>
                                <th className="text-center py-3 px-4 font-medium text-custom-primary">Buy-in</th>
                                <th className="text-center py-3 px-4 font-medium text-custom-primary">Cash-out</th>
                                <th className="text-center py-3 px-4 font-medium text-custom-primary">Net</th>
                                <th className="text-center py-3 px-4 font-medium text-custom-primary">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {players
                                .sort((a, b) => b.net - a.net)
                                .map((player, index) => (
                                    <tr key={player.id} className="border-t border-custom">
                                        <td className="py-3 px-4 text-custom-primary font-semibold">#{index + 1}</td>
                                        <td className="py-3 px-4 text-custom-primary">{player.name}</td>
                                        <td className="py-3 px-4 text-center text-custom-primary">${player.buyIn.toFixed(2)}</td>
                                        <td className="py-3 px-4 text-center text-custom-primary">${player.cashOut.toFixed(2)}</td>
                                        <td className={`py-3 px-4 text-center font-semibold ${
                                            player.net > 0 ? 'text-green-400' : 
                                            player.net < 0 ? 'text-red-400' : 
                                            'text-gray-400'
                                        }`}>
                                            ${player.net.toFixed(2)}
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            {player.net > 0 && (
                                                <span className="bg-green-900/30 text-green-400 px-3 py-1 rounded-full text-sm">
                                                    -
                                                </span>
                                            )}
                                            {player.net < 0 && (
                                                <span className="bg-red-900/30 text-red-400 px-3 py-1 rounded-full text-sm">
                                                    Pay ${Math.abs(player.net).toFixed(2)}
                                                </span>
                                            )}
                                            {player.net === 0 && (
                                                <span className="bg-gray-900/30 text-gray-400 px-3 py-1 rounded-full text-sm">
                                                    -
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>

                {/* Modal Actions */}
                <div className="flex justify-center gap-4">
                    <button
                        onClick={onClose}
                        className="bg-gray-600 hover:bg-gray-500 text-white px-6 py-2 rounded transition-colors"
                    >
                        Close
                    </button>
                    <button
                        onClick={onSubmit}
                        className="bg-custom-primary hover:opacity-80 text-white px-6 py-2 rounded transition-colors"
                    >
                        Submit Game
                    </button>
                </div>
            </div>
        </div>
    );
}