import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';

export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api/v1',
    withCredentials: true, // Vital para enviar el Refresh Token en la cookie HttpOnly.
});

// Interceptor de Petición: Inyecta el Access Token en memoria a cada request.
api.interceptors.request.use((config) => {
    const authStore = useAuthStore();
    if (authStore.accessToken) {
        config.headers.Authorization = `Bearer ${authStore.accessToken}`;
    }
    return config;
});

// Interceptor de Respuesta: Atrapa el 401 y rota los tokens.
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Si da 401 y no hemos reintentado ya...
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            const authStore = useAuthStore();

            try {
                await authStore.refreshSession(); // Llama al endpoint que lee la cookie
                return api(originalRequest); // Reintenta la petición original con el nuevo token
            } catch (refreshError) {
                authStore.logout();
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);