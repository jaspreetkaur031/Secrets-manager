import React, { useState } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Check, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

export function PropagationModal({
    isOpen,
    onClose,
    onConfirm,
    isSaving,
    environments,
    currentEnvId,
    affectedSecretsCount,
    affectedDescriptionsCount = 0
}) {
    const otherEnvs = environments.filter(e => e.id !== currentEnvId);
    const [selectedEnvIds, setSelectedEnvIds] = useState([]);

    const toggleEnv = (id) => {
        setSelectedEnvIds(prev =>
            prev.includes(id)
                ? prev.filter(eId => eId !== id)
                : [...prev, id]
        );
    };

    const handleConfirm = () => {
        onConfirm(selectedEnvIds);
    };

    const hasSecrets = affectedSecretsCount > 0;
    const hasDescriptions = affectedDescriptionsCount > 0;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Propagate Changes"
            footer={
                <>
                    <Button variant="ghost" onClick={onClose} disabled={isSaving}>
                        {hasSecrets ? 'Skip / Done' : 'Close'}
                    </Button>
                    {hasSecrets && (
                        <Button
                            onClick={handleConfirm}
                            disabled={isSaving || selectedEnvIds.length === 0}
                        >
                            {isSaving ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                            Apply to Selected ({selectedEnvIds.length})
                        </Button>
                    )}
                </>
            }
        >
            <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-100 p-3 rounded-md flex items-start gap-3">
                    <AlertCircle className="text-blue-500 mt-0.5" size={18} />
                    <div className="text-sm text-blue-700">
                        <p>
                            You updated
                            {hasSecrets && <strong> {affectedSecretsCount} secret{affectedSecretsCount !== 1 ? 's' : ''}</strong>}
                            {hasSecrets && hasDescriptions && ' and '}
                            {hasDescriptions && <strong> {affectedDescriptionsCount} description{affectedDescriptionsCount !== 1 ? 's' : ''}</strong>}
                            .
                        </p>
                        {hasDescriptions && (
                            <p className="mt-2 text-blue-800 font-medium">
                                Note: Description updates have been applied to all environments automatically.
                            </p>
                        )}
                        {hasSecrets && (
                            <p className="mt-1">
                                Do you want to apply the secret <strong>values</strong> to other environments as well?
                            </p>
                        )}
                    </div>
                </div>

                {hasSecrets && (
                    <div className="border rounded-md overflow-hidden">
                        <div className="bg-gray-50 px-4 py-2 border-b text-xs font-semibold text-gray-500 uppercase">
                            Available Environments
                        </div>
                        {otherEnvs.length === 0 ? (
                            <div className="p-4 text-center text-sm text-gray-400">
                                No other environments available.
                            </div>
                        ) : (
                            <div className="divide-y">
                                {otherEnvs.map(env => (
                                    <label
                                        key={env.id}
                                        className={cn(
                                            "flex items-center p-3 cursor-pointer hover:bg-gray-50 transition-colors",
                                            selectedEnvIds.includes(env.id) && "bg-blue-50 hover:bg-blue-50"
                                        )}
                                    >
                                        <input
                                            type="checkbox"
                                            className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                            checked={selectedEnvIds.includes(env.id)}
                                            onChange={() => toggleEnv(env.id)}
                                        />
                                        <span className="ml-3 text-sm font-medium text-gray-900">
                                            {env.name}
                                            <span className="text-gray-400 font-normal ml-1">({env.slug})</span>
                                        </span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Modal>
    );
}
