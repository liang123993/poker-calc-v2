// src/components/PayoutSummaryModal.tsx
import React, { useState } from 'react';
import { Player } from '@/types/player';

interface Transfer {
    from: string;
    to: string;
    amount: number;
}

interface PayoutSummaryModalProps {
    isOpen: boolean;
    onClose: () => void;
    players: Player[];
    onSubmit: (gameTitle: string) => void;
}

export default function PayoutSummaryModal({ 
    isOpen, 
    onClose, 
    players, 
    onSubmit 
}: PayoutSummaryModalProps) {
    const [gameTitle, setGameTitle] = useState('');
    
    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!gameTitle.trim()) {
            alert('Please enter a game title');
            return;
        }
        onSubmit(gameTitle.trim());
        setGameTitle(''); // Reset after submit
    };

    // Calculate optimal transfers
    const calculateOptimalTransfers = (): Transfer[] => {
        const debtors = players.filter(p => p.net < 0).map(p => ({ name: p.name, amount: Math.abs(p.net) }));
        const creditors = players.filter(p => p.net > 0).map(p => ({ name: p.name, amount: p.net }));
        
        const transfers: Transfer[] = [];
        
        // Sort by amount for optimal matching
        debtors.sort((a, b) => b.amount - a.amount);
        creditors.sort((a, b) => b.amount - a.amount);
        
        let i = 0, j = 0;
        
        while (i < debtors.length && j < creditors.length) {
            const debt = debtors[i].amount;
            const credit = creditors[j].amount;
            const transferAmount = Math.min(debt, credit);
            
            if (transferAmount > 0.01) { // Avoid tiny transfers due to floating point
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

    const transfers = calculateOptimalTransfers();

    const formatCurrency = (amount: number) => {
        return `$${Math.abs(amount).toFixed(2)}`;
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-custom-background rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-custom">
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
                
                {/* Game Title Input */}
                <div className="mb-6 p-4 bg-custom-surface rounded-lg border border-custom">
                    <label className="block text-sm font-medium text-custom-primary mb-2">
                        Game Title
                    </label>
                    <input
                        type="text"
                        value={gameTitle}
                        onChange={(e) => setGameTitle(e.target.value)}
                        className="w-full bg-custom-background border border-custom rounded px-3 py-2 text-custom-primary placeholder-custom-secondary focus:outline-none focus:border-custom-primary"
                        placeholder="eg. Edwin's House - 69/69/69"
                        required
                    />
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
                            </tr>
                        </thead>
                        <tbody>
                            {players
                                .sort((a, b) => b.net - a.net)
                                .map((player, index) => (
                                    <tr key={player.id} className={`border-t border-custom ${index % 2 === 1 ? 'bg-custom-surface-alt' : ''}`}>
                                        <td className="py-3 px-4 text-custom-primary font-semibold">#{index + 1}</td>
                                        <td className="py-3 px-4 text-custom-primary">{player.name}</td>
                                        <td className="py-3 px-4 text-center text-custom-primary">{formatCurrency(player.buyIn)}</td>
                                        <td className="py-3 px-4 text-center text-custom-primary">{formatCurrency(player.cashOut)}</td>
                                        <td className={`py-3 px-4 text-center font-semibold ${
                                            player.net > 0 ? 'text-green-400' : 
                                            player.net < 0 ? 'text-red-400' : 
                                            'text-gray-400'
                                        }`}>
                                            {player.net >= 0 ? '+' : '-'}{formatCurrency(player.net)}
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>

                {/* Payment Instructions */}
                {transfers.length > 0 && (
                    <div className="mb-6 p-4 bg-custom-surface rounded-lg border border-custom">
                        <h4 className="text-lg font-semibold text-custom-primary mb-3">Payment Instructions</h4>
                        <div className="space-y-2">
                            {transfers.map((transfer, index) => (
                                <div key={index} className="flex items-center justify-between bg-custom-background p-3 rounded border border-custom">
                                    <span className="text-custom-primary">
                                        <span className="font-semibold text-red-400">{transfer.from}</span>
                                        {' pays '}
                                        <span className="font-semibold text-green-400">{transfer.to}</span>
                                    </span>
                                    <span className="font-bold text-custom-primary text-lg">
                                        {formatCurrency(transfer.amount)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Modal Actions */}
                <div className="flex justify-center gap-4">
                    <button
                        onClick={onClose}
                        className="bg-gray-600 hover:bg-gray-500 text-white px-6 py-2 rounded transition-colors"
                    >
                        Close
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="bg-custom-primary hover:opacity-80 text-white px-6 py-2 rounded transition-colors"
                    >
                        Submit Game
                    </button>
                </div>
            </div>
        </div>
    );
}