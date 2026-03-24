import React, { useState, useEffect } from 'react';
import { User, Shield, Trash2, Mail, CheckCircle, ExternalLink, Plus, Edit2, Loader2, AlertCircle } from 'lucide-react';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { Input } from './ui/Input';
import { cn } from '../lib/utils';
import { api } from '../lib/api';

export function MembersTab({ project, isAdmin }) {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

    // Edit/Invite State
    const [editingMember, setEditingMember] = useState(null); // If set, we are editing permissions

    useEffect(() => {
        loadMembers();
    }, [project.id]);

    const loadMembers = async () => {
        try {
            setLoading(true);
            const data = await api.getProjectMembers(project.id);
            setMembers(data);
        } catch (e) {
            setError("Failed to load members");
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveMember = async (memberId) => {
        if (!confirm("Are you sure you want to remove this user from the project?")) return;
        try {
            await api.removeProjectMember(project.id, memberId);
            await loadMembers();
        } catch (e) {
            alert(e.message);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading members...</div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

    return (
        <div className="secrets-container">
            {/* Toolbar (Integrated into table header or separate div like env-actions) */}
            {isAdmin && (
                <div className="env-actions border-b border-gray-800">
                    <span className="env-info">
                        Manage Team Access
                    </span>
                    <Button onClick={() => {
                        console.log('Clicked Add Member');
                        setEditingMember(null);
                        setIsInviteModalOpen(true);
                    }}>
                        <Plus size={16} className="mr-2" />
                        Add Member
                    </Button>
                </div>
            )}


            {/* List */}
            <table className="secrets-table">
                <thead>
                    <tr>
                        <th>User</th>
                        <th>Status</th>
                        <th>Access</th>
                        {isAdmin && <th className="text-right">Actions</th>}
                    </tr>
                </thead>
                <tbody>
                    {members.length === 0 ? (
                        <tr>
                            <td colSpan={4} className="empty-state">
                                <div className="empty-content">
                                    <User size={40} className="empty-icon" />
                                    <p>No members yet. Invite your team!</p>
                                </div>
                            </td>
                        </tr>
                    ) : (
                        members.map(member => (
                            <tr key={member.id} className="hover:bg-gray-50/5 transition-colors">
                                <td>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-sm font-bold border border-blue-500/30">
                                            {(member.name || member.email || '?')[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-200">{member.name || 'Invited User'}</div>
                                            <div className="text-xs text-gray-500 font-mono">{member.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    {member.status === 'ACTIVE' ? (
                                        <span className="status-badge success">
                                            <CheckCircle size={10} /> Active
                                        </span>
                                    ) : (
                                        <span className="status-badge warning">
                                            <Mail size={10} /> Invited
                                        </span>
                                    )}
                                </td>
                                <td>
                                    <div className="flex flex-wrap gap-2">
                                        {member.environments.map(envId => {
                                            const env = project.environments.find(e => e.id === envId);
                                            return env ? (
                                                <span key={envId} className="px-2 py-0.5 rounded text-xs border border-gray-700 bg-gray-800 text-gray-300">
                                                    {env.name}
                                                </span>
                                            ) : null;
                                        })}
                                        {member.environments.length === 0 && <span className="text-gray-500 text-xs italic">No access</span>}
                                    </div>
                                </td>
                                {isAdmin && (
                                    <td className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                className="icon-btn"
                                                onClick={() => { setEditingMember(member); setIsInviteModalOpen(true); }}
                                                title="Edit Access"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button
                                                className="icon-btn danger"
                                                onClick={() => handleRemoveMember(member.id)}
                                                title="Remove Member"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>

            {/* Invite/Edit Modal */}
            <MemberModal
                isOpen={isInviteModalOpen}
                onClose={() => { setIsInviteModalOpen(false); setEditingMember(null); }}
                onSuccess={() => { loadMembers(); setIsInviteModalOpen(false); setEditingMember(null); }}
                project={project}
                member={editingMember}
            />
        </div>
    );
}

function MemberModal({ isOpen, onClose, onSuccess, project, member }) {
    const isEditing = !!member;
    const [email, setEmail] = useState('');
    const [selectedEnvIds, setSelectedEnvIds] = useState([]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    // Init form
    useEffect(() => {
        if (isOpen) {
            if (member) {
                setEmail(member.email);
                setSelectedEnvIds(member.environments || []);
            } else {
                setEmail('');
                setSelectedEnvIds([]);
            }
            setError(null);
        }
    }, [isOpen, member]);

    const toggleEnv = (id) => {
        setSelectedEnvIds(prev =>
            prev.includes(id)
                ? prev.filter(e => e !== id)
                : [...prev, id]
        );
    };

    const handleSubmit = async () => {
        if (!email) return setError("Email is required");
        if (selectedEnvIds.length === 0) return setError("Select at least one environment");

        try {
            setSaving(true);
            if (isEditing) {
                await api.updateProjectMember(project.id, member.id, selectedEnvIds);
            } else {
                await api.addProjectMember(project.id, email, selectedEnvIds);
            }
            onSuccess();
        } catch (e) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? 'Edit Access' : 'Add Team Member'}
            footer={
                <>
                    <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={saving}>
                        {saving ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                        {isEditing ? 'Save Changes' : 'Send Invite'}
                    </Button>
                </>
            }
        >
            <div className="space-y-4">
                {/* Email Input */}
                <div className="form-group">
                    <label>Email Address</label>
                    <Input
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        disabled={isEditing || saving}
                        placeholder="colleague@example.com"
                    />
                    {isEditing && <span className="help-text">Email cannot be changed once invited.</span>}
                </div>

                {/* Environment Selection */}
                <div className="form-group">
                    <label>Environment Access</label>
                    <div className="border border-gray-700 rounded-md overflow-hidden divide-y divide-gray-700 mt-2">
                        {project.environments.map(env => (
                            <label
                                key={env.id}
                                className={cn(
                                    "flex items-center px-4 py-3 cursor-pointer hover:bg-gray-800 transition-colors",
                                    selectedEnvIds.includes(env.id) && "bg-blue-900/20"
                                )}
                            >
                                <input
                                    type="checkbox"
                                    className="h-4 w-4 bg-gray-900 border-gray-600 rounded text-blue-500 focus:ring-offset-gray-900"
                                    checked={selectedEnvIds.includes(env.id)}
                                    onChange={() => toggleEnv(env.id)}
                                    disabled={saving}
                                />
                                <div className="ml-3 flex-1">
                                    <div className="text-sm font-medium text-gray-200">{env.name}</div>
                                </div>
                                {selectedEnvIds.includes(env.id) && (
                                    <CheckCircle className="text-blue-500" size={16} />
                                )}
                            </label>
                        ))}
                    </div>
                    <span className="help-text">User will be able to view and edit secrets in selected environments.</span>
                </div>

                {error && (
                    <div className="pv-error-banner">
                        <AlertCircle size={16} />
                        <span>{error}</span>
                    </div>
                )}
            </div>
        </Modal>
    );
}
