import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';

// 1. Importar los Layouts
import AuthLayout from '@/layouts/AuthLayout.vue';
import MainLayout from '@/layouts/MainLayout.vue';

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/',
            redirect: '/login'
        },
        {
            path: '/login',
            component: () => import('@/views/auth.vue'),
            // 2. Asignar el layout público
            meta: { layout: AuthLayout }
        },
        {
            path: '/dashboard',
            component: () => import('@/views/dashboard.vue'),
            // 3. Asignar el layout protegido manteniendo el requiresAuth
            meta: { requiresAuth: true, layout: MainLayout }
        },
        {
            path: '/wallet',
            component: () => import('@/views/wallet.vue'),
            meta: { requiresAuth: true, layout: MainLayout }
        },
        {
            path: '/cards',
            component: () => import('@/views/cards.vue'),
            meta: { requiresAuth: true, layout: MainLayout }
        },
        {
            path: '/transactions',
            component: () => import('@/views/transactions.vue'),
            meta: { requiresAuth: true, layout: MainLayout }
        }
    ]
});

// Implementación de Navigation Guards asíncronos
router.beforeEach(async (to, from, next) => {
    const authStore = useAuthStore();
    const requiresAuth = to.meta.requiresAuth;

    if (!requiresAuth) {
        // Ruta pública (ej. /login): si ya hay sesión activa, ir al dashboard
        if (to.path === '/login' && (authStore.accessToken || authStore.user)) {
            return next('/dashboard');
        }
        return next();
    }

    // Ruta protegida: verificar sesión
    if (authStore.accessToken && authStore.user) {
        // Ya hay sesión válida en memoria (real o demo)
        return next();
    }

    // Intentar renovar sesión desde cookie (solo aplica si hay backend real)
    try {
        await authStore.refreshSession();
        next();
    } catch {
        next('/login');
    }
});

export default router;