import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft, CheckCircle, RefreshCw, Eye, EyeOff, Loader2, Copy, Check, Lock, AlertCircle, Search } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { cn } from '../lib/utils';
import './CompareSecrets.css';

export default function CompareSecrets({ params }) {
    const { user } = useAuth();
    const [, setLocation] = useLocation();
    const slug = params?.slug;

    // Data State
    const [project, setProject] = useState(null);
    const [environments, setEnvironments] = useState([]);
    const [registry, setRegistry] = useState({});

    // Selection State
    const [selectedKey, setSelectedKey] = useState('');
    const [comparisonData, setComparisonData] = useState([]); // Array of { env, value, status, updatedAt }

    // UI State
    const [loading, setLoading] = useState(true);
    const [comparing, setComparing] = useState(false);
    const [error, setError] = useState(null);
    const [revealed, setRevealed] = useState({});
    const [copied, setCopied] = useState(null);
    const [suggestionOpen, setSuggestionOpen] = useState(false);
    const [keyInput, setKeyInput] = useState('');

    const isAdmin = user?.isAdmin || user?.is_admin;

    useEffect(() => {
        if (slug) loadProjectData();
    }, [slug]);

    // Parse query params for initial key selection
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const keyFromUrl = params.get('key');
        if (keyFromUrl) {
            setKeyInput(keyFromUrl);
            setSelectedKey(keyFromUrl);
        }
    }, []);

    useEffect(() => {
        if (project && selectedKey) {
            fetchComparison();
        }
    }, [project, selectedKey]);

    const loadProjectData = async () => {
        try {
            setLoading(true);
            const p = await api.getProject(slug);
            if (!p) throw new Error("Project not found");
            setProject(p);
            setEnvironments(p.environments);

            const r = await api.getSecretRegistry(p.id);
            setRegistry(r);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchComparison = async () => {
        if (!selectedKey) return;
        setComparing(true);
        try {
            // Fetch values across all environments
            const values = await api.getSecretKeyValues(project.id, selectedKey);

            // Find "Source of Truth" (Latest Updated)
            let maxDate = 0;
            let latestValue = null;

            values.forEach(v => {
                const d = new Date(v.updatedAt).getTime();
                if (d > maxDate) {
                    maxDate = d;
                    latestValue = v.value;
                }
            });

            // Build comparison rows
            const rows = environments.map(env => {
                const secretData = values.find(v => v.environmentId === env.id);

                let status = 'missing';
                if (secretData) {
                    status = secretData.value === latestValue ? 'synced' : 'outdated';
                }

                return {
                    env,
                    value: secretData ? secretData.value : null,
                    updatedAt: secretData ? secretData.updatedAt : null,
                    status,
                    isLatest: secretData && new Date(secretData.updatedAt).getTime() === maxDate
                };
            });

            setComparisonData(rows);
            setRevealed({}); // Reset reveals on new key
        } catch (e) {
            setError(e.message);
        } finally {
            setComparing(false);
        }
    };

    const handleSync = async (targetEnvId) => {
        // Find the "Latest" value from comparisonData
        const sourceRow = comparisonData.find(row => row.isLatest);
        if (!sourceRow || !sourceRow.value) return;

        try {
            setComparing(true); // show loading
            await api.saveSecret(project.id, targetEnvId, selectedKey, sourceRow.value, user);
            await fetchComparison(); // Refresh
        } catch (e) {
            setError(e.message);
            setComparing(false);
        }
    };

    const toggleReveal = (envId) => {
        setRevealed(prev => ({ ...prev, [envId]: !prev[envId] }));
    };

    const copyToClipboard = async (text, id) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(id);
            setTimeout(() => setCopied(null), 2000);
        } catch (e) {
            console.error(e);
        }
    };

    // Filter registry keys for autocomplete
    const filteredKeys = Object.keys(registry).filter(k =>
        k.toLowerCase().includes(keyInput.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 text-center">
                <AlertCircle className="mx-auto text-red-500 mb-4" size={32} />
                <h2 className="text-xl font-bold mb-2">Error</h2>
                <p className="text-gray-600 mb-4">{error}</p>
                <Button onClick={() => setLocation('/')}>Back to Dashboard</Button>
            </div>
        );
    }

    return (
        <div className="compare-page max-w-5xl mx-auto p-8 font-sans text-gray-100">
            {/* Header */}
            <div className="mb-8">
                <Button
                    variant="ghost"
                    onClick={() => setLocation(`/project/${slug}`)}
                    className="mb-6 pl-0 text-gray-400 hover:text-white hover:bg-transparent transition-colors group"
                >
                    <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" />
                    Back to Project
                </Button>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">Compare Secrets</h1>
                        <p className="text-gray-400 mt-2 text-lg">View and sync a secret across all environments.</p>
                    </div>
                </div>
            </div>

            {/* Search Section */}
            <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-8 mb-8 backdrop-blur-sm">
                <label className="block text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">
                    Select Secret Key
                </label>
                <div className="relative max-w-2xl">
                    <div className="relative">
                        <Input
                            value={keyInput}
                            onChange={(e) => {
                                setKeyInput(e.target.value.toUpperCase());
                                setSuggestionOpen(true);
                                if (e.target.value === '') setSelectedKey('');
                            }}
                            onFocus={() => setSuggestionOpen(true)}
                            onBlur={() => setTimeout(() => setSuggestionOpen(false), 200)}
                            placeholder="SEARCH_FOR_A_KEY..."
                            className="pl-12 py-6 text-lg bg-gray-950 border-gray-700 text-white placeholder-gray-600 focus:ring-blue-500/50 focus:border-blue-500 rounded-lg shadow-inner font-mono"
                        />
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                            <span className="text-xl">🔍</span>
                        </div>
                    </div>

                    {suggestionOpen && filteredKeys.length > 0 && (
                        <div className="absolute z-50 w-full bg-gray-900 border border-gray-700 rounded-lg shadow-2xl mt-2 max-h-80 overflow-y-auto divide-y divide-gray-800">
                            {filteredKeys.map(key => (
                                <div
                                    key={key}
                                    className="px-5 py-3 hover:bg-blue-900/20 cursor-pointer text-sm font-mono text-gray-300 hover:text-white transition-colors flex items-center"
                                    onClick={() => {
                                        setKeyInput(key);
                                        setSelectedKey(key);
                                        setSuggestionOpen(false);
                                    }}
                                >
                                    <span className="w-2 h-2 rounded-full bg-gray-600 mr-3"></span>
                                    {key}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Content Area */}
            {selectedKey ? (
                <div className="bg-gray-900/50 rounded-xl border border-gray-800 overflow-hidden backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="px-8 py-6 border-b border-gray-800 bg-gray-900/80 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/10 rounded-lg">
                                <Lock className="text-blue-400" size={20} />
                            </div>
                            <h2 className="font-bold text-white font-mono text-xl tracking-wide">{selectedKey}</h2>
                        </div>
                        {comparing && (
                            <div className="flex items-center text-sm text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-full">
                                <Loader2 size={14} className="animate-spin mr-2" />
                                Comparing...
                            </div>
                        )}
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-950/50 border-b border-gray-800">
                                    <th className="px-8 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Environment</th>
                                    <th className="px-8 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Value</th>
                                    <th className="px-8 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-40">Status</th>
                                    <th className="px-8 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-40 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {comparisonData.map((row) => (
                                    <tr key={row.env.id} className="hover:bg-gray-800/30 transition-colors group">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center">
                                                <div className={cn(
                                                    "w-2 h-8 rounded-full mr-4",
                                                    row.env.isProduction ? "bg-purple-500" :
                                                        row.env.slug === 'staging' ? "bg-orange-500" : "bg-blue-500"
                                                )}></div>
                                                <div>
                                                    <span className="font-semibold text-gray-200 block text-base">{row.env.name}</span>
                                                    <span className="text-xs text-gray-500 uppercase tracking-wider">{row.env.slug}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            {row.status === 'missing' ? (
                                                <span className="text-gray-600 italic text-sm flex items-center gap-2">
                                                    <AlertCircle size={14} /> No value set
                                                </span>
                                            ) : (
                                                <div className="flex items-center font-mono text-sm bg-gray-950 rounded-lg px-4 py-3 max-w-lg border border-gray-800 group-hover:border-gray-700 transition-colors">
                                                    <span className="truncate flex-1 text-gray-300">
                                                        {revealed[row.env.id] ? row.value : '••••••••••••••••••••••••'}
                                                    </span>
                                                    <div className="flex items-center gap-1 pl-3 border-l border-gray-800 ml-3">
                                                        <button
                                                            onClick={() => toggleReveal(row.env.id)}
                                                            className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-800 rounded transition-all"
                                                            title={revealed[row.env.id] ? "Hide" : "Reveal"}
                                                        >
                                                            {revealed[row.env.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                                                        </button>
                                                        {revealed[row.env.id] && (
                                                            <button
                                                                onClick={() => copyToClipboard(row.value, row.env.id)}
                                                                className={cn(
                                                                    "p-1.5 rounded transition-all",
                                                                    copied === row.env.id
                                                                        ? "text-green-400 bg-green-900/20"
                                                                        : "text-gray-500 hover:text-white hover:bg-gray-800"
                                                                )}
                                                                title="Copy"
                                                            >
                                                                {copied === row.env.id ? <Check size={16} /> : <Copy size={16} />}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-8 py-5">
                                            {row.status === 'synced' && (
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-500/10 text-green-400 border border-green-500/20">
                                                    <CheckCircle size={14} className="mr-1.5" /> Synced
                                                </span>
                                            )}
                                            {row.status === 'outdated' && (
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                                                    <RefreshCw size={14} className="mr-1.5" /> Outdated
                                                </span>
                                            )}
                                            {row.status === 'missing' && (
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gray-800 text-gray-400 border border-gray-700">
                                                    Missing
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            {(row.status === 'outdated' || row.status === 'missing') && isAdmin && (
                                                <Button
                                                    size="sm"
                                                    className="bg-blue-600 hover:bg-blue-500 text-white border-0 shadow-lg shadow-blue-900/20"
                                                    onClick={() => handleSync(row.env.id)}
                                                    disabled={comparing}
                                                >
                                                    <RefreshCw size={14} className="mr-2" /> Sync
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="text-center py-20 rounded-xl border border-gray-800 border-dashed bg-gray-900/30">
                    <div className="bg-gray-800/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock className="text-gray-600" size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">No Secret Selected</h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                        Search for a secret key above to view and compare its values across all your environments.
                    </p>
                </div>
            )}
        </div>
    );
}
