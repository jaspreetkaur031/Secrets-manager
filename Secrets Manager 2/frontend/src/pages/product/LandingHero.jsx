import React from 'react';
import { Shield, ArrowRight } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import './ProductHub.css';

export default function LandingHero() {
    const [, setLocation] = useLocation();

    return (
        <div className="landing-page">
            <nav className="product-nav">
                <Link href="/" className="font-bold text-xl tracking-tighter">VAULTFLOW</Link>
                <div className="nav-links">
                    <Link href="/how-it-works">Workflow</Link>
                    <Link href="/security">Security</Link>
                    <Link href="/login" className="btn-primary">Sign In</Link>
                </div>
            </nav>

            <main className="hero-container">
                <div className="inline-block px-4 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 text-xs font-bold mb-6">
                    NOW WITH AES-GCM ENCRYPTION
                </div>
                <h1 className="hero-h1">Engineering Sync Into Your Infrastructure.</h1>
                <p className="text-dim text-lg max-w-2xl mx-auto mb-10">
                    Centralize your environment variables, encrypt them at rest, and sync them across every stage instantly.
                </p>
                <button className="btn-primary text-lg px-8 py-4" onClick={() => setLocation('/login')}>
                    Create Free Project <ArrowRight className="inline ml-2" size={20} />
                </button>
            </main>
        </div>
    );
}