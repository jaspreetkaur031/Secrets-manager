import React, { useState, useEffect } from 'react';
import { CheckCircle, RefreshCw, Clock, Copy, Eye, EyeOff, Check, Trash2, X, Split } from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from './ui/Button';

export function SecretRow({
    secret,
    value,
    registryEntry,
    allSecrets,
    isAdmin,
    isSaving,
    onDelete,
    onSync,
    onHistory,
    onCopyToClipboard,
    onCompare,
    onChange,
    onDescriptionSave,
    description: propDescription
}) {
    // Local state for UI only
    const [isRevealed, setIsRevealed] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

    // Controlled value (from parent drafts) or secret.value
    const displayValue = value !== undefined ? value : secret.value;
    const isDirty = displayValue !== secret.value;

    // Controlled description
    const description = propDescription !== undefined ? propDescription : (registryEntry?.description || '');
    const handleCopy = () => {
        onCopyToClipboard(secret.id, secret.value);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const getSyncStatus = () => {
        if (!registryEntry) return 'synced';
        const localTime = new Date(secret.updatedAt).getTime();
        const globalTime = new Date(registryEntry.lastUpdatedAt).getTime();

        if (localTime >= globalTime) return 'synced';

        // Value check
        const latestSecret = allSecrets
            .filter(s => s.key === secret.key)
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];

        if (latestSecret && latestSecret.value === secret.value) {
            return 'synced';
        }

        return 'outdated';
    };

    const status = getSyncStatus();

    // Sync local description with prop when it changes
    const [localDesc, setLocalDesc] = useState(description);
    useEffect(() => {
        setLocalDesc(description);
    }, [description]);

    const handleDescBlur = () => {
        if (localDesc !== description && onDescriptionSave) {
            onDescriptionSave(secret.key, localDesc);
        }
    };

    return (
        <>
            <tr className={cn("secret-row", isDirty && "bg-yellow-50/50")}>
                <td className="key-cell">
                    <code>{secret.key}</code>
                </td>
                <td className="value-cell">
                    <div className="flex flex-col gap-3">
                        <div className="value-container relative">
                            <div className="relative w-full">
                                <input
                                    type={isRevealed ? "text" : "password"}
                                    className={cn(
                                        "w-full bg-gray-800/50 border border-gray-700 rounded-md px-3 py-2 text-sm font-mono focus:border-blue-500 focus:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500/20 transition-all shadow-sm",
                                        !isRevealed && "text-gray-400 tracking-widest",
                                        isDirty ? "text-yellow-400 font-medium bg-yellow-900/20 border-yellow-700/50" : "text-gray-200"
                                    )}
                                    value={displayValue}
                                    onChange={(e) => onChange(secret.id, e.target.value)}
                                    onFocus={() => {
                                        setIsFocused(true);
                                        setIsRevealed(true);
                                    }}
                                    onBlur={() => setIsFocused(false)}
                                    spellCheck={false}
                                    placeholder="Empty value"
                                />
                            </div>
                        </div>

                        {/* Description - Click to Edit */}
                        <div className="relative w-full group pl-1">
                            <textarea
                                className={cn(
                                    "w-full bg-transparent border border-transparent rounded px-2 py-2 text-xs transition-all resize-none",
                                    "text-gray-400 hover:text-gray-300 focus:text-gray-100 placeholder:text-gray-600",
                                    "focus:bg-gray-800 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 focus:shadow-sm",
                                    "min-h-[48px] max-h-[160px] overflow-y-auto",
                                    "scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent hover:scrollbar-thumb-gray-600"
                                )}
                                rows={1}
                                value={localDesc}
                                onChange={(e) => {
                                    setLocalDesc(e.target.value);
                                    // Reset height to auto to correctly calculate scrollHeight
                                    e.target.style.height = 'auto';
                                    // Clamp the height to 160px maximum
                                    const newHeight = Math.min(e.target.scrollHeight, 160);
                                    e.target.style.height = `${newHeight}px`;
                                }}
                                onBlur={handleDescBlur}
                                placeholder="Add context..."
                                spellCheck={false}
                                style={{ maxHeight: '160px' }}
                            />
                        </div>
                    </div>
                </td>
                {/* Removed hidden desc-cell */}

                <td>
                    {status === 'synced' ? (
                        <div className="status-badge success">
                            <CheckCircle size={14} /> Synced
                        </div>
                    ) : (
                        <div className="sync-status-container">
                            <div className="status-badge warning" title="Value differs from latest version">
                                <RefreshCw size={14} /> Outdated
                            </div>
                            <button
                                className="history-btn"
                                onClick={() => onHistory(secret.id)}
                                title="View History"
                            >
                                <Clock size={14} />
                            </button>
                            {isAdmin && (
                                <button
                                    className="sync-btn"
                                    onClick={() => onSync(secret.id)}
                                    title="Mark as synced"
                                    disabled={isSaving}
                                >
                                    Mark Synced
                                </button>
                            )}
                        </div>
                    )}
                </td>
                <td className="actions-cell">
                    {/* Revert Button (Only if dirty) */}
                    {isDirty && (
                        <button
                            className="icon-btn mr-1"
                            onClick={() => onChange(secret.id, secret.value)}
                            title="Revert changes"
                        >
                            <X size={16} />
                        </button>
                    )}

                    <button
                        className="icon-btn"
                        onClick={() => setIsRevealed(!isRevealed)}
                        title={isRevealed ? "Hide Value" : "Reveal Value"}
                    >
                        {isRevealed ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <button
                        className={cn('icon-btn', isCopied && 'copied')}
                        onClick={handleCopy}
                        title="Copy value to clipboard"
                    >
                        {isCopied ? <Check size={16} /> : <Copy size={16} />}
                    </button>

                    {/* Compare Button */}
                    <button
                        className="icon-btn"
                        onClick={() => onCompare(secret.key)}
                        title="Compare across environments"
                    >
                        <Split size={16} />
                    </button>

                    {isAdmin && (
                        <button
                            className="icon-btn danger"
                            onClick={() => onDelete(secret.id, secret.key)}
                            title="Delete"
                        >
                            <Trash2 size={16} />
                        </button>
                    )}
                </td>
            </tr>
        </>
    );
}
