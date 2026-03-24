import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import {
    Plus, CheckCircle, Eye, EyeOff, Lock, RefreshCw, Copy, FolderPlus,
    Trash2, Edit3, AlertCircle, Loader2, Check, Clock, History, FileText, Save, Split
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { SecretRow } from '../components/SecretRow';
import { PropagationModal } from '../components/PropagationModal';
import { MembersTab } from '../components/MembersTab';
import { cn } from '../lib/utils';
import './ProjectView.css';

export default function ProjectView({ params }) {
    const { user } = useAuth();
    const [, setLocation] = useLocation();

    // Data State
    const [project, setProject] = useState(null);
    const [currentEnvId, setCurrentEnvId] = useState(null);
    const [secrets, setSecrets] = useState([]);
    const [allSecrets, setAllSecrets] = useState([]);
    const [registry, setRegistry] = useState({});

    // Editing State (Global Drafts)
    const [drafts, setDrafts] = useState({}); // { [secretId]: newValue }
    const [descDrafts, setDescDrafts] = useState({}); // { [secretKey]: newDescription }

    // UI State
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [revealed, setRevealed] = useState({});
    const [copied, setCopied] = useState(null);

    // Secret Modal State
    const [isSecretModalOpen, setIsSecretModalOpen] = useState(false);
    const [editingSecret, setEditingSecret] = useState(null);
    const [secretForm, setSecretForm] = useState({ key: '', value: '', description: '' });

    // Environment Modal State
    const [isEnvModalOpen, setIsEnvModalOpen] = useState(false);
    const [envForm, setEnvForm] = useState({ name: '', slug: '' });

    // Delete Confirmation State
    const [deleteConfirm, setDeleteConfirm] = useState({ open: false, type: null, id: null, name: '' });

    // History Modal State
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [secretHistory, setSecretHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);



    // Propagation Modal State
    const [propagation, setPropagation] = useState({
        isOpen: false,
        affectedSecrets: [], // List of { key, value }
    });

    // Logs State
    const [activeSection, setActiveSection] = useState('secrets'); // 'secrets' | 'logs'
    const [logs, setLogs] = useState([]);

    const slug = params?.slug;
    const isAdmin = user?.isAdmin || user?.is_admin;



    // Guard: No slug means component rendered without proper params
    if (!slug) {
        return (
            <div className="pv-loading">
                <Loader2 className="animate-spin" size={32} />
                <span>Loading...</span>
            </div>
        );
    }

    const loadProject = async () => {
        try {
            setLoading(true);
            setError(null);
            const p = await api.getProject(slug, user?.id, isAdmin);
            if (p) {
                setProject(p);
                if (!currentEnvId && p.environments.length > 0) {
                    setCurrentEnvId(p.environments[0].id);
                }
            } else {
                setError('Project not found');
            }
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const loadSecrets = async () => {
        if (!project || !currentEnvId) return;
        try {
            const [s, r] = await Promise.all([
                api.getSecrets(project.id),
                api.getSecretRegistry(project.id)
            ]);
            setAllSecrets(s);
            setSecrets(s.filter(secret => secret.environmentId === currentEnvId));
            setRegistry(r);
        } catch (e) {
            setError(e.message);
        }
    }


    const loadLogs = async () => {
        if (!project || !currentEnvId) return;
        try {
            // Fetch logs for this environment
            const l = await api.getAuditLogs(project.id, currentEnvId);
            setLogs(l);
        } catch (e) {
            setError(e.message);
        }
    };

    // Fetch Project
    useEffect(() => {
        if (slug) loadProject();
    }, [slug]);

    // Fetch Secrets when Env changes
    useEffect(() => {
        if (project && currentEnvId) {
            if (activeSection === 'secrets') {
                loadSecrets();
            } else {
                loadLogs();
            }
        }
    }, [project, currentEnvId, activeSection]);

    const handleEnvChange = (envId) => {
        if (Object.keys(drafts).length > 0 || Object.keys(descDrafts).length > 0) {
            if (!confirm("You have unsaved changes. Switching environment will discard them. Continue?")) {
                return;
            }
        }
        setCurrentEnvId(envId);
        setRevealed({});
        setDrafts({});
        setDescDrafts({});
    };

    const handleSectionChange = (section) => {
        setActiveSection(section);
    };

    const toggleReveal = (id) => {
        setRevealed(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const copyToClipboard = async (id, value) => {
        try {
            await navigator.clipboard.writeText(value);
            setCopied(id);
            setTimeout(() => setCopied(null), 2000);
        } catch (e) {
            console.error('Copy failed:', e);
        }
    };

    const getSyncStatus = (secret) => {
        const globalEntry = registry[secret.key];
        if (!globalEntry) return 'synced';
        const localTime = new Date(secret.updatedAt).getTime();
        const globalTime = new Date(globalEntry.lastUpdatedAt).getTime();

        if (localTime >= globalTime) return 'synced';

        // Value check: if value matches the latest secret's value, it is synced
        const latestSecret = allSecrets
            .filter(s => s.key === secret.key)
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];

        if (latestSecret && latestSecret.value === secret.value) {
            return 'synced';
        }

        return 'outdated';
    };

    const handleSyncSecret = async (secretId) => {
        try {
            setSaving(true);
            await api.syncSecret(secretId);
            await loadSecrets();
        } catch (e) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    };

    const loadSecretHistory = async (secretId) => {
        try {
            setHistoryLoading(true);
            setIsHistoryModalOpen(true);
            setSecretHistory([]); // clear previous
            const history = await api.getSecretHistory(secretId);
            setSecretHistory(history);
        } catch (e) {
            console.error('Failed to load history', e);
            setError('Failed to load history');
        } finally {
            setHistoryLoading(false);
        }
    };

    const openSecretModal = (secret = null) => {
        setEditingSecret(secret);
        const desc = secret ? (registry[secret.key]?.description || '') : '';
        setSecretForm({
            key: secret ? secret.key : '',
            value: secret ? secret.value : '',
            description: desc
        });
        setIsSecretModalOpen(true);
    };

    const handleSaveSecret = async () => {
        if (!secretForm.key || !secretForm.value) return;
        try {
            setSaving(true);
            await api.saveSecret(project.id, currentEnvId, secretForm.key, secretForm.value, user);
            if (secretForm.description) {
                await api.updateSecretDescription(project.id, secretForm.key, secretForm.description);
            }
            setIsSecretModalOpen(false);
            await loadSecrets();
        } catch (e) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    };

    const handleCreateEnv = async () => {
        if (!envForm.name || !envForm.slug) return;
        try {
            setSaving(true);
            await api.createEnvironment(project.id, envForm.name, envForm.slug);
            setIsEnvModalOpen(false);
            setEnvForm({ name: '', slug: '' });
            await loadProject();
        } catch (e) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    };

    const confirmDelete = (type, id, name) => {
        setDeleteConfirm({ open: true, type, id, name });
    };

    const executeDelete = async () => {
        try {
            setSaving(true);
            if (deleteConfirm.type === 'secret') {
                await api.deleteSecret(deleteConfirm.id);
                await loadSecrets();
            } else if (deleteConfirm.type === 'environment') {
                await api.deleteEnvironment(deleteConfirm.id);
                setCurrentEnvId(null);
                await loadProject();
            }
            setDeleteConfirm({ open: false, type: null, id: null, name: '' });
        } catch (e) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    };


    // --- Global Save Logic ---

    const handleDraftChange = (secretId, newValue) => {
        setDrafts(prev => {
            const secret = secrets.find(s => s.id === secretId);
            if (secret && secret.value === newValue) {
                // If value matches original, remove from drafts
                const next = { ...prev };
                delete next[secretId];
                return next;
            }
            return { ...prev, [secretId]: newValue };
        });
    };

    const handleDescriptionUpdate = (key, newDescription) => {
        const originalDesc = registry[key]?.description || '';
        if (newDescription === originalDesc) {
            setDescDrafts(prev => {
                const next = { ...prev };
                delete next[key];
                return next;
            });
        } else {
            setDescDrafts(prev => ({ ...prev, [key]: newDescription }));
        }
    };

    const discardChanges = () => {
        setDrafts({});
        setDescDrafts({});
    };

    const handleGlobalSave = async () => {
        const secretIds = Object.keys(drafts);
        const descKeys = Object.keys(descDrafts);

        if (secretIds.length === 0 && descKeys.length === 0) return;

        try {
            setSaving(true);

            // 1. Save all changed secrets to current environment
            const updates = [];
            for (const id of secretIds) {
                const secret = secrets.find(s => s.id === id);
                if (secret) {
                    const newValue = drafts[id];
                    updates.push({ key: secret.key, value: newValue }); // Store for propagation
                    await api.saveSecret(project.id, currentEnvId, secret.key, newValue, user);
                }
            }

            // 2. Save changed descriptions
            for (const key of descKeys) {
                await api.updateSecretDescription(project.id, key, descDrafts[key]);
            }

            // 3. Refresh secrets
            await loadSecrets();

            // 4. Prepare Propagation
            if (updates.length > 0 || descKeys.length > 0) {
                setPropagation({
                    isOpen: true,
                    affectedSecrets: updates,
                    affectedDescriptions: descKeys.map(k => ({ key: k, value: descDrafts[k] }))
                });
            }

            // Clear drafts *after* save success
            setDrafts({});
            setDescDrafts({});

        } catch (e) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    };

    const handlePropagationConfirm = async (targetEnvIds) => {
        const { affectedSecrets } = propagation;
        if (!affectedSecrets || affectedSecrets.length === 0) return;

        try {
            setSaving(true);
            // Iterate and save to all selected environments
            const promises = [];
            targetEnvIds.forEach(envId => {
                affectedSecrets.forEach(({ key, value }) => {
                    promises.push(api.saveSecret(project.id, envId, key, value, user));
                });
            });

            await Promise.all(promises);

            // Close modal and reset
            setPropagation(prev => ({ ...prev, isOpen: false }));

        } catch (e) {
            setError("Propagation failed: " + e.message);
        } finally {
            setSaving(false);
        }
    };



    const handleCommonSync = async (secretId) => {
        try {
            setSaving(true);
            await api.syncSecret(secretId);
            await loadSecrets();
        } catch (e) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    }

    // Loading State
    if (loading) {
        return (
            <div className="pv-loading">
                <Loader2 className="animate-spin" size={32} />
                <span>Loading project...</span>
            </div>
        );
    }

    // Error State
    if (error && !project) {
        return (
            <div className="pv-error">
                <AlertCircle size={32} />
                <span>{error}</span>
                <Button onClick={() => setLocation('/')}>Back to Dashboard</Button>
            </div>
        );
    }

    if (!project) return null;

    const currentEnv = project.environments.find(e => e.id === currentEnvId);

    return (
        <div className="project-view">
            {/* Header */}
            <div className="pv-header">
                <div>
                    <h1 className="pv-title">{project.name}</h1>
                    <div className="pv-slug">/{project.slug}</div>
                </div>
                {isAdmin && (
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setLocation(`/project/${project.slug}/compare`)}>
                            <Split size={16} className="mr-2" />
                            Compare
                        </Button>
                        <Button onClick={() => openSecretModal()}>
                            <Plus size={16} className="mr-2" />
                            Add Secret
                        </Button>
                    </div>
                )}
            </div>

            {/* Error Banner */}
            {error && (
                <div className="pv-error-banner">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                    <button onClick={() => setError(null)}>×</button>
                </div>
            )}

            {/* Environment Tabs */}
            <div className="env-tabs">
                {project.environments.map(env => (
                    <button
                        key={env.id}
                        className={cn('env-tab', currentEnvId === env.id && 'active')}
                        onClick={() => handleEnvChange(env.id)}
                    >
                        {env.name}
                        {env.isProduction && <Lock size={12} className="ml-2 opacity-50" />}
                    </button>
                ))}
                {isAdmin && (
                    <button className="env-tab add-env" onClick={() => setIsEnvModalOpen(true)} title="Add Environment">
                        <FolderPlus size={16} />
                    </button>
                )}
            </div>

            {/* Environment Actions & Toggle */}
            {currentEnv && (
                <div className="env-controls">
                    <div className="section-toggle">
                        <button
                            className={cn('toggle-btn', activeSection === 'secrets' && 'active')}
                            onClick={() => handleSectionChange('secrets')}
                        >
                            Secrets
                        </button>
                        <button
                            className={cn('toggle-btn', activeSection === 'logs' && 'active')}
                            onClick={() => handleSectionChange('logs')}
                        >
                            Logs
                        </button>
                        <button
                            className={cn('toggle-btn', activeSection === 'members' && 'active')}
                            onClick={() => handleSectionChange('members')}
                        >
                            Members
                        </button>
                    </div>

                    {isAdmin && activeSection === 'secrets' && (
                        <div className="env-actions">
                            <span className="env-info">
                                Environment: <strong>{currentEnv.name}</strong> ({currentEnv.slug})
                            </span>
                            <button
                                className="env-delete-btn"
                                onClick={() => confirmDelete('environment', currentEnv.id, currentEnv.name)}
                                title="Delete Environment"
                            >
                                <Trash2 size={14} /> Delete Environment
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Secrets Table */}
            {activeSection === 'secrets' && (
                <div className="secrets-container">
                    <table className="secrets-table">
                        <thead>
                            <tr>
                                <th className="w-1/4">Key</th>
                                <th className="w-1/2">Value</th>
                                <th className="w-status">Status</th>
                                <th className="w-actions">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {secrets.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="empty-state">
                                        <div className="empty-content">
                                            <Lock size={40} className="empty-icon" />
                                            <p>No secrets in this environment</p>
                                            {isAdmin && (
                                                <Button variant="ghost" onClick={() => openSecretModal()}>
                                                    <Plus size={16} className="mr-2" /> Add your first secret
                                                </Button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                secrets.map(secret => (
                                    <SecretRow
                                        key={secret.id}
                                        secret={secret}
                                        value={drafts[secret.id]} // Pass controlled value if draft exists
                                        description={descDrafts[secret.key]} // Pass controlled description if draft exists
                                        registryEntry={registry[secret.key]}
                                        allSecrets={allSecrets}
                                        isAdmin={isAdmin}
                                        isSaving={saving}
                                        onChange={handleDraftChange}
                                        onDelete={(id, key) => confirmDelete('secret', id, key)}
                                        onSync={handleCommonSync}
                                        onHistory={loadSecretHistory}
                                        onCopyToClipboard={copyToClipboard}
                                        onDescriptionSave={handleDescriptionUpdate}
                                        onCompare={(key) => setLocation(`/project/${project.slug}/compare?key=${encodeURIComponent(key)}`)}
                                    />
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Logs Table */}
            {activeSection === 'logs' && (
                <div className="logs-container">
                    <table className="secrets-table">
                        <thead>
                            <tr>
                                <th>Timestamp</th>
                                <th>Action</th>
                                <th>Description</th>
                                <th>Performed By</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="empty-state">
                                        <div className="empty-content">
                                            <FileText size={40} className="empty-icon" />
                                            <p>No logs found for this environment</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                logs.map(log => (
                                    <tr key={log.id}>
                                        <td className="whitespace-nowrap text-sm text-gray-500">
                                            {new Date(log.timestamp).toLocaleString()}
                                        </td>
                                        <td className="text-sm font-medium">
                                            {log.action}
                                        </td>
                                        <td className="text-sm">
                                            {log.description}
                                        </td>
                                        <td className="text-sm text-gray-500">
                                            {log.performedBy || 'System'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Members Tab */}
            {activeSection === 'members' && (
                <MembersTab project={project} isAdmin={isAdmin} />
            )}

            {/* Secret Modal */}
            <Modal
                isOpen={isSecretModalOpen}
                onClose={() => setIsSecretModalOpen(false)}
                title={editingSecret ? "Edit Secret" : "New Secret"}
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setIsSecretModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveSecret} disabled={saving}>
                            {saving ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                            Save Secret
                        </Button>
                    </>
                }
            >
                <div className="form-group">
                    <label>Key</label>
                    <Input
                        value={secretForm.key}
                        onChange={e => setSecretForm({ ...secretForm, key: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '') })}
                        placeholder="DATABASE_URL"
                        disabled={!!editingSecret}
                    />
                    <span className="help-text">Uppercase letters, numbers, and underscores only.</span>
                </div>
                <div className="form-group">
                    <label>Value</label>
                    <textarea
                        className="input textarea-field"
                        rows={4}
                        value={secretForm.value}
                        onChange={e => setSecretForm({ ...secretForm, value: e.target.value })}
                        placeholder="Enter secret value..."
                    />
                </div>
                <div className="form-group">
                    <label>Description (Optional)</label>
                    <Input
                        value={secretForm.description}
                        onChange={e => setSecretForm({ ...secretForm, description: e.target.value })}
                        placeholder="What is this secret for?"
                    />
                    <span className="help-text">Description is shared across all environments.</span>
                </div>
            </Modal>

            {/* Environment Modal */}
            <Modal
                isOpen={isEnvModalOpen}
                onClose={() => setIsEnvModalOpen(false)}
                title="New Environment"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setIsEnvModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreateEnv} disabled={saving}>
                            {saving ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                            Create Environment
                        </Button>
                    </>
                }
            >
                <div className="form-group">
                    <label>Name</label>
                    <Input
                        value={envForm.name}
                        onChange={e => setEnvForm({ ...envForm, name: e.target.value })}
                        placeholder="e.g. QA, UAT, Preview"
                    />
                </div>
                <div className="form-group">
                    <label>Slug</label>
                    <Input
                        value={envForm.slug}
                        onChange={e => setEnvForm({ ...envForm, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                        placeholder="e.g. qa, uat, preview"
                    />
                    <span className="help-text">URL-friendly identifier. Lowercase letters, numbers, and hyphens only.</span>
                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={deleteConfirm.open}
                onClose={() => setDeleteConfirm({ open: false, type: null, id: null, name: '' })}
                title={`Delete ${deleteConfirm.type === 'environment' ? 'Environment' : 'Secret'}`}
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setDeleteConfirm({ open: false, type: null, id: null, name: '' })}>
                            Cancel
                        </Button>
                        <Button variant="danger" onClick={executeDelete} disabled={saving}>
                            {saving ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                            Delete
                        </Button>
                    </>
                }
            >
                <div className="delete-confirm-content">
                    <AlertCircle size={48} className="delete-warning-icon" />
                    <p>
                        Are you sure you want to delete <strong>{deleteConfirm.name}</strong>?
                        {deleteConfirm.type === 'environment' && (
                            <span className="delete-warning"> This will also delete all secrets in this environment.</span>
                        )}
                    </p>
                    <p className="delete-note">This action cannot be undone.</p>
                </div>
            </Modal>

            {/* History Modal */}
            <Modal
                isOpen={isHistoryModalOpen}
                onClose={() => setIsHistoryModalOpen(false)}
                title="Secret History"
                footer={<Button onClick={() => setIsHistoryModalOpen(false)}>Close</Button>}
            >
                {historyLoading ? (
                    <div className="flex items-center justify-center p-8">
                        <Loader2 className="animate-spin" size={24} />
                    </div>
                ) : (
                    <div className="history-list">
                        {secretHistory.length === 0 ? (
                            <p className="text-gray-500 text-center py-4">No history available for this secret.</p>
                        ) : (
                            <ul className="space-y-4">
                                {secretHistory.map(log => (
                                    <li key={log.id} className="history-item border-b pb-3 last:border-0 last:pb-0">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-medium text-sm">{log.description}</p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {new Date(log.timestamp).toLocaleString()}
                                                </p>
                                            </div>
                                            {log.performedBy && (
                                                <span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-600">
                                                    {log.performedBy}
                                                </span>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}
            </Modal>

            {/* Propagation Modal */}
            <PropagationModal
                isOpen={propagation.isOpen}
                onClose={() => setPropagation(prev => ({ ...prev, isOpen: false }))}
                onConfirm={handlePropagationConfirm}
                isSaving={saving}
                environments={project.environments}
                currentEnvId={currentEnvId}
                affectedSecretsCount={propagation.affectedSecrets.length}
                affectedDescriptionsCount={propagation.affectedDescriptions?.length || 0}
            />

            {/* Global Save Footer */}
            {(Object.keys(drafts).length > 0 || Object.keys(descDrafts).length > 0) && (
                <div className="pv-save-bar">
                    <div className="flex items-center gap-4">
                        <span className="font-medium text-blue-900">
                            {Object.keys(drafts).length + Object.keys(descDrafts).length} unsaved changes
                        </span>
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" onClick={discardChanges} disabled={saving} className="bg-white/50 hover:bg-white text-blue-900">
                                Discard
                            </Button>
                            <Button onClick={handleGlobalSave} disabled={saving}>
                                {saving ? <Loader2 className="animate-spin mr-2" size={16} /> : <Save size={16} className="mr-2" />}
                                Save Changes
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
