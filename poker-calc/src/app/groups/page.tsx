// src/app/groups/page.tsx
"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import PasswordModal from "@/components/PasswordModal";
import { Group } from "@/types/player";
import { Plus, Users, Calendar, Trophy, Trash2 } from "lucide-react";

interface CreateGroupModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (group: Group) => void;
}

function CreateGroupModal({ isOpen, onClose, onSuccess }: CreateGroupModalProps) {
    const [name, setName] = useState("");
    const [createdBy, setCreatedBy] = useState("");
    const [description, setDescription] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!name.trim() || !createdBy.trim()) {
            alert("Group name and your name are required");
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch('/api/groups', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: name.trim(),
                    createdBy: createdBy.trim(),
                    description: description.trim()
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create group');
            }

            const result = await response.json();
            onSuccess(result.group);
            
            // Reset form
            setName("");
            setCreatedBy("");
            setDescription("");
            
            alert('Group created successfully! Everyone can now see and use this group.');
        } catch (error) {
            alert(error instanceof Error ? error.message : 'Failed to create group');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setName("");
        setCreatedBy("");
        setDescription("");
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-custom-background rounded-lg p-6 max-w-md w-full border border-custom">
                <h3 className="text-xl font-bold mb-4 text-custom-primary">Create New Group</h3>
                
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-custom-primary mb-2">
                            Group Name *
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-custom-surface border border-custom rounded px-3 py-2 text-custom-primary placeholder-custom-secondary focus:outline-none focus:border-custom-primary"
                            placeholder="e.g., Friday Night Poker"
                            maxLength={100}
                            required
                        />
                    </div>
                    
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-custom-primary mb-2">
                            Your Name *
                        </label>
                        <input
                            type="text"
                            value={createdBy}
                            onChange={(e) => setCreatedBy(e.target.value)}
                            className="w-full bg-custom-surface border border-custom rounded px-3 py-2 text-custom-primary placeholder-custom-secondary focus:outline-none focus:border-custom-primary"
                            placeholder="e.g., John Smith"
                            required
                        />
                    </div>
                    
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-custom-primary mb-2">
                            Description (Optional)
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full bg-custom-surface border border-custom rounded px-3 py-2 text-custom-primary placeholder-custom-secondary focus:outline-none focus:border-custom-primary resize-none"
                            placeholder="e.g., Weekly poker games at my house"
                            rows={3}
                            maxLength={500}
                        />
                    </div>
                    
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
                            disabled={isSubmitting}
                            className="bg-custom-primary hover:opacity-80 text-white px-4 py-2 rounded transition-colors cursor-pointer disabled:opacity-50"
                        >
                            {isSubmitting ? "Creating..." : "Create Group"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

interface ConfirmDeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    group: Group | null;
}

function ConfirmDeleteModal({ isOpen, onClose, onConfirm, group }: ConfirmDeleteModalProps) {
    if (!isOpen || !group) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-60">
            <div className="bg-custom-surface rounded-lg p-6 max-w-md w-full border border-custom">
                <h3 className="text-lg font-semibold mb-4 text-custom-primary">Confirm Delete Group</h3>
                <div className="mb-6">
                    <p className="text-custom-secondary mb-4">
                        Are you sure you want to delete the group <span className="font-semibold text-custom-primary">"{group.name}"</span>?
                    </p>
                    <div className="bg-red-900/20 border border-red-600 rounded p-3 mb-4">
                        <p className="text-red-200 text-sm font-semibold mb-2">⚠️ This will permanently delete:</p>
                        <ul className="text-red-200 text-sm space-y-1">
                            <li>• All {group.stats.totalGames} games in this group</li>
                            <li>• All player records from these games</li>
                            <li>• All leaderboard data for this group</li>
                        </ul>
                    </div>
                    <p className="text-custom-secondary text-sm">
                        This action cannot be undone.
                    </p>
                </div>
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
                        Delete Group
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function GroupsPage() {
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

    useEffect(() => {
        fetchGroups();
    }, []);

    const fetchGroups = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/groups?includeStats=true');
            
            if (!response.ok) {
                throw new Error('Failed to fetch groups');
            }
            
            const data = await response.json();
            setGroups(data.groups || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSuccess = (group: Group) => {
        setGroups(prevGroups => [group, ...prevGroups]);
        setShowCreateModal(false);
    };

    const handleDeleteClick = (group: Group) => {
        setSelectedGroup(group);
        setShowPasswordModal(true);
    };

    const handlePasswordSuccess = () => {
        setShowPasswordModal(false);
        setShowDeleteConfirm(true);
    };

    const handleConfirmDelete = async () => {
        if (!selectedGroup) return;

        try {
            const response = await fetch(`/api/groups/${selectedGroup._id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete group');
            }

            const result = await response.json();
            
            // Remove group from local state
            setGroups(prevGroups => prevGroups.filter(g => g._id !== selectedGroup._id));
            
            setShowDeleteConfirm(false);
            setSelectedGroup(null);
            
            alert(`Group "${selectedGroup.name}" and all associated data deleted successfully!`);
        } catch (error) {
            alert(error instanceof Error ? error.message : 'Failed to delete group');
        }
    };

    const formatDate = (date: Date | string | null) => {
        if (!date) return 'No games yet';
        return new Date(date).toLocaleDateString();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-custom-background text-custom-primary">
                <Header currentPage="groups" />
                <main className="px-6 py-8">
                    <div className="flex justify-center items-center h-64">
                        <div className="text-custom-secondary">Loading groups...</div>
                    </div>
                </main>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-custom-background text-custom-primary">
                <Header currentPage="groups" />
                <main className="px-6 py-8">
                    <div className="flex justify-center items-center h-64">
                        <div className="text-red-400">Error: {error}</div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-custom-background text-custom-primary">
            <Header currentPage="groups" />
            <main className="px-6 py-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-custom-primary">
                        Groups
                    </h2>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-custom-primary hover:opacity-80 text-white px-4 py-2 rounded transition-colors cursor-pointer flex items-center gap-2"
                    >
                        <Plus size={16} />
                        Create Group
                    </button>
                </div>

                <div className="mb-6">
                    <p className="text-custom-secondary">
                        Create groups to organize different poker contexts (work, friends, family, etc.). 
                        Everyone can see and add games to any group.
                    </p>
                </div>

                {groups.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-custom-secondary text-lg mb-4">
                            No groups created yet
                        </div>
                        <div className="text-custom-secondary mb-6">
                            Create the first group to get started!
                        </div>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-custom-primary hover:opacity-80 text-white px-6 py-3 rounded transition-colors cursor-pointer flex items-center gap-2 mx-auto"
                        >
                            <Plus size={20} />
                            Create Your First Group
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {groups.map((group) => (
                            <div key={group._id} className="bg-custom-background border border-custom rounded-lg p-6 hover:border-custom-primary transition-colors">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-custom-primary mb-1">
                                            {group.name}
                                        </h3>
                                        <p className="text-sm text-custom-secondary">
                                            Created by {group.createdBy}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteClick(group)}
                                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20 p-2 rounded transition-colors cursor-pointer ml-2"
                                        title="Delete group"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                {group.description && (
                                    <p className="text-custom-secondary text-sm mb-4">
                                        {group.description}
                                    </p>
                                )}

                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2 text-custom-secondary">
                                        <Trophy size={14} />
                                        <span>{group.stats.totalGames} games played</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-custom-secondary">
                                        <Users size={14} />
                                        <span>{group.stats.totalPlayers} players</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-custom-secondary">
                                        <Calendar size={14} />
                                        <span>Last game: {formatDate(group.stats.lastGameDate)}</span>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-custom">
                                    <div className="text-xs text-custom-secondary">
                                        Created {formatDate(group.createdAt)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="mt-8 text-center text-custom-secondary text-sm">
                    <p>
                        All groups are visible to everyone. Use the dropdowns on other pages to filter by specific groups.
                    </p>
                </div>
            </main>

            <CreateGroupModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={handleCreateSuccess}
            />

            <PasswordModal
                isOpen={showPasswordModal}
                onClose={() => {
                    setShowPasswordModal(false);
                    setSelectedGroup(null);
                }}
                onSuccess={handlePasswordSuccess}
                title="Delete Group"
            />

            <ConfirmDeleteModal
                isOpen={showDeleteConfirm}
                onClose={() => {
                    setShowDeleteConfirm(false);
                    setSelectedGroup(null);
                }}
                onConfirm={handleConfirmDelete}
                group={selectedGroup}
            />
        </div>
    );
}