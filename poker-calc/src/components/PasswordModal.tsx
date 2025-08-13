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

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (password === 'liang123993') {
            onSuccess();
            setPassword('');
            setError('');
        } else {
            setError('Incorrect password');
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
                            setError(''); // Clear error when typing
                        }}
                        className="w-full bg-custom-background border border-custom rounded px-3 py-2 text-custom-primary placeholder-custom-secondary focus:outline-none focus:border-custom-primary mb-4"
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
                            className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="bg-custom-primary hover:opacity-80 text-white px-4 py-2 rounded transition-colors cursor-pointer"
                        >
                            Submit
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}