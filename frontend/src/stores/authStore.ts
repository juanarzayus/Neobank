import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from '@/services/api';
import type { UserProfile } from '@/types/auth';

export const useAuthStore = defineStore('auth', () => {
    const user = ref<UserProfile | null>(null);
    const accessToken = ref<string | null>(null); // Guardado estrictamente en memoria[cite: 1].

    const refreshSession = async () => {
        // El backend valida la cookie HttpOnly y retorna un nuevo JWT.
        const response = await api.post<{ accessToken: string; user: UserProfile }>('/auth/refresh');
        accessToken.value = response.data.accessToken;
        user.value = response.data.user;
    };

    const logout = () => {
        user.value = null;
        accessToken.value = null;
        // Aquí también llamarías a api.post('/auth/logout') para que el backend destruya la cookie.
    };

    return { user, accessToken, refreshSession, logout };
});