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

// Implementación de Navigation Guards asíncronos[cite: 1]
router.beforeEach(async (to, from, next) => {
    const authStore = useAuthStore();
    const requiresAuth = to.meta.requiresAuth;

    if (requiresAuth && !authStore.accessToken) {
        try {
            await authStore.refreshSession();
            next();
        } catch (error) {
            next('/login');
        }
    } else {
        next();
    }
});

export default router;