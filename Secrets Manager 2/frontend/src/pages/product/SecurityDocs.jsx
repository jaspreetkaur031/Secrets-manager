import React, { useState } from 'react';
import { Lock, EyeOff, Key, Shield, ArrowRight, CheckCircle } from 'lucide-react';
import { Link } from 'wouter';
import './ProductHub.css';

// Generate particle positions once at module level to avoid Math.random in render
const generateParticleStyles = () => {
    return [...Array(20)].map(() => ({
        left: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 10}s`,
        animationDuration: `${10 + Math.random() * 10}s`
    }));
};

const particleStyles = generateParticleStyles();

export default function SecurityDocs() {
    const [isLoaded] = useState(true);
    const [hoveredCard, setHoveredCard] = useState(null);

    const securityFeatures = [
        {
            icon: Key,
            title: "PBKDF2 Derivation",
            description: "Unique keys derived locally in your browser using 100k iterations.",
            details: "Each secret gets its own cryptographic key derived from your master password using PBKDF2 with 100,000 iterations, making brute-force attacks computationally infeasible."
        },
        {
            icon: Lock,
            title: "AES-GCM 256-bit",
            description: "Industry standard authenticated encryption for every secret value.",
            details: "All secrets are encrypted using AES-256-GCM, providing both confidentiality and integrity. Each encryption uses a unique initialization vector for maximum security."
        },
        {
            icon: EyeOff,
            title: "At-Rest Security",
            description: "We never see your raw secrets. Decryption only happens in your RAM.",
            details: "Secrets are encrypted before leaving your browser and remain encrypted in our database. Decryption keys are never stored and only exist temporarily in memory."
        }
    ];

    return (
        <div className="security-page">
            {/* Animated Background */}
            <div className="animated-bg">
                <div className="security-shapes">
                    <div className="security-shape-1"></div>
                    <div className="security-shape-2"></div>
                    <div className="security-shape-3"></div>
                    <div className="security-particles">
                        {particleStyles.map((style, i) => (
                            <div key={i} className="security-particle" style={style}></div>
                        ))}
                    </div>
                </div>
            </div>

            <nav className={`product-nav ${isLoaded ? 'animate-in' : ''}`}>
                <Link href="/" className="brand-logo">
                    <Shield className="brand-icon" />
                    <span className="brand-text">VAULTFLOW</span>
                </Link>
                <div className="nav-links">
                    <Link href="/how-it-works" className="nav-link">Workflow</Link>
                    <Link href="/security" className="nav-link active">Security</Link>
                    <Link href="/login" className="btn-primary nav-cta">Sign In</Link>
                </div>
            </nav>

            <main className="security-container">
                <div className={`security-header ${isLoaded ? 'animate-in-delay-1' : ''}`}>
                    <h1 className="security-title">
                        <span className="title-gradient">Zero-Trust</span>
                        <br />
                        <span className="title-secondary">Encryption</span>
                    </h1>
                    <p className="security-subtitle">
                        Military-grade security with client-side encryption and zero knowledge architecture.
                    </p>
                </div>

                <div className={`security-grid ${isLoaded ? 'animate-in-delay-2' : ''}`}>
                    {securityFeatures.map((feature, index) => {
                        const Icon = feature.icon;
                        const isHovered = hoveredCard === index;

                        return (
                            <div
                                key={index}
                                className={`security-card ${isHovered ? 'hovered' : ''}`}
                                onMouseEnter={() => setHoveredCard(index)}
                                onMouseLeave={() => setHoveredCard(null)}
                                style={{ animationDelay: `${0.2 * index}s` }}
                            >
                                <div className="security-icon-bg">
                                    <Icon size={32} className={isHovered ? 'animate-pulse' : ''} />
                                    {isHovered && <div className="security-glow"></div>}
                                </div>
                                <h3 className="security-card-title">{feature.title}</h3>
                                <p className="security-card-description">{feature.description}</p>
                                {isHovered && (
                                    <div className="security-details">
                                        <p>{feature.details}</p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className={`security-trust ${isLoaded ? 'animate-in-delay-3' : ''}`}>
                    <div className="trust-grid">
                        <div className="trust-item">
                            <CheckCircle className="trust-check" size={24} />
                            <div>
                                <h4>Client-Side Only</h4>
                                <p>Encryption happens in your browser, never on our servers</p>
                            </div>
                        </div>
                        <div className="trust-item">
                            <CheckCircle className="trust-check" size={24} />
                            <div>
                                <h4>Zero Knowledge</h4>
                                <p>We cannot access your decrypted secrets under any circumstances</p>
                            </div>
                        </div>
                        <div className="trust-item">
                            <CheckCircle className="trust-check" size={24} />
                            <div>
                                <h4>Open Source</h4>
                                <p>Security implementations are fully auditable and transparent</p>
                            </div>
                        </div>
                        <div className="trust-item">
                            <CheckCircle className="trust-check" size={24} />
                            <div>
                                <h4>Regular Audits</h4>
                                <p>Independent security audits conducted annually</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={`security-cta ${isLoaded ? 'animate-in-delay-4' : ''}`}>
                    <Link href="/login" className="btn-primary security-btn">
                        <span>Secure Your Secrets</span>
                        <ArrowRight size={20} />
                    </Link>
                </div>
            </main>
        </div>
    );
}