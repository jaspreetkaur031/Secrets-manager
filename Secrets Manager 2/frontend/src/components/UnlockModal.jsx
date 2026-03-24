import React, { useState } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Lock, ShieldCheck } from 'lucide-react';

export function UnlockModal({ isOpen, projectName, onUnlock }) {
    const [passphrase, setPassphrase] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (passphrase.trim()) {
            onUnlock(passphrase);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            title="Project Locked"
            onClose={() => { }} // User must unlock to proceed
        >
            <form onSubmit={handleSubmit} className="space-y-6 py-2">
                <div className="flex flex-col items-center text-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
                        <Lock size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-white">Unlock {projectName}</h3>
                    <p className="text-sm text-slate-400">
                        Secrets are encrypted. Enter the master passphrase to decrypt them.
                    </p>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Master Passphrase
                    </label>
                    <Input
                        type="password"
                        placeholder="••••••••••••"
                        value={passphrase}
                        onChange={(e) => setPassphrase(e.target.value)}
                        autoFocus
                    />
                </div>

                <Button type="submit" className="w-full py-6 text-base">
                    <ShieldCheck size={18} className="mr-2" />
                    Decrypt Secrets
                </Button>
            </form>
        </Modal>
    );
}