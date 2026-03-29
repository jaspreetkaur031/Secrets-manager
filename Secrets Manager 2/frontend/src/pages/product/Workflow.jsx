import React, { useEffect, useState } from 'react';
import { Database, RefreshCw, Shield, ArrowRight, CheckCircle } from 'lucide-react';
import { Link } from 'wouter';
import './ProductHub.css';

export default function Workflow() {
    const [isLoaded] = useState(true);
    const [activeStep, setActiveStep] = useState(0);

    useEffect(() => {
        // Auto-advance through steps
        const interval = setInterval(() => {
            setActiveStep(prev => (prev + 1) % 3);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const steps = [
        {
            icon: Database,
            title: "Global Registry",
            description: "Source of Truth",
            details: "All secrets originate from a centralized, encrypted registry that maintains the master copy of each environment variable."
        },
        {
            icon: RefreshCw,
            title: "Staging",
            description: "Branch Configs",
            details: "Development and staging environments automatically sync with the latest registry values, ensuring consistency across teams."
        },
        {
            icon: Shield,
            title: "Production",
            description: "Runtime Injection",
            details: "Production deployments receive encrypted secrets that are decrypted only at runtime, maintaining security throughout the pipeline."
        }
    ];

    return (
        <div className="workflow-page">
            {/* Animated Background */}
            <div className="animated-bg">
                <div className="workflow-shapes">
                    <div className="shape-circle"></div>
                    <div className="shape-square"></div>
                    <div className="shape-triangle"></div>
                </div>
            </div>

            <nav className={`product-nav ${isLoaded ? 'animate-in' : ''}`}>
                <Link href="/" className="brand-logo">
                    <Shield className="brand-icon" />
                    <span className="brand-text">VAULTFLOW</span>
                </Link>
                <div className="nav-links">
                    <Link href="/how-it-works" className="nav-link active">Workflow</Link>
                    <Link href="/security" className="nav-link">Security</Link>
                    <Link href="/login" className="btn-primary nav-cta">Sign In</Link>
                </div>
            </nav>

            <main className="workflow-container">
                <div className={`workflow-header ${isLoaded ? 'animate-in-delay-1' : ''}`}>
                    <h1 className="workflow-title">
                        <span className="title-gradient">The Lifecycle</span>
                        <br />
                        <span className="title-secondary">of a Secret</span>
                    </h1>
                    <p className="workflow-subtitle">
                        See how our Registry Pattern ensures your infrastructure stays in sync.
                    </p>
                </div>

                <div className={`pipeline-card ${isLoaded ? 'animate-in-delay-2' : ''}`}>
                    {steps.map((step, index) => {
                        const Icon = step.icon;
                        const isActive = index === activeStep;

                        return (
                            <React.Fragment key={index}>
                                <div
                                    className={`node-item ${isActive ? 'active' : ''}`}
                                    onClick={() => setActiveStep(index)}
                                >
                                    <div className="node-icon-bg">
                                        <Icon size={28} className={isActive ? 'animate-pulse' : ''} />
                                        {isActive && <div className="node-glow"></div>}
                                    </div>
                                    <h3 className="node-title">{step.title}</h3>
                                    <p className="node-description">{step.description}</p>
                                    {isActive && (
                                        <div className="node-details">
                                            <p>{step.details}</p>
                                        </div>
                                    )}
                                </div>
                                {index < steps.length - 1 && (
                                    <div className="connector">
                                        <ArrowRight className="connector-arrow" size={16} />
                                        <div className={`connector-line ${isActive ? 'active' : ''}`}></div>
                                    </div>
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>

                <div className={`workflow-features ${isLoaded ? 'animate-in-delay-3' : ''}`}>
                    <div className="feature-grid">
                        <div className="feature-card">
                            <CheckCircle className="feature-check" size={24} />
                            <h4>Zero Downtime</h4>
                            <p>Secrets update without service interruption</p>
                        </div>
                        <div className="feature-card">
                            <CheckCircle className="feature-check" size={24} />
                            <h4>Version Control</h4>
                            <p>Track changes and roll back if needed</p>
                        </div>
                        <div className="feature-card">
                            <CheckCircle className="feature-check" size={24} />
                            <h4>Access Control</h4>
                            <p>Granular permissions per environment</p>
                        </div>
                    </div>
                </div>

                <div className={`workflow-cta ${isLoaded ? 'animate-in-delay-4' : ''}`}>
                    <Link href="/login" className="btn-primary workflow-btn">
                        <span>Start Your Project</span>
                        <ArrowRight size={20} />
                    </Link>
                </div>
            </main>
        </div>
    );
}