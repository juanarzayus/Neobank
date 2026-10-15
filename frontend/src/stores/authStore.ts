import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from '@/services/api';
import type { UserProfile } from '@/types/auth';

const DEMO_USER: UserProfile = {
    id: 'demo-user-001',
    email: 'demo@novaneobank.com',
    firstName: 'Usuario',
    lastName: 'Demo',
    kycStatus: 'approved',
    createdAt: new Date().toISOString(),
};

const DEMO_TOKEN = 'demo-access-token';

export const useAuthStore = defineStore('auth', () => {
    const user = ref<UserProfile | null>(null);
    const accessToken = ref<string | null>(null);
    const isDemo = ref(false);

    // Intenta restaurar sesión demo de sessionStorage al recargar
    const _restoreDemo = () => {
        if (sessionStorage.getItem('nova_demo') === '1') {
            user.value = DEMO_USER;
            accessToken.value = DEMO_TOKEN;
            isDemo.value = true;
        }
    };
    _restoreDemo();

    const refreshSession = async () => {
        // Si estamos en modo demo, simplemente renovamos el estado sin llamar al API
        if (isDemo.value || sessionStorage.getItem('nova_demo') === '1') {
            user.value = DEMO_USER;
            accessToken.value = DEMO_TOKEN;
            isDemo.value = true;
            return;
        }
        // El backend valida la cookie HttpOnly y retorna un nuevo JWT.
        const response = await api.post<{ accessToken: string; user: UserProfile }>('/auth/refresh');
        accessToken.value = response.data.accessToken;
        user.value = response.data.user;
    };

    type AuthResponse = { accessToken: string; user: UserProfile };

    const login = async (email: string, password: string) => {
        const response = await api.post<AuthResponse>('/auth/login', { email, password });
        accessToken.value = response.data.accessToken;
        user.value = response.data.user;
        isDemo.value = false;
    };

    const register = async (payload: { firstName: string; lastName: string; email: string; password: string }) => {
        const response = await api.post<AuthResponse>('/auth/register', payload);
        accessToken.value = response.data.accessToken;
        user.value = response.data.user;
        isDemo.value = false;
    };

    /** Accede sin backend — útil para demo / frontend-only */
    const demoLogin = () => {
        user.value = DEMO_USER;
        accessToken.value = DEMO_TOKEN;
        isDemo.value = true;
        sessionStorage.setItem('nova_demo', '1');
    };

    const logout = () => {
        user.value = null;
        accessToken.value = null;
        isDemo.value = false;
        sessionStorage.removeItem('nova_demo');
        // En producción también llamarías: api.post('/auth/logout')
    };

    return { user, accessToken, isDemo, refreshSession, login, register, demoLogin, logout };
});