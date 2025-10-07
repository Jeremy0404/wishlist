import {
  createRouter,
  createWebHistory,
  type RouteLocationNormalized,
} from "vue-router";
import { useAuth } from "./stores/auth";

// Pages
import Login from "./pages/Login.vue";
import Register from "./pages/Register.vue";
import FamilyCreate from "./pages/FamilyCreate.vue";
import FamilyJoin from "./pages/FamilyJoin.vue";
import MyWishlist from "./pages/MyWishlist.vue";
import Others from "./pages/Others.vue";
import WishlistView from "./pages/WishlistView.vue";
import FamilyInvite from "./pages/FamilyInvite.vue";
import Landing from "./pages/Landing.vue";

const routes = [
  { path: "/", component: Landing, meta: { public: true } },

  // Auth
  { path: "/auth/login", component: Login, meta: { public: true } },
  { path: "/auth/register", component: Register, meta: { public: true } },

  // Family
  { path: "/family/create", component: FamilyCreate },
  { path: "/family/join", component: FamilyJoin },

  // Wishlists
  { path: "/me", component: MyWishlist },
  { path: "/others", component: Others },
  { path: "/wishlists/:userId", component: WishlistView, props: true },

  // Invites
  { path: "/family/invite", component: FamilyInvite },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to: RouteLocationNormalized) => {
  const auth = useAuth();

  if (auth.user === null && typeof auth.hydrate === "function") {
    try {
      await auth.hydrate();
    } catch {
      /* ignore */
    }
  }

  const isPublic = Boolean(to.meta?.public);
  const isLogged = Boolean(auth.user);

  if (!isPublic && !isLogged) {
    return {
      path: "/auth/login",
      query: { redirect: to.fullPath },
    };
  }

  return true;
});

export default router;
