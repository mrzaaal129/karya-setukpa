import api from './api';

export const paperService = {
    async getAllPapers(userId?: string, assignmentId?: string) {
        const response = await api.get('/papers', { params: { userId, assignmentId } });
        return response.data.papers;
    },

    async getPaperById(id: string) {
        const response = await api.get(`/papers/${id}`);
        return response.data.paper;
    },

    async createPaper(paperData: any) {
        const response = await api.post('/papers', paperData);
        return response.data.paper;
    },

    async updatePaper(id: string, paperData: any) {
        const response = await api.put(`/papers/${id}`, paperData);
        return response.data.paper;
    },

    async deletePaper(id: string) {
        const response = await api.delete(`/papers/${id}`);
        return response.data;
    },

    async addComment(paperId: string, text: string) {
        const response = await api.post(`/papers/${paperId}/comments`, { text });
        return response.data.comment;
    },
};
