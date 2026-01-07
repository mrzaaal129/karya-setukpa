import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '../types';
import { useAuth } from './AuthContext';

interface UserContextType {
  currentUser: User;
}

// Initialize context with undefined. The provider will supply the value.
const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !currentUser) {
      navigate('/login');
    }
  }, [loading, currentUser, navigate]);

  if (loading) {
    return <div className="p-4 text-center">Loading user session...</div>;
  }

  if (!currentUser) {
    return null;
  }

  return (
    <UserContext.Provider value={{ currentUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  // This check ensures the hook is used within a provider, preventing runtime errors.
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
