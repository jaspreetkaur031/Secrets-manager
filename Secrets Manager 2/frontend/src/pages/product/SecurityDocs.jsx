import React from 'react';
import { Lock, EyeOff, Key } from 'lucide-react';
import { Link } from 'wouter';
import './ProductHub.css';

export default function SecurityDocs() {
    return (
        <div>
            <nav className="product-nav">
                <Link href="/" className="font-bold text-xl tracking-tighter">VAULTFLOW</Link>
                <div className="nav-links">
                    <Link href="/how-it-works">Workflow</Link>
                    <Link href="/security">Security</Link>
                    <Link href="/login" className="btn-primary">Sign In</Link>
                </div>
            </nav>

            <main className="hero-container">
                <h1 className="hero-h1">Zero-Trust Encryption</h1>
                <div className="security-grid">
                    <div className="security-card">
                        <Key className="text-indigo-400 mb-4" />
                        <h3 className="font-bold mb-2">PBKDF2 Derivation</h3>
                        <p className="text-sm text-dim">Unique keys derived locally in your browser using 100k iterations.</p>
                    </div>
                    <div className="security-card">
                        <Lock className="text-indigo-400 mb-4" />
                        <h3 className="font-bold mb-2">AES-GCM 256-bit</h3>
                        <p className="text-sm text-dim">Industry standard authenticated encryption for every secret value.</p>
                    </div>
                    <div className="security-card">
                        <EyeOff className="text-indigo-400 mb-4" />
                        <h3 className="font-bold mb-2">At-Rest Security</h3>
                        <p className="text-sm text-dim">We never see your raw secrets. Decryption only happens in your RAM.</p>
                    </div>
                </div>
            </main>
        </div>
    );
}