import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { api } from '../lib/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [, setLocation] = useLocation();

    /** * NEW STATE: projectPassphrases
     * This stores your master keys in the browser's RAM only.
     * Format: { "project-uuid-1": "user-typed-passphrase" }
     */
    const [projectPassphrases, setProjectPassphrases] = useState({});

    useEffect(() => {
        checkSession();
    }, []);

    const checkSession = async () => {
        try {
            const storedToken = localStorage.getItem('sm_session_token');
            if (storedToken) {
                const { user } = await api.checkSession(storedToken);
                setUser(user);
            }
        } catch (e) {
            console.error("Session invalid", e);
            localStorage.removeItem('sm_session_token');
        } finally {
            setLoading(false);
        }
    };

    const login = async (email) => {
        try {
            const { user, sessionToken } = await api.login(email);
            localStorage.setItem('sm_session_token', sessionToken);
            setUser(user);
            setLocation('/projects');
            return { success: true };
        } catch (e) {
            return { success: false, error: e.message };
        }
    };

    const logout = async () => {
        localStorage.removeItem('sm_session_token');
        setUser(null);
        // Clear passphrases on logout for security
        setProjectPassphrases({});
        setLocation('/login');
    };

    /**
     * NEW FUNCTION: setPassphrase
     * Allows components to "unlock" a project by providing its key.
     */
    const setPassphrase = (projectId, phrase) => {
        setProjectPassphrases(prev => ({
            ...prev,
            [projectId]: phrase
        }));
    };

    return (
        <AuthContext.Provider value={{
            user,
            login,
            logout,
            isLoading: loading,
            // Exporting the new state and setter
            projectPassphrases,
            setPassphrase
        }}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

export function useAuth() { // eslint-disable-line react-refresh/only-export-components
    return useContext(AuthContext);
}