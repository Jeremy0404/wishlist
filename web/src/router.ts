import { createRouter, createWebHistory } from 'vue-router';
import { useAuth } from './stores/auth';
import Login from './pages/Login.vue';
import Register from './pages/Register.vue';
import FamilyCreate from './pages/FamilyCreate.vue';
import FamilyJoin from './pages/FamilyJoin.vue';
import MyWishlist from './pages/MyWishlist.vue';
import Others from './pages/Others.vue';
import WishlistView from './pages/WishlistView.vue';
import { api } from './services/api';

const routes = [
    { path: '/', redirect: '/me' },
    { path: '/auth/login', component: Login, meta: { public: true } },
    { path: '/auth/register', component: Register, meta: { public: true } },

    { path: '/family/new', component: FamilyCreate },
    { path: '/family/join', component: FamilyJoin },

    { path: '/me', component: MyWishlist },
    { path: '/wishlists', component: Others, meta: { gate: true } },
    { path: '/wishlists/:userId', component: WishlistView, meta: { gate: true } },
];

export const router = createRouter({ history: createWebHistory(), routes });

router.beforeEach(async (to) => {
    const auth = useAuth();

    // Public routes (login/register)
    if (to.meta.public) return;

    // Require login: we don't have a “whoami” endpoint, so we infer by trying to fetch families once if empty
    if (!auth.isLogged) {
        try {
            auth.families = await api.myFamilies();
            // If families returned, assume logged (cookie exists). No user id, but usable for our simple nav.
            auth.user = auth.user ?? { id: 'me', email: 'me' } as any;
        } catch {
            return '/auth/login';
        }
    }

    // Family required except auth pages
    if (!auth.inFamily && !['/family/new', '/family/join'].includes(to.path)) {
        return '/family/new';
    }

    // Gate pages: test with a call to /wishlists to see if 403
    if (to.meta.gate) {
        try {
            await api.others(); // will 403 if gate not passed
        } catch (e: any) {
            if (String(e.message).includes('403') || String(e.message).includes('add at least one item')) {
                return '/me';
            }
        }
    }

    return true;
});
