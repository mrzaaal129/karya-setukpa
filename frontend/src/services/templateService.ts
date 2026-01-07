import api from './api';

export const templateService = {
    async getAllTemplates() {
        const response = await api.get('/templates');
        return response.data.templates;
    },

    async getTemplateById(id: string) {
        const response = await api.get(`/templates/${id}`);
        return response.data.template;
    },

    async createTemplate(templateData: any) {
        const response = await api.post('/templates', templateData);
        return response.data.template;
    },

    async updateTemplate(id: string, templateData: any) {
        const response = await api.put(`/templates/${id}`, templateData);
        return response.data.template;
    },

    async deleteTemplate(id: string) {
        const response = await api.delete(`/templates/${id}`);
        return response.data;
    },
};
