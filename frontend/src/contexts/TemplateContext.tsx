import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect, useMemo } from 'react';
import { PaperTemplate } from '../types';
import api from '../services/api';

interface TemplateContextType {
  templates: PaperTemplate[];
  isLoading: boolean;
  error: string | null;
  getTemplateById: (id: string) => PaperTemplate | undefined;
  addTemplate: (template: Omit<PaperTemplate, 'id'>) => Promise<void>;
  updateTemplate: (updatedTemplate: PaperTemplate) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  refreshTemplates: () => Promise<void>;
}

const TemplateContext = createContext<TemplateContextType | undefined>(undefined);

export const TemplateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [templates, setTemplates] = useState<PaperTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get('/templates');
      setTemplates(response.data.templates);
    } catch (err: any) {
      console.error('Error fetching templates:', err);
      setError(err.response?.data?.error || 'Failed to fetch templates');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Only fetch templates if user is authenticated
    const token = localStorage.getItem('token');
    if (token) {
      fetchTemplates();
    }
  }, [fetchTemplates]);

  const getTemplateById = useCallback((id: string) => {
    return templates.find(t => t.id === id);
  }, [templates]);

  const addTemplate = useCallback(async (template: Omit<PaperTemplate, 'id'>) => {
    setIsLoading(true);
    try {
      const response = await api.post('/templates', template);
      setTemplates(prev => [response.data.template, ...prev]);
    } catch (err: any) {
      console.error('Error adding template:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateTemplate = useCallback(async (updatedTemplate: PaperTemplate) => {
    setIsLoading(true);
    try {
      const response = await api.patch(`/templates/${updatedTemplate.id}`, updatedTemplate);
      setTemplates(prev => prev.map(t => t.id === updatedTemplate.id ? response.data.template : t));
    } catch (err: any) {
      console.error('Error updating template:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteTemplate = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      await api.delete(`/templates/${id}`);
      setTemplates(prev => prev.filter(t => t.id !== id));
    } catch (err: any) {
      console.error('Error deleting template:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const contextValue = useMemo(() => ({
    templates,
    isLoading,
    error,
    getTemplateById,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    refreshTemplates: fetchTemplates,
  }), [templates, isLoading, error, getTemplateById, addTemplate, updateTemplate, deleteTemplate, fetchTemplates]);

  return (
    <TemplateContext.Provider value={contextValue}>
      {children}
    </TemplateContext.Provider>
  );
};

export const useTemplates = (): TemplateContextType => {
  const context = useContext(TemplateContext);
  if (!context) {
    throw new Error('useTemplates must be used within a TemplateProvider');
  }
  return context;
};