import api from './api';

export const gradeService = {
    async getGradeByPaperId(paperId: string) {
        const response = await api.get(`/grades/paper/${paperId}`);
        return response.data.grade;
    },

    async createGrade(gradeData: any) {
        const response = await api.post('/grades', gradeData);
        return response.data.grade;
    },

    async updateGrade(id: string, gradeData: any) {
        const response = await api.put(`/grades/${id}`, gradeData);
        return response.data.grade;
    },
};
