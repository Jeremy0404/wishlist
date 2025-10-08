import { createRouter, createWebHistory } from "vue-router";
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
  {
    path: "/auth/login",
    component: Login,
    meta: { public: true, onlyGuest: true },
  },
  {
    path: "/auth/register",
    component: Register,
    meta: { public: true, onlyGuest: true },
  },

  // Family
  { path: "/family/create", component: FamilyCreate },
  {
    path: "/family/join",
    component: FamilyJoin,
    meta: { requireNoFamily: true },
  },

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

router.beforeEach(async (to) => {
  const auth = useAuth();

  const needsFreshSession = Boolean(to.meta?.onlyGuest || !to.meta?.public);
  if (needsFreshSession) {
    try {
      await auth.hydrate();
    } catch {}
  }

  const isPublic = Boolean(to.meta?.public);

  if (to.meta?.onlyGuest && auth.isLogged) {
    return { path: "/me", replace: true };
  }

  if (!isPublic && !auth.isLogged) {
    return { path: "/auth/login", query: { redirect: to.fullPath } };
  }

  if (to.meta?.requireNoFamily && auth.isLogged && auth.inFamily) {
    return { path: "/me", replace: true };
  }

  return true;
});

export default router;
