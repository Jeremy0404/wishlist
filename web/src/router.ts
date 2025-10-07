import { createRouter, createWebHistory } from "vue-router";
import { useAuth } from "./stores/auth";
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
  { path: "/me", component: MyWishlist },
  { path: "/auth/login", component: Login, meta: { public: true } },
  { path: "/auth/register", component: Register, meta: { public: true } },

  { path: "/family/new", component: FamilyCreate },
  { path: "/family/join", component: FamilyJoin },
  { path: "/family/invite", component: FamilyInvite },

  { path: "/me", component: MyWishlist },
  { path: "/wishlists", component: Others, meta: { gate: true } },
  { path: "/wishlists/:userId", component: WishlistView, meta: { gate: true } },
];

export const router = createRouter({ history: createWebHistory(), routes });

router.beforeEach(async (to) => {
  const auth = useAuth();

  if (!auth.hydrated) {
    try {
      await auth.hydrate();
    } catch {}
  }

  if (!to.meta?.public && !auth.user) {
    return {
      path: "/auth/login",
      query: { redirect: to.fullPath },
      replace: true,
    };
  }

  return true;
});
