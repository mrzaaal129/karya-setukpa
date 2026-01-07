import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { User } from '../types';
import { authService } from '../services/authService';

interface AuthContextType {
    currentUser: User | null;
    isAuthenticated: boolean;
    login: (nosis: string, password: string) => Promise<void>;
    logout: () => void;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is already logged in
        const storedUser = authService.getStoredUser();
        if (storedUser) {
            setCurrentUser(storedUser);
        }
        setLoading(false);
    }, []);

    // Heartbeat for Real-time Online System
    useEffect(() => {
        if (!currentUser) return;

        // Ping immediately once
        authService.heartbeat();

        // DISABLED for now to prevent high server load with 2000+ students
        /*
        const intervalId = setInterval(() => {
            authService.heartbeat();
        }, 60 * 1000); // Pulse every 1 minute

        return () => clearInterval(intervalId);
        */
    }, [currentUser]);

    const login = async (nosis: string, password: string) => {
        const data = await authService.login({ nosis, password });
        setCurrentUser(data.user);
    };

    const logout = () => {
        authService.logout();
        setCurrentUser(null);
        window.location.href = '/#/login';
    };

    return (
        <AuthContext.Provider
            value={{
                currentUser,
                isAuthenticated: !!currentUser,
                login,
                logout,
                loading,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
