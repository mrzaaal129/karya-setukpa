import React, { createContext, useState, useContext, ReactNode, useCallback, useMemo, useEffect } from 'react';
import { Assignment } from '../types';
import api from '../services/api';

interface AssignmentContextType {
  assignments: Assignment[];
  isLoading: boolean;
  error: string | null;
  getAssignmentById: (id: string) => Assignment | undefined;
  addAssignment: (assignment: Omit<Assignment, 'id'>) => Promise<void>;
  refreshAssignments: () => Promise<void>;
}

const AssignmentContext = createContext<AssignmentContextType | undefined>(undefined);

export const AssignmentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAssignments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get('/assignments');
      setAssignments(response.data.assignments || []);
    } catch (err: any) {
      console.error('Error fetching assignments:', err);
      setError(err.response?.data?.error || 'Failed to fetch assignments');
      // Set empty array on error instead of keeping old data
      setAssignments([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fetch assignments when component mounts if user is authenticated
    const token = localStorage.getItem('token');
    if (token) {
      fetchAssignments();
    }
  }, [fetchAssignments]);

  const getAssignmentById = useCallback((id: string) => {
    return assignments.find(a => a.id === id);
  }, [assignments]);

  const addAssignment = useCallback(async (assignment: Omit<Assignment, 'id'>) => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('🚀 Sending assignment to backend:', assignment);
      const response = await api.post('/assignments', assignment);
      console.log('✅ Backend response:', response.data);
      setAssignments(prev => [response.data.assignment, ...prev]);
      return response.data; // Return response data for warning handling
    } catch (err: any) {
      console.error('❌ Error adding assignment:', err);
      console.error('Error response:', err.response?.data);
      setError(err.response?.data?.error || 'Failed to create assignment');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const contextValue = useMemo(() => ({
    assignments,
    isLoading,
    error,
    getAssignmentById,
    addAssignment,
    refreshAssignments: fetchAssignments,
  }), [assignments, isLoading, error, getAssignmentById, addAssignment, fetchAssignments]);

  return (
    <AssignmentContext.Provider value={contextValue}>
      {children}
    </AssignmentContext.Provider>
  );
};

export const useAssignments = (): AssignmentContextType => {
  const context = useContext(AssignmentContext);
  if (!context) {
    throw new Error('useAssignments must be used within an AssignmentProvider');
  }
  return context;
};