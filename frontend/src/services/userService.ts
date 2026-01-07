import api from './api';

export const userService = {
    async getAllUsers(role?: string) {
        const response = await api.get('/users', { params: { role } });
        return response.data.users;
    },

    async getUserById(id: string) {
        const response = await api.get(`/users/${id}`);
        return response.data.user;
    },

    async createUser(userData: any) {
        const response = await api.post('/users', userData);
        return response.data.user;
    },

    async updateUser(id: string, userData: any) {
        const response = await api.put(`/users/${id}`, userData);
        return response.data.user;
    },

    async deleteUser(id: string) {
        const response = await api.delete(`/users/${id}`);
        return response.data;
    },

    async getPembimbingList() {
        const response = await api.get('/users/pembimbing');
        return response.data.pembimbingList;
    },
};
