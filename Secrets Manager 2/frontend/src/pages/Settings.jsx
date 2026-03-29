import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../lib/auth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
  User,
  Shield,
  Bell,
  Palette,
  LogOut,
  Save,
  Eye,
  EyeOff,
  Key,
  Mail,
  Moon,
  Sun,
  Monitor
} from 'lucide-react';
import { cn } from '../lib/utils';
import './Settings.css';

export default function Settings() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

  // Settings state
  const [activeTab, setActiveTab] = useState('account');

  // Form states
  const [accountForm, setAccountForm] = useState({
    name: user?.name || '',
    email: user?.email || ''
  });

  const [preferences, setPreferences] = useState({
    theme: 'system', // 'light', 'dark', 'system'
    notifications: {
      email: true,
      projectUpdates: true,
      securityAlerts: true
    },
    showSecretValues: false
  });

  const [security, setSecurity] = useState({
    twoFactorEnabled: false,
    loginNotifications: true
  });

  const tabs = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'preferences', label: 'Preferences', icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: Bell }
  ];

  const handleAccountUpdate = async () => {
    // TODO: Implement account update API call
    console.log('Updating account:', accountForm);
    // Show success message
  };

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to log out?')) {
      await logout();
      setLocation('/login');
    }
  };

  const handleThemeChange = (theme) => {
    setPreferences(prev => ({ ...prev, theme }));
    // TODO: Apply theme to document - this should be handled by a theme context/provider
    // document.documentElement.className = theme === 'dark' ? 'dark' : '';
  };

  return (
    <div className="max-w-4xl mx-auto p-8 font-sans text-gray-100">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">Settings</h1>
        <p className="text-gray-400 mt-2 text-lg">Manage your account and application preferences.</p>
      </div>

      <div className="bg-gray-900/50 rounded-xl border border-gray-800 overflow-hidden backdrop-blur-sm">
        {/* Tab Navigation */}
        <div className="flex border-b border-gray-800">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-3 px-6 py-4 text-sm font-medium transition-colors border-b-2",
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-400 bg-blue-500/10"
                    : "border-transparent text-gray-400 hover:text-white hover:bg-gray-800/50"
                )}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-8">
          {/* Account Tab */}
          {activeTab === 'account' && (
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
                  <User size={20} />
                  Account Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">
                      Full Name
                    </label>
                    <Input
                      value={accountForm.name}
                      onChange={(e) => setAccountForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter your full name"
                      className="bg-gray-950 border-gray-700 text-white placeholder-gray-600 focus:ring-blue-500/50 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">
                      Email Address
                    </label>
                    <Input
                      type="email"
                      value={accountForm.email}
                      onChange={(e) => setAccountForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter your email"
                      className="bg-gray-950 border-gray-700 text-white placeholder-gray-600 focus:ring-blue-500/50 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <Button onClick={handleAccountUpdate} className="bg-blue-600 hover:bg-blue-500 text-white">
                    <Save size={16} className="mr-2" />
                    Save Changes
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
                  <Shield size={20} />
                  Security Settings
                </h3>

                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-gray-950 rounded-lg border border-gray-800">
                    <div>
                      <h4 className="text-white font-medium">Two-Factor Authentication</h4>
                      <p className="text-gray-400 text-sm">Add an extra layer of security to your account</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-xs font-medium",
                        security.twoFactorEnabled ? "bg-green-500/10 text-green-400" : "bg-gray-500/10 text-gray-400"
                      )}>
                        {security.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                      <Button
                        size="sm"
                        variant={security.twoFactorEnabled ? "outline" : "default"}
                        onClick={() => setSecurity(prev => ({ ...prev, twoFactorEnabled: !prev.twoFactorEnabled }))}
                      >
                        {security.twoFactorEnabled ? 'Disable' : 'Enable'}
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-950 rounded-lg border border-gray-800">
                    <div>
                      <h4 className="text-white font-medium">Login Notifications</h4>
                      <p className="text-gray-400 text-sm">Get notified when someone logs into your account</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={security.loginNotifications}
                        onChange={(e) => setSecurity(prev => ({ ...prev, loginNotifications: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
                  <Palette size={20} />
                  Appearance
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">
                      Theme
                    </label>
                    <div className="flex gap-3">
                      {[
                        { value: 'light', label: 'Light', Icon: Sun },
                        { value: 'dark', label: 'Dark', Icon: Moon },
                        { value: 'system', label: 'System', Icon: Monitor }
                      ].map(({ value, label, Icon }) => ( // eslint-disable-line no-unused-vars
                        <button
                          key={value}
                          onClick={() => handleThemeChange(value)}
                          className={cn(
                            "flex items-center gap-2 px-4 py-3 rounded-lg border transition-colors",
                            preferences.theme === value
                              ? "border-blue-500 bg-blue-500/10 text-blue-400"
                              : "border-gray-700 bg-gray-950 text-gray-400 hover:text-white hover:border-gray-600"
                          )}
                        >
                          <Icon size={16} />
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
                  <Bell size={20} />
                  Notification Preferences
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-950 rounded-lg border border-gray-800">
                    <div>
                      <h4 className="text-white font-medium">Email Notifications</h4>
                      <p className="text-gray-400 text-sm">Receive notifications via email</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.notifications.email}
                        onChange={(e) => setPreferences(prev => ({
                          ...prev,
                          notifications: { ...prev.notifications, email: e.target.checked }
                        }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-950 rounded-lg border border-gray-800">
                    <div>
                      <h4 className="text-white font-medium">Project Updates</h4>
                      <p className="text-gray-400 text-sm">Get notified about project changes and updates</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.notifications.projectUpdates}
                        onChange={(e) => setPreferences(prev => ({
                          ...prev,
                          notifications: { ...prev.notifications, projectUpdates: e.target.checked }
                        }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-950 rounded-lg border border-gray-800">
                    <div>
                      <h4 className="text-white font-medium">Security Alerts</h4>
                      <p className="text-gray-400 text-sm">Receive alerts about security-related events</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.notifications.securityAlerts}
                        onChange={(e) => setPreferences(prev => ({
                          ...prev,
                          notifications: { ...prev.notifications, securityAlerts: e.target.checked }
                        }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Logout Section */}
      <div className="mt-8 bg-red-900/20 border border-red-800 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-3">
          <LogOut size={20} />
          Account Actions
        </h3>
        <p className="text-gray-400 mb-6">
          Need to sign out? You can log out of your account here. This will end your current session.
        </p>
        <Button
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-500 text-white border-red-600"
        >
          <LogOut size={16} className="mr-2" />
          Log Out
        </Button>
      </div>
    </div>
  );
}