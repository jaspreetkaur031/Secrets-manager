import React, { useState } from 'react';
import { Link } from 'wouter';
import { Shield, Loader } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import './Login.css';

export default function Login() {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        // Artificial delay for realism
        await new Promise(r => setTimeout(r, 600));

        const res = await login(email);
        if (!res.success) {
            setError(res.error);
            setIsSubmitting(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-header">
                    <div className="logo-circle">
                        <Shield size={32} />
                    </div>
                    <h1>Welcome</h1>
                    <p>Enter your email to continue</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    {error && <div className="error-message">{error}</div>}

                    <div className="form-group">
                        <label>Email</label>
                        <Input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="name@company.com"
                            required
                        />
                    </div>

                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? <Loader className="animate-spin" size={16} /> : 'Continue'}
                    </Button>

                    <p className="hint">
                        If you don't have an account, one will be created.
                    </p>

                    <p className="hint">
                        Demo: Use <code>admin@growthjockey.com</code>
                    </p>
                </form>
            </div>
        </div>
    );
}
