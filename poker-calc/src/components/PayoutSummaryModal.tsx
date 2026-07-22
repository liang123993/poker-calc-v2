// src/components/PayoutSummaryModal.tsx
import React, { useState } from 'react';
import { Player, Group } from '@/types/player';
import { Loader2 } from 'lucide-react';

interface Transfer {
    from: string;
    to: string;
    amount: number;
}

interface PayoutSummaryModalProps {
    isOpen: boolean;
    onClose: () => void;
    players: Player[];
    selectedGroup: Group | null;
    onSubmit: (gameTitle: string) => void;
    isSubmitting?: boolean; // Add this prop
}

export default function PayoutSummaryModal({ 
    isOpen, 
    onClose, 
    players, 
    selectedGroup,
    onSubmit,
    isSubmitting = false
}: PayoutSummaryModalProps) {
    const [gameTitle, setGameTitle] = useState('');
    
    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!gameTitle.trim()) {
            alert('Please enter a game title');
            return;
        }
        if (!selectedGroup) {
            alert('No group selected');
            return;
        }
        if (isSubmitting) {
            return; // Prevent double submission
        }
        onSubmit(gameTitle.trim());
        setGameTitle(''); // Reset after submit
    };

    const handleClose = () => {
        if (isSubmitting) {
            return; // Prevent closing during submission
        }
        onClose();
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
            <div className="bg-custom-background rounded-lg p-4 sm:p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-custom">
                {/* Modal Header */}
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold text-custom-primary">Payout Summary</h3>
                    <button 
                        onClick={handleClose}
                        disabled={isSubmitting}
                        className={`text-2xl transition-colors ${
                            isSubmitting 
                                ? 'text-gray-500 cursor-not-allowed' 
                                : 'text-custom-secondary hover:text-custom-primary cursor-pointer'
                        }`}
                    >
                        ×
                    </button>
                </div>
                
                {/* Loading overlay */}
                {isSubmitting && (
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-10 rounded-lg">
                        <div className="bg-custom-background p-4 rounded-lg border border-custom flex items-center gap-3">
                            <Loader2 className="animate-spin text-custom-primary" size={24} />
                            <span className="text-custom-primary font-medium">Saving game...</span>
                        </div>
                    </div>
                )}
                
                {/* Group Info */}
                {selectedGroup && (
                    <div className="mb-4 p-3 bg-custom-surface rounded-lg border border-custom">
                        <div className="text-sm text-custom-secondary">
                            Saving to group: <span className="text-custom-primary font-medium">{selectedGroup.name}</span>
                        </div>
                    </div>
                )}
                
                {/* Game Title Input */}
                <div className="mb-6 p-4 bg-custom-surface rounded-lg border border-custom">
                    <label className="block text-sm font-medium text-custom-primary mb-2">
                        Game Title
                    </label>
                    <input
                        type="text"
                        value={gameTitle}
                        onChange={(e) => setGameTitle(e.target.value)}
                        disabled={isSubmitting}
                        className="w-full bg-custom-background border border-custom rounded px-3 py-2 text-custom-primary placeholder-custom-secondary focus:outline-none focus:border-custom-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder="eg. Edwin's House - 69/69/69"
                        required
                    />
                </div>

                {/* Results — table on desktop, cards on mobile */}
                <div className="hidden sm:block overflow-x-auto mb-6">
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
                            {[...players]
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

                <div className="sm:hidden space-y-2 mb-6">
                    {[...players]
                        .sort((a, b) => b.net - a.net)
                        .map((player, index) => (
                            <div key={player.id} className="bg-custom-surface-alt border border-custom rounded-lg p-3">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-custom-primary font-medium">
                                        <span className="text-custom-secondary mr-1">#{index + 1}</span>
                                        {player.name}
                                    </span>
                                    <span className={`font-semibold ${
                                        player.net > 0 ? 'text-green-400' :
                                        player.net < 0 ? 'text-red-400' :
                                        'text-gray-400'
                                    }`}>
                                        {player.net >= 0 ? '+' : '-'}{formatCurrency(player.net)}
                                    </span>
                                </div>
                                <div className="flex gap-4 text-sm text-custom-secondary">
                                    <span>Buy-in: <span className="text-custom-primary">{formatCurrency(player.buyIn)}</span></span>
                                    <span>Cash-out: <span className="text-custom-primary">{formatCurrency(player.cashOut)}</span></span>
                                </div>
                            </div>
                        ))}
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
                        onClick={handleClose}
                        disabled={isSubmitting}
                        className={`px-6 py-2 rounded transition-colors ${
                            isSubmitting
                                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                : 'bg-gray-600 hover:bg-gray-500 text-white cursor-pointer'
                        }`}
                    >
                        Close
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!selectedGroup || isSubmitting || !gameTitle.trim()}
                        className={`px-6 py-2 rounded transition-colors flex items-center gap-2 ${
                            (!selectedGroup || isSubmitting || !gameTitle.trim())
                                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                : 'bg-custom-primary hover:opacity-80 text-white cursor-pointer'
                        }`}
                    >
                        {isSubmitting && <Loader2 className="animate-spin" size={16} />}
                        {isSubmitting ? 'Submitting...' : 'Submit Game'}
                    </button>
                </div>
            </div>
        </div>
    );
}