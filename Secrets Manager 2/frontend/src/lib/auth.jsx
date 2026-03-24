import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { api } from '../lib/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [location, setLocation] = useLocation();

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
            // Stateless session token
            localStorage.setItem('sm_session_token', sessionToken);
            setUser(user);
            setLocation('/');
            return { success: true };
        } catch (e) {
            return { success: false, error: e.message };
        }
    };




    const logout = async () => {
        // Stateless, just clear local token
        localStorage.removeItem('sm_session_token');
        setUser(null);
        setLocation('/login');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isLoading: loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
