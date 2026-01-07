import api from './api';

export interface LoginCredentials {
    nosis: string;
    password: string;
}

export interface RegisterData {
    nosis: string;
    name: string;
    email?: string;
    password: string;
    role: string;
    pembimbingId?: string;
}

export const authService = {
    async login(credentials: LoginCredentials) {
        const response = await api.post('/auth/login', credentials);
        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        return response.data;
    },

    async register(data: RegisterData) {
        const response = await api.post('/auth/register', data);
        return response.data;
    },

    async getCurrentUser() {
        const response = await api.get('/auth/me');
        return response.data.user;
    },

    async heartbeat() {
        try {
            await api.post('/auth/heartbeat', {});
        } catch (e) {
            // Silent error 
        }
    },

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },

    getStoredUser() {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    },

    getToken() {
        return localStorage.getItem('token');
    },

    isAuthenticated() {
        return !!this.getToken();
    },
};
