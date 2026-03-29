import React, { useState } from 'react';
import { Mail, MessageSquare, Phone, MapPin, Send, Shield, ArrowRight } from 'lucide-react';
import { Link } from 'wouter';
import './ProductHub.css';

// Generate particle positions once at module level to avoid Math.random in render
const generateParticleStyles = () => {
    return [...Array(15)].map(() => ({
        left: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 8}s`,
        animationDuration: `${8 + Math.random() * 8}s`
    }));
};

const particleStyles = generateParticleStyles();

export default function Contact() {
    const [isLoaded] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Simulate form submission
        setTimeout(() => {
            setIsSubmitting(false);
            setFormData({ name: '', email: '', subject: '', message: '' });
            alert('Thank you for your message! We\'ll get back to you soon.');
        }, 2000);
    };

    const contactMethods = [
        {
            icon: Mail,
            title: "Email Us",
            description: "Get in touch via email",
            contact: "support@vaultflow.com",
            action: "mailto:support@vaultflow.com"
        },
        {
            icon: MessageSquare,
            title: "Live Chat",
            description: "Chat with our team",
            contact: "Available 24/7",
            action: "#chat"
        },
        {
            icon: Phone,
            title: "Phone Support",
            description: "Speak with an expert",
            contact: "+1 (555) 123-4567",
            action: "tel:+15551234567"
        }
    ];

    return (
        <div className="contact-page">
            {/* Animated Background */}
            <div className="animated-bg">
                <div className="contact-shapes">
                    <div className="contact-shape-1"></div>
                    <div className="contact-shape-2"></div>
                    <div className="contact-shape-3"></div>
                    <div className="contact-particles">
                        {particleStyles.map((style, i) => (
                            <div key={i} className="contact-particle" style={style}></div>
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
                    <Link href="/security" className="nav-link">Security</Link>
                    <Link href="/contact" className="nav-link active">Contact</Link>
                    <Link href="/login" className="btn-primary nav-cta">Sign In</Link>
                </div>
            </nav>

            <main className="contact-container">
                <div className={`contact-header ${isLoaded ? 'animate-in-delay-1' : ''}`}>
                    <h1 className="contact-title">
                        <span className="title-gradient">Get In Touch</span>
                        <br />
                        <span className="title-secondary">We're Here to Help</span>
                    </h1>
                    <p className="contact-subtitle">
                        Have questions about VaultFlow? Need help with your secrets management?
                        Our team is ready to assist you.
                    </p>
                </div>

                <div className={`contact-content ${isLoaded ? 'animate-in-delay-2' : ''}`}>
                    <div className="contact-methods">
                        {contactMethods.map((method, index) => {
                            const Icon = method.icon;
                            return (
                                <a
                                    key={index}
                                    href={method.action}
                                    className="contact-method-card"
                                    style={{ animationDelay: `${0.1 * index}s` }}
                                >
                                    <div className="contact-method-icon">
                                        <Icon size={24} />
                                    </div>
                                    <div className="contact-method-content">
                                        <h3>{method.title}</h3>
                                        <p>{method.description}</p>
                                        <span className="contact-info">{method.contact}</span>
                                    </div>
                                    <ArrowRight className="contact-arrow" size={16} />
                                </a>
                            );
                        })}
                    </div>

                    <div className="contact-form-section">
                        <div className="contact-form-header">
                            <h2>Send us a Message</h2>
                            <p>Fill out the form below and we'll get back to you within 24 hours.</p>
                        </div>

                        <form className="contact-form" onSubmit={handleSubmit}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="name">Full Name</label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="Your full name"
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="email">Email Address</label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="your.email@example.com"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="subject">Subject</label>
                                <input
                                    type="text"
                                    id="subject"
                                    name="subject"
                                    value={formData.subject}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="How can we help you?"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="message">Message</label>
                                <textarea
                                    id="message"
                                    name="message"
                                    value={formData.message}
                                    onChange={handleInputChange}
                                    required
                                    rows={6}
                                    placeholder="Tell us more about your inquiry..."
                                ></textarea>
                            </div>

                            <button
                                type="submit"
                                className={`contact-submit-btn ${isSubmitting ? 'submitting' : ''}`}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="submit-spinner"></div>
                                        <span>Sending...</span>
                                    </>
                                ) : (
                                    <>
                                        <Send size={18} />
                                        <span>Send Message</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                <div className={`contact-footer ${isLoaded ? 'animate-in-delay-3' : ''}`}>
                    <div className="contact-office">
                        <MapPin className="office-icon" size={20} />
                        <div>
                            <h4>Our Office</h4>
                            <p>123 Security Street<br />San Francisco, CA 94105</p>
                        </div>
                    </div>
                    <div className="contact-hours">
                        <h4>Business Hours</h4>
                        <p>Monday - Friday: 9:00 AM - 6:00 PM PST<br />
                        Weekends: 10:00 AM - 4:00 PM PST</p>
                    </div>
                </div>
            </main>
        </div>
    );
}
