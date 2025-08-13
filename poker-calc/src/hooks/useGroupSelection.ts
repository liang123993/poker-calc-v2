// src/hooks/useGroupSelection.ts
import { useState, useEffect } from 'react';
import { Group } from '@/types/player';

interface UseGroupSelectionReturn {
    groups: Group[];
    selectedGroupId: string | null;
    selectedGroup: Group | null;
    setSelectedGroupId: (groupId: string | null) => void;
    loading: boolean;
    error: string | null;
    refreshGroups: () => Promise<void>;
}

export function useGroupSelection(storageKey: string): UseGroupSelectionReturn {
    const [groups, setGroups] = useState<Group[]>([]);
    const [selectedGroupId, setSelectedGroupIdState] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Load selected group from localStorage
    useEffect(() => {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
            setSelectedGroupIdState(saved);
        }
    }, [storageKey]);

    // Save selected group to localStorage
    const setSelectedGroupId = (groupId: string | null) => {
        setSelectedGroupIdState(groupId);
        if (groupId) {
            localStorage.setItem(storageKey, groupId);
        } else {
            localStorage.removeItem(storageKey);
        }
    };

    // Fetch groups
    const fetchGroups = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await fetch('/api/groups?includeStats=true');
            if (!response.ok) {
                throw new Error('Failed to fetch groups');
            }
            
            const data = await response.json();
            const fetchedGroups = data.groups || [];
            setGroups(fetchedGroups);
            
            // Auto-select group if none selected
            if (!selectedGroupId && fetchedGroups.length > 0) {
                // Default to group with most games, or first group if none have games
                const defaultGroup = fetchedGroups.reduce((prev: Group, current: Group) => 
                    current.stats.totalGames > prev.stats.totalGames ? current : prev
                );
                setSelectedGroupId(defaultGroup._id);
            }
            
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGroups();
    }, []);

    // Find selected group object
    const selectedGroup = selectedGroupId ? groups.find(g => g._id === selectedGroupId) || null : null;

    return {
        groups,
        selectedGroupId,
        selectedGroup,
        setSelectedGroupId,
        loading,
        error,
        refreshGroups: fetchGroups
    };
}