import React from 'react';
import { Link, useLocation } from 'wouter';
import { LayoutDashboard, Folder, Settings, Bell, LogOut, Shield } from 'lucide-react';
import { cn } from '../lib/utils';
import { LiveSearch } from '../components/LiveSearch';
import './AppLayout.css';

import { useAuth } from '../lib/auth'; // Import useAuth

export function AppLayout({ children }) {
    const [location, setLocation] = useLocation();
    const { logout, user } = useAuth();

    // Global Key Listener for Cmd+K
    React.useEffect(() => {
        const handleGlobalKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                const input = document.querySelector('input[placeholder="Search projects or secrets..."]');
                if (input) input.focus();
            }
        };
        document.addEventListener('keydown', handleGlobalKeyDown);
        return () => document.removeEventListener('keydown', handleGlobalKeyDown);
    }, []);

    const navItems = [
        { label: 'Dashboard', href: '/', icon: LayoutDashboard },
        { label: 'Projects', href: '/projects', icon: Folder },
        { label: 'Settings', href: '/settings', icon: Settings },
    ];

    return (
        <div className="layout-root">
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="sidebar-header">
                    <Shield className="logo-icon" />
                    <span className="logo-text">Secrets Manager</span>
                </div>

                <nav className="sidebar-nav">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location === item.href;
                        return (
                            <Link key={item.href} href={item.href} className={cn('nav-item', isActive && 'active')}>
                                <Icon size={18} />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="sidebar-footer">
                    <div className="user-profile">
                        <div className="avatar">AD</div>
                        <div className="user-info">
                            <span className="name">{user?.name || 'User'}</span>
                            <span className="role">{user?.role || 'Developer'}</span>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                <header className="top-bar">
                    <LiveSearch />
                    <div className="actions">
                        <button className="icon-btn"><Bell size={18} /></button>
                        <button className="icon-btn" onClick={logout} title="Log Out"><LogOut size={18} /></button>
                    </div>
                </header>

                <div className="page-content">
                    {children}
                </div>
            </main>
        </div>
    );
}
