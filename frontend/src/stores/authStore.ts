import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from '@/services/api';
import type { UserProfile } from '@/types/auth';

const DEMO_USER: UserProfile = {
    id: 'demo-user-001',
    email: 'demo@novaneobank.com',
    firstName: 'Usuario',
    lastName: 'Demo',
    preferredName: 'Usuario',
    address: 'Av. Principal #100, Piso 4',
    kycStatus: 'approved',
    createdAt: new Date().toISOString(),
};

const DEMO_TOKEN = 'demo-access-token';

const applyCustomUserData = (baseUser: UserProfile): UserProfile => {
    try {
        const raw = localStorage.getItem('nova_user_profile_' + baseUser.id) || localStorage.getItem('nova_user_profile');
        if (raw) {
            const custom = JSON.parse(raw);
            return { ...baseUser, ...custom };
        }
    } catch {
        // ignore json parse error
    }
    return baseUser;
};

<<<<<<< Updated upstream
=======
const applyCustomUserData = (baseUser: UserProfile): UserProfile => {
    try {
        const raw = localStorage.getItem('nova_user_profile_' + baseUser.id);
        if (raw) {
            const custom = JSON.parse(raw);
            return { ...baseUser, ...custom };
        }
    } catch {
        // ignore json parse error
    }
    return baseUser;
};

>>>>>>> Stashed changes
export const useAuthStore = defineStore('auth', () => {
    const user = ref<UserProfile | null>(null);
    const accessToken = ref<string | null>(null);
    const isDemo = ref(false);

    // Intenta restaurar sesión demo de sessionStorage al recargar
    const _restoreDemo = () => {
        if (sessionStorage.getItem('nova_demo') === '1') {
            user.value = applyCustomUserData(DEMO_USER);
            accessToken.value = DEMO_TOKEN;
            isDemo.value = true;
        }
    };
    _restoreDemo();

    const refreshSession = async () => {
        // Si estamos en modo demo, simplemente renovamos el estado sin llamar al API
        if (isDemo.value || sessionStorage.getItem('nova_demo') === '1') {
            user.value = applyCustomUserData(DEMO_USER);
            accessToken.value = DEMO_TOKEN;
            isDemo.value = true;
            return;
        }
        // El backend valida la cookie HttpOnly y retorna un nuevo JWT.
        const response = await api.post<{ accessToken: string; user: UserProfile }>('/auth/refresh');
        accessToken.value = response.data.accessToken;
        user.value = applyCustomUserData(response.data.user);
    };

    type AuthResponse = { accessToken: string; user: UserProfile };

    const login = async (email: string, password: string) => {
        sessionStorage.removeItem('nova_demo');
        user.value = null;
        accessToken.value = null;
        const response = await api.post<AuthResponse>('/auth/login', { email, password });
        accessToken.value = response.data.accessToken;
        user.value = applyCustomUserData(response.data.user);
        isDemo.value = false;
    };

    const register = async (payload: { firstName: string; lastName: string; email: string; password: string }) => {
        sessionStorage.removeItem('nova_demo');
        user.value = null;
        accessToken.value = null;
        const response = await api.post<AuthResponse>('/auth/register', payload);
        accessToken.value = response.data.accessToken;
        user.value = applyCustomUserData(response.data.user);
        isDemo.value = false;
    };

    /** Accede sin backend — útil para demo / frontend-only */
    const demoLogin = () => {
        user.value = applyCustomUserData(DEMO_USER);
        accessToken.value = DEMO_TOKEN;
        isDemo.value = true;
        sessionStorage.setItem('nova_demo', '1');
    };

    const updateProfile = (data: { preferredName?: string; email?: string; address?: string }) => {
        if (!user.value) return;
        user.value = {
            ...user.value,
            ...(data.preferredName !== undefined ? { preferredName: data.preferredName } : {}),
            ...(data.email !== undefined && data.email ? { email: data.email } : {}),
            ...(data.address !== undefined ? { address: data.address } : {}),
        };
        try {
            const custom = {
                preferredName: user.value.preferredName,
                email: user.value.email,
                address: user.value.address,
            };
            localStorage.setItem('nova_user_profile_' + user.value.id, JSON.stringify(custom));
            localStorage.setItem('nova_user_profile', JSON.stringify(custom));
        } catch {
            // ignore
        }
    };

<<<<<<< Updated upstream
    const logout = () => {
=======
    const updateProfile = (data: { preferredName?: string; email?: string; address?: string }) => {
        if (!user.value) return;
        user.value = {
            ...user.value,
            ...(data.preferredName !== undefined ? { preferredName: data.preferredName } : {}),
            ...(data.email !== undefined && data.email ? { email: data.email } : {}),
            ...(data.address !== undefined ? { address: data.address } : {}),
        };
        try {
            const custom = {
                preferredName: user.value.preferredName,
                email: user.value.email,
                address: user.value.address,
            };
            localStorage.setItem('nova_user_profile_' + user.value.id, JSON.stringify(custom));
            localStorage.removeItem('nova_user_profile');
        } catch {
            // ignore
        }
    };

    const logout = async () => {
>>>>>>> Stashed changes
        user.value = null;
        accessToken.value = null;
        isDemo.value = false;
        sessionStorage.clear();
        localStorage.removeItem('nova_custom_cards');
        localStorage.removeItem('nova_cards_demo');
        localStorage.removeItem('nova_user_profile');
        try {
            await api.post('/auth/logout');
        } catch {
            // Silencioso si falla la red o está en modo demo
        }
    };

    return { user, accessToken, isDemo, refreshSession, login, register, demoLogin, updateProfile, logout };
});