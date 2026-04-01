import React, { useState, useEffect, useRef } from 'react';
import { Shield, ArrowRight, Sparkles, Lock, Zap, Globe, Database, RefreshCw, Key, CheckCircle, Star, Users, Clock, Code } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import './ProductHub.css';

export default function LandingHero() {
    const [, setLocation] = useLocation();
    const [isLoaded] = useState(true);
    const [counters, setCounters] = useState({ projects: 0, secrets: 0, uptime: 0 });
    const [bubbleStyles] = useState(() =>
        Array.from({ length: 20 }, () => ({
            width: `${Math.random() * 100 + 20}px`,
            height: `${Math.random() * 100 + 20}px`,
            left: `${Math.random() * 90}%`,
            animationDelay: `${Math.random() * 10}s`,
            animationDuration: `${Math.random() * 10 + 6}s`
        }))
    );
    const statsRef = useRef(null);

    // Counter animation
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    const animateCounter = (start, end, duration, setValue) => {
                        const startTime = Date.now();
                        const animate = () => {
                            const elapsed = Date.now() - startTime;
                            const progress = Math.min(elapsed / duration, 1);
                            const current = Math.floor(start + (end - start) * progress);
                            setValue(current);
                            if (progress < 1) requestAnimationFrame(animate);
                        };
                        animate();
                    };

                    animateCounter(0, 10000, 2000, (value) => setCounters(prev => ({ ...prev, projects: value })));
                    animateCounter(0, 500000, 2500, (value) => setCounters(prev => ({ ...prev, secrets: value })));
                    animateCounter(0, 99, 1500, (value) => setCounters(prev => ({ ...prev, uptime: value })));
                }
            },
            { threshold: 0.5 }
        );

        if (statsRef.current) observer.observe(statsRef.current);
        return () => observer.disconnect();
    }, []);

    const features = [
        {
            icon: Lock,
            title: "Military-Grade Encryption",
            description: "AES-256-GCM encryption with PBKDF2 key derivation ensures your secrets are protected with industry-standard security.",
            color: "from-red-500 to-pink-500"
        },
        {
            icon: Zap,
            title: "Real-Time Synchronization",
            description: "Changes propagate instantly across all environments with sub-100ms latency and zero downtime deployments.",
            color: "from-yellow-500 to-orange-500"
        },
        {
            icon: Globe,
            title: "Multi-Environment Support",
            description: "Seamlessly manage secrets across development, staging, and production with granular access controls.",
            color: "from-blue-500 to-purple-500"
        },
        {
            icon: Database,
            title: "Registry Pattern",
            description: "Centralized secret management with version control, audit trails, and rollback capabilities.",
            color: "from-green-500 to-teal-500"
        },
        {
            icon: RefreshCw,
            title: "Zero-Knowledge Architecture",
            description: "Your secrets never leave your browser. Encryption and decryption happen client-side only.",
            color: "from-indigo-500 to-blue-500"
        },
        {
            icon: Shield,
            title: "Compliance Ready",
            description: "Built with SOC 2, GDPR, and HIPAA compliance in mind for enterprise-grade security requirements.",
            color: "from-purple-500 to-pink-500"
        }
    ];

    const steps = [
        {
            step: "01",
            title: "Create Your Registry",
            description: "Set up a centralized vault for all your environment variables with our intuitive web interface.",
            icon: Database
        },
        {
            step: "02",
            title: "Encrypt & Store",
            description: "Secrets are encrypted client-side using AES-256-GCM before being stored in our secure database.",
            icon: Lock
        },
        {
            step: "03",
            title: "Sync Across Environments",
            description: "Deployments automatically pull the latest encrypted secrets and decrypt them at runtime.",
            icon: RefreshCw
        }
    ];

    const testimonials = [
        {
            quote: "VaultFlow transformed our deployment process. Zero secrets in our codebase, instant sync across 50+ services.",
            author: "Sarah Chen",
            role: "DevOps Lead",
            company: "TechCorp",
            avatar: "SC"
        },
        {
            quote: "The client-side encryption gives us complete peace of mind. Our secrets are truly secure.",
            author: "Marcus Rodriguez",
            role: "Security Engineer",
            company: "FinSecure",
            avatar: "MR"
        },
        {
            quote: "Setup took 5 minutes, and our entire team was productive immediately. Game-changing tool.",
            author: "Emily Watson",
            role: "Full Stack Developer",
            company: "StartupXYZ",
            avatar: "EW"
        }
    ];

    return (
        <div className="landing-page">
            {/* Real World Objects Animation */}
            <div className="floating-objects">
                {bubbleStyles.map((style, i) => {
                    const objectTypes = ['key', 'lock', 'shield', 'document', 'server', 'code', 'database', 'cloud'];
                    const sizes = ['small', 'medium', 'large'];
                    const objectType = objectTypes[i % objectTypes.length];
                    const size = sizes[i % sizes.length];

                    return (
                        <div
                            key={i}
                            className={`object ${objectType} ${size}`}
                            style={style}
                        />
                    );
                })}
            </div>

            <nav className={`product-nav ${isLoaded ? 'animate-in' : ''}`}>
                <Link href="/" className="brand-logo">
                    <Shield className="brand-icon" />
                    <span className="brand-text">VAULTFLOW</span>
                </Link>
                <div className="nav-links">
                    <a href="#features" className="nav-link">Features</a>
                    <a href="#how-it-works" className="nav-link">How It Works</a>
                    <a href="#benefits" className="nav-link">Benefits</a>
                    <Link href="/login" className="btn-primary nav-cta">Sign In</Link>
                </div>
            </nav>

            {/* Hero Section */}
            <section id="hero" className="hero-section">
                <div className={`badge ${isLoaded ? 'animate-in-delay-1' : ''}`}>
                    <Sparkles className="badge-icon" size={14} />
                    <span>NOW WITH AES-GCM ENCRYPTION</span>
                    <div className="badge-glow"></div>
                </div>

                <h1 className={`hero-h1 ${isLoaded ? 'animate-in-delay-2' : ''}`}>
                    <span className="hero-text-gradient">Engineering Sync</span>
                    <br />
                    <span className="hero-text-secondary">Into Your Infrastructure</span>
                </h1>

                <p className={`hero-description ${isLoaded ? 'animate-in-delay-3' : ''}`}>
                    Centralize your environment variables, encrypt them at rest, and sync them across every stage instantly.
                </p>

                <div className={`hero-actions ${isLoaded ? 'animate-in-delay-4' : ''}`}>
                    <button className="btn-primary hero-cta" onClick={() => setLocation('/login')}>
                        <span>Create Free Project</span>
                        <ArrowRight className="cta-arrow" size={20} />
                        <div className="btn-glow"></div>
                    </button>
                    <div className="hero-features">
                        <div className="feature-item">
                            <Lock className="feature-icon" size={16} />
                            <span>End-to-End Encrypted</span>
                        </div>
                        <div className="feature-item">
                            <Zap className="feature-icon" size={16} />
                            <span>Real-time Sync</span>
                        </div>
                        <div className="feature-item">
                            <Globe className="feature-icon" size={16} />
                            <span>Multi-Environment</span>
                        </div>
                    </div>
                </div>

                {/* Animated Stats */}
                <div ref={statsRef} className={`hero-stats ${isLoaded ? 'animate-in-delay-5' : ''}`}>
                    <div className="stat-item">
                        <div className="stat-number">{counters.uptime.toFixed(1)}%</div>
                        <div className="stat-label">Uptime</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-number">256-bit</div>
                        <div className="stat-label">AES Encryption</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-number">&lt;100ms</div>
                        <div className="stat-label">Sync Latency</div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="features-section">
                <div className="features-container">
                    <div className="section-header">
                        <h2 className="section-title">Why Choose VaultFlow?</h2>
                        <p className="section-subtitle">
                            Built for modern engineering teams who demand security, speed, and reliability.
                        </p>
                    </div>

                    <div className="features-grid">
                        {features.map((feature, index) => {
                            const Icon = feature.icon;
                            return (
                                <div key={index} className="feature-card" style={{ animationDelay: `${index * 0.1}s` }}>
                                    <div className={`feature-icon-bg bg-gradient-to-br ${feature.color}`}>
                                        <Icon size={32} />
                                    </div>
                                    <h3 className="feature-title">{feature.title}</h3>
                                    <p className="feature-description">{feature.description}</p>
                                    <div className="feature-glow"></div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section id="how-it-works" className="how-it-works-section">
                <div className="how-it-works-container">
                    <div className="section-header">
                        <h2 className="section-title">How It Works</h2>
                        <p className="section-subtitle">
                            Three simple steps to secure, centralized secret management.
                        </p>
                    </div>

                    {/* Process Flow Illustration */}
                    <div className="process-flow-illustration">
                        <svg viewBox="0 0 1000 400" className="process-svg">
                            <defs>
                                <marker id="arrowhead" markerWidth="10" markerHeight="7"
                                        refX="9" refY="3.5" orient="auto">
                                    <polygon points="0 0, 10 3.5, 0 7" fill="rgba(129, 140, 248, 0.6)" />
                                </marker>
                                <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="rgba(129, 140, 248, 0.3)" />
                                    <stop offset="50%" stopColor="rgba(34, 197, 94, 0.3)" />
                                    <stop offset="100%" stopColor="rgba(168, 85, 247, 0.3)" />
                                </linearGradient>
                            </defs>

                            {/* Central Registry */}
                            <g className="registry-node">
                                <rect x="450" y="150" width="100" height="60" rx="8" fill="rgba(129, 140, 248, 0.2)" stroke="rgba(129, 140, 248, 0.5)" strokeWidth="2"/>
                                <text x="500" y="175" textAnchor="middle" fontSize="12" fill="white" fontWeight="600">Registry</text>
                                <text x="500" y="190" textAnchor="middle" fontSize="10" fill="white">Source of Truth</text>
                            </g>

                            {/* Development Environment */}
                            <g className="dev-node">
                                <rect x="200" y="50" width="80" height="50" rx="6" fill="rgba(34, 197, 94, 0.2)" stroke="rgba(34, 197, 94, 0.5)" strokeWidth="2"/>
                                <text x="240" y="70" textAnchor="middle" fontSize="10" fill="white" fontWeight="600" >Dev</text>
                                <text x="240" y="82" textAnchor="middle" fontSize="8" fill="white">Local</text>
                            </g>

                            {/* Staging Environment */}
                            <g className="staging-node">
                                <rect x="200" y="250" width="80" height="50" rx="6" fill="rgba(244, 114, 182, 0.2)" stroke="rgba(244, 114, 182, 0.5)" strokeWidth="2"/>
                                <text x="240" y="270" textAnchor="middle" fontSize="10" fill="white" fontWeight="600">Staging</text>
                                <text x="240" y="282" textAnchor="middle" fontSize="8" fill="white">Test</text>
                            </g>

                            {/* Production Environment */}
                            <g className="prod-node">
                                <rect x="720" y="150" width="80" height="50" rx="6" fill="rgba(168, 85, 247, 0.2)" stroke="rgba(168, 85, 247, 0.5)" strokeWidth="2"/>
                                <text x="760" y="170" textAnchor="middle" fontSize="10" fill="white" fontWeight="600">Prod</text>
                                <text x="760" y="182" textAnchor="middle" fontSize="8" fill="white">Live</text>
                            </g>

                            {/* Flow Lines */}
                            <path d="M280 75 Q400 75 450 180" stroke="url(#flowGradient)" strokeWidth="3" fill="none" markerEnd="url(#arrowhead)"/>
                            <path d="M280 275 Q400 275 450 180" stroke="url(#flowGradient)" strokeWidth="3" fill="none" markerEnd="url(#arrowhead)"/>
                            <path d="M550 180 Q650 180 720 175" stroke="url(#flowGradient)" strokeWidth="3" fill="none" markerEnd="url(#arrowhead)"/>

                            {/* Encryption Indicators */}
                            <g className="encryption-indicators">
                                <circle cx="365" cy="127" r="4" fill="rgba(129, 140, 248, 0.8)">
                                    <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite"/>
                                </circle>
                                <circle cx="365" cy="233" r="4" fill="rgba(34, 197, 94, 0.8)">
                                    <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite"/>
                                </circle>
                                <circle cx="600" cy="180" r="4" fill="rgba(168, 85, 247, 0.8)">
                                    <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite"/>
                                </circle>
                            </g>
                        </svg>
                    </div>

                    <div className="steps-container">
                        {steps.map((step, index) => {
                            const Icon = step.icon;
                            return (
                                <div key={index} className="step-item">
                                    <div className="step-number">{step.step}</div>
                                    <div className="step-content">
                                        <div className="step-icon">
                                            <Icon size={24} />
                                        </div>
                                        <h3 className="step-title">{step.title}</h3>
                                        <p className="step-description">{step.description}</p>
                                    </div>
                                    {index < steps.length - 1 && <div className="step-connector"></div>}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section id="benefits" className="benefits-section">
                <div className="benefits-container">
                    <div className="benefits-content">
                        <div className="benefits-text">
                            <h2 className="benefits-title">Secure Your Development Workflow</h2>
                            <p className="benefits-description">
                                Stop committing secrets to your codebase. Stop managing environment variables manually.
                                Start building with confidence knowing your secrets are encrypted, versioned, and automatically synced.
                            </p>
                            <div className="benefits-list">
                                <div className="benefit-item">
                                    <CheckCircle className="benefit-check" size={20} />
                                    <span>Eliminate secret leaks in version control</span>
                                </div>
                                <div className="benefit-item">
                                    <CheckCircle className="benefit-check" size={20} />
                                    <span>Instant deployment without environment setup</span>
                                </div>
                                <div className="benefit-item">
                                    <CheckCircle className="benefit-check" size={20} />
                                    <span>Audit trail for all secret changes</span>
                                </div>
                                <div className="benefit-item">
                                    <CheckCircle className="benefit-check" size={20} />
                                    <span>Zero downtime secret rotation</span>
                                </div>
                            </div>
                        </div>
                        <div className="benefits-visual">
                            <div className="security-shield-container">
                                <svg viewBox="0 0 400 500" className="security-shield-svg">
                                    <defs>
                                        <radialGradient id="shieldGradient" cx="50%" cy="30%" r="70%">
                                            <stop offset="0%" stopColor="rgba(129, 140, 248, 0.8)" />
                                            <stop offset="70%" stopColor="rgba(34, 197, 94, 0.6)" />
                                            <stop offset="100%" stopColor="rgba(168, 85, 247, 0.4)" />
                                        </radialGradient>
                                        <linearGradient id="layerGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stopColor="rgba(129, 140, 248, 0.3)" />
                                            <stop offset="100%" stopColor="rgba(129, 140, 248, 0.1)" />
                                        </linearGradient>
                                        <linearGradient id="layerGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stopColor="rgba(34, 197, 94, 0.3)" />
                                            <stop offset="100%" stopColor="rgba(34, 197, 94, 0.1)" />
                                        </linearGradient>
                                        <linearGradient id="layerGradient3" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stopColor="rgba(168, 85, 247, 0.3)" />
                                            <stop offset="100%" stopColor="rgba(168, 85, 247, 0.1)" />
                                        </linearGradient>
                                    </defs>

                                    {/* Main Shield */}
                                    <path d="M200 50 L350 120 L350 350 Q350 400 300 420 L200 450 L100 420 Q50 400 50 350 L50 120 Z"
                                          fill="url(#shieldGradient)"
                                          stroke="rgba(255, 255, 255, 0.2)"
                                          strokeWidth="2"
                                          className="main-shield"/>

                                    {/* Protection Layers */}
                                    <path d="M200 70 L330 130 L330 330 Q330 370 285 385 L200 410 L115 385 Q70 370 70 330 L70 130 Z"
                                          fill="url(#layerGradient1)"
                                          className="protection-layer layer-1"/>
                                    <path d="M200 90 L310 140 L310 310 Q310 340 270 350 L200 370 L130 350 Q90 340 90 310 L90 140 Z"
                                          fill="url(#layerGradient2)"
                                          className="protection-layer layer-2"/>
                                    <path d="M200 110 L290 150 L290 290 Q290 310 255 315 L200 330 L145 315 Q110 310 110 290 L110 150 Z"
                                          fill="url(#layerGradient3)"
                                          className="protection-layer layer-3"/>

                                    {/* Security Elements */}
                                    <g className="security-elements">
                                        {/* Lock Icon */}
                                        <g transform="translate(180, 200)">
                                            <rect x="5" y="15" width="20" height="15" rx="2" fill="none" stroke="rgba(255, 255, 255, 0.8)" strokeWidth="2"/>
                                            <path d="M10 15 Q10 10 15 10 Q20 10 20 15" fill="none" stroke="rgba(255, 255, 255, 0.8)" strokeWidth="2"/>
                                            <circle cx="15" cy="22" r="3" fill="none" stroke="rgba(255, 255, 255, 0.8)" strokeWidth="2"/>
                                        </g>

                                        {/* Encryption Symbols */}
                                        <g className="encryption-symbols">
                                            <text x="200" y="160" textAnchor="middle" fontSize="16" fill="rgba(255, 255, 255, 0.9)" fontWeight="bold">🔐</text>
                                            <text x="160" y="250" textAnchor="middle" fontSize="14" fill="rgba(255, 255, 255, 0.8)">AES-256</text>
                                            <text x="240" y="250" textAnchor="middle" fontSize="14" fill="rgba(255, 255, 255, 0.8)">TLS 1.3</text>
                                            <text x="200" y="300" textAnchor="middle" fontSize="12" fill="rgba(255, 255, 255, 0.7)">Zero Trust</text>
                                        </g>

                                        {/* Protection Rings */}
                                        <circle cx="200" cy="200" r="80" fill="none" stroke="rgba(129, 140, 248, 0.3)" strokeWidth="1" className="protection-ring ring-1"/>
                                        <circle cx="200" cy="200" r="60" fill="none" stroke="rgba(34, 197, 94, 0.3)" strokeWidth="1" className="protection-ring ring-2"/>
                                        <circle cx="200" cy="200" r="40" fill="none" stroke="rgba(168, 85, 247, 0.3)" strokeWidth="1" className="protection-ring ring-3"/>
                                    </g>

                                    {/* Floating Particles */}
                                    <g className="floating-particles">
                                        <circle cx="120" cy="180" r="2" fill="rgba(129, 140, 248, 0.6)" className="particle p1"/>
                                        <circle cx="280" cy="220" r="2" fill="rgba(34, 197, 94, 0.6)" className="particle p2"/>
                                        <circle cx="150" cy="320" r="2" fill="rgba(168, 85, 247, 0.6)" className="particle p3"/>
                                        <circle cx="250" cy="160" r="2" fill="rgba(129, 140, 248, 0.6)" className="particle p4"/>
                                        <circle cx="180" cy="380" r="2" fill="rgba(34, 197, 94, 0.6)" className="particle p5"/>
                                    </g>
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section id="testimonials" className="testimonials-section">
                <div className="testimonials-container">
                    <div className="section-header">
                        <h2 className="section-title">Trusted by Engineering Teams</h2>
                        <p className="section-subtitle">
                            Join thousands of developers who have secured their infrastructure with VaultFlow.
                        </p>
                    </div>

                    <div className="testimonials-grid">
                        {testimonials.map((testimonial, index) => (
                            <div key={index} className="testimonial-card">
                                <div className="testimonial-stars">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className="star-icon" size={16} fill="currentColor" />
                                    ))}
                                </div>
                                <blockquote className="testimonial-quote">
                                    "{testimonial.quote}"
                                </blockquote>
                                <div className="testimonial-author">
                                    <div className="author-avatar">{testimonial.avatar}</div>
                                    <div className="author-info">
                                        <div className="author-name">{testimonial.author}</div>
                                        <div className="author-role">{testimonial.role}, {testimonial.company}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Final CTA Section */}
            <section id="contact" className="final-cta-section">
                <div className="final-cta-container">
                    <div className="final-cta-content">
                        <h2 className="final-cta-title">Ready to Secure Your Secrets?</h2>
                        <p className="final-cta-description">
                            Join the future of secret management. Start your free project today and experience
                            the difference that proper encryption and synchronization makes.
                        </p>
                        <div className="final-cta-actions">
                            <button className="btn-primary final-cta-btn" onClick={() => setLocation('/login')}>
                                <span>Start Free Project</span>
                                <ArrowRight size={20} />
                            </button>
                            <Link href="/how-it-works" className="final-cta-link">
                                Learn More
                            </Link>
                        </div>
                    </div>
                    <div className="final-cta-stats">
                        <div className="cta-stat">
                            <div className="cta-stat-number">{counters.projects.toLocaleString()}+</div>
                            <div className="cta-stat-label">Projects Secured</div>
                        </div>
                        <div className="cta-stat">
                            <div className="cta-stat-number">{counters.secrets.toLocaleString()}+</div>
                            <div className="cta-stat-label">Secrets Managed</div>
                        </div>
                        <div className="cta-stat">
                            <div className="cta-stat-number">{counters.uptime.toFixed(1)}%</div>
                            <div className="cta-stat-label">Uptime SLA</div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}