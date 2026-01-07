import api from './api';

export const assignmentService = {
    async getAllAssignments(status?: string) {
        const response = await api.get('/assignments', { params: { status } });
        return response.data.assignments;
    },

    async getAssignmentById(id: string) {
        const response = await api.get(`/assignments/${id}`);
        return response.data.assignment;
    },

    async createAssignment(assignmentData: any) {
        const response = await api.post('/assignments', assignmentData);
        return response.data.assignment;
    },

    async updateAssignment(id: string, assignmentData: any) {
        const response = await api.put(`/assignments/${id}`, assignmentData);
        return response.data.assignment;
    },

    async deleteAssignment(id: string) {
        const response = await api.delete(`/assignments/${id}`);
        return response.data;
    },

    async updateChapterSchedules(id: string, chapterSchedules: any[]) {
        const response = await api.put(`/assignments/${id}/schedules`, { chapterSchedules });
        return response.data.assignment;
    },
};
