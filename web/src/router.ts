import { createRouter, createWebHistory } from 'vue-router';
import { useAuth } from './stores/auth';
import Login from './pages/Login.vue';
import Register from './pages/Register.vue';
import FamilyCreate from './pages/FamilyCreate.vue';
import FamilyJoin from './pages/FamilyJoin.vue';
import MyWishlist from './pages/MyWishlist.vue';
import Others from './pages/Others.vue';
import WishlistView from './pages/WishlistView.vue';
import FamilyInvite from "./pages/FamilyInvite.vue";

const routes = [
    { path: '/', redirect: '/me' },
    { path: '/auth/login', component: Login, meta: { public: true } },
    { path: '/auth/register', component: Register, meta: { public: true } },

    { path: '/family/new', component: FamilyCreate },
    { path: '/family/join', component: FamilyJoin },
    { path: '/family/invite', component: FamilyInvite },

    { path: '/me', component: MyWishlist },
    { path: '/wishlists', component: Others, meta: { gate: true } },
    { path: '/wishlists/:userId', component: WishlistView, meta: { gate: true } },
];

export const router = createRouter({ history: createWebHistory(), routes });

router.beforeEach(async (to) => {
    const auth = useAuth();

    if (to.meta.public) return true;

    // hydrate once per session (or on reload)
    if (auth.user === null && auth.families.length === 0) {
        await auth.hydrate();
    }
    if (!auth.isLogged) return '/auth/login';

    // Require family for main pages
    if (!auth.inFamily && !['/family/new', '/family/join'].includes(to.path)) {
        return '/family/new';
    }

    // Gate pages still rely on server 403; keep as-is
    return true;
});
