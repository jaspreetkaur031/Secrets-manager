import React from 'react';
import { Database, RefreshCw, Shield } from 'lucide-react';
import { Link } from 'wouter';
import './ProductHub.css';

export default function Workflow() {
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
                <h1 className="hero-h1">The Lifecycle of a Secret</h1>
                <p className="text-dim">See how our Registry Pattern ensures your infrastructure stays in sync.</p>

                <div className="pipeline-card">
                    <div className="node-item">
                        <div className="node-icon-bg"><Database size={28} /></div>
                        <h3 className="font-bold text-sm">Global Registry</h3>
                        <p className="text-xs text-dim">Source of Truth</p>
                    </div>
                    <div className="connector"></div>
                    <div className="node-item">
                        <div className="node-icon-bg"><RefreshCw size={28} /></div>
                        <h3 className="font-bold text-sm">Staging</h3>
                        <p className="text-xs text-dim">Branch Configs</p>
                    </div>
                    <div className="connector"></div>
                    <div className="node-item">
                        <div className="node-icon-bg"><Shield size={28} /></div>
                        <h3 className="font-bold text-sm">Production</h3>
                        <p className="text-xs text-dim">Runtime Injection</p>
                    </div>
                </div>
            </main>
        </div>
    );
}