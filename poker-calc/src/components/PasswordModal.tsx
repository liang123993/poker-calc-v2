import React, { useState } from 'react';

interface PasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    title?: string;
}

export default function PasswordModal({ 
    isOpen, 
    onClose, 
    onSuccess,
    title = "Enter Password"
}: PasswordModalProps) {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsVerifying(true);
        setError('');
        
        try {
            const response = await fetch('/api/auth/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ password }),
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                onSuccess();
                setPassword('');
                setError('');
            } else {
                setError(data.error || 'Incorrect password');
            }
        } catch (error) {
            setError('Connection error. Please try again.');
        } finally {
            setIsVerifying(false);
        }
    };

    const handleClose = () => {
        setPassword('');
        setError('');
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[9999]">
            <div className="bg-custom-surface rounded-lg p-6 max-w-md w-full border border-custom relative z-[10000]">
                <h3 className="text-lg font-semibold mb-4 text-custom-primary">{title}</h3>
                
                <form onSubmit={handleSubmit}>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value);
                            setError('');
                        }}
                        disabled={isVerifying}
                        className="w-full bg-custom-background border border-custom rounded px-3 py-2 text-custom-primary placeholder-custom-secondary focus:outline-none focus:border-custom-primary mb-4 disabled:opacity-50"
                        placeholder="Enter password"
                        required
                        autoFocus
                    />
                    
                    {error && (
                        <p className="text-red-400 text-sm mb-4">{error}</p>
                    )}
                    
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={isVerifying}
                            className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isVerifying}
                            className="bg-custom-primary hover:opacity-80 text-white px-4 py-2 rounded transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isVerifying ? 'Verifying...' : 'Submit'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}