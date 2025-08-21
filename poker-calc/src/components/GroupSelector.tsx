// src/components/GroupSelector.tsx
import React from 'react';
import { Group } from '@/types/player';
import { ChevronDown, Users } from 'lucide-react';

interface GroupSelectorProps {
    groups: Group[];
    selectedGroupId: string | null;
    onGroupChange: (groupId: string | null) => void;
    loading?: boolean;
    label?: string;
    includeAllOption?: boolean;
    allOptionLabel?: string;
    placeholder?: string;
    disabled?: boolean;
}

export default function GroupSelector({
    groups,
    selectedGroupId,
    onGroupChange,
    loading = false,
    label = "Group",
    includeAllOption = false,
    allOptionLabel = "All Groups",
    placeholder = "Select a group...",
    disabled = false
}: GroupSelectorProps) {
    const selectedGroup = selectedGroupId ? groups.find(g => g._id === selectedGroupId) : null;

    if (loading) {
        return (
            <div className="flex items-center gap-2">
                <span className="text-custom-secondary text-sm">{label}:</span>
                <div className="bg-custom-surface border border-custom rounded px-3 py-2 text-custom-secondary">
                    Loading...
                </div>
            </div>
        );
    }

    if (groups.length === 0) {
        return (
            <div className="flex items-center gap-2">
                <span className="text-custom-secondary text-sm">{label}:</span>
                <div className="bg-custom-surface border border-custom rounded px-3 py-2 text-custom-secondary">
                    No groups available
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2">
            <span className={`text-sm ${disabled ? 'text-gray-500' : 'text-custom-secondary'}`}>{label}:</span>
            <div className="relative">
                <select
                    value={selectedGroupId || ''}
                    onChange={(e) => onGroupChange(e.target.value || null)}
                    disabled={disabled}
                    className={`appearance-none border rounded px-3 py-2 pr-8 focus:outline-none min-w-[200px] ${
                        disabled 
                            ? 'bg-gray-700 border-gray-600 text-gray-400 cursor-not-allowed' 
                            : 'bg-custom-surface border-custom text-custom-primary focus:border-custom-primary'
                    }`}
                >
                    {!selectedGroupId && (
                        <option value="" disabled>
                            {placeholder}
                        </option>
                    )}
                    
                    {includeAllOption && (
                        <option value="">
                            {allOptionLabel}
                        </option>
                    )}
                    
                    {groups.map((group) => (
                        <option key={group._id} value={group._id}>
                            {group.name} ({group.stats.totalGames} games)
                        </option>
                    ))}
                </select>
                
                <ChevronDown 
                    className={`absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none ${
                        disabled ? 'text-gray-500' : 'text-custom-secondary'
                    }`} 
                    size={16} 
                />
            </div>

            {selectedGroup && !disabled && (
                <div className="flex items-center gap-1 text-custom-secondary text-sm">
                    <Users size={14} />
                    <span>{selectedGroup.stats.totalGames} games</span>
                </div>
            )}
        </div>
    );
}