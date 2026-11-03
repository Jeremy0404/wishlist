import { createRouter, createWebHistory, type RouteLocation } from "vue-router";
import { useAuth } from "./stores/auth";

// Pages
import MagicLink from "./pages/MagicLink.vue";
import FamilyCreate from "./pages/FamilyCreate.vue";
import FamilyJoin from "./pages/FamilyJoin.vue";
import MyWishlist from "./pages/MyWishlist.vue";
import Others from "./pages/Others.vue";
import WishlistView from "./pages/WishlistView.vue";
import MyGifts from "./pages/MyGifts.vue";
import SignIn from "./pages/SignIn.vue";
import Welcome from "./pages/Welcome.vue";
import NotFound from "./pages/NotFound.vue";
import SessionExpired from "./pages/SessionExpired.vue";
import AdminHome from "./pages/AdminHome.vue";
import AdminUser from "./pages/AdminUser.vue";

const routes = [
  // Signing in and signing up are the same act, on the same screen as the pitch.
  { path: "/", component: SignIn, meta: { public: true, onlyGuest: true } },

  // Auth
  { path: "/auth/login", redirect: keepRedirect },
  { path: "/auth/register", redirect: keepRedirect },
  { path: "/auth/magic", component: MagicLink, meta: { public: true } },
  { path: "/welcome", component: Welcome },

  // Family
  { path: "/family/create", component: FamilyCreate },
  {
    path: "/family/join",
    component: FamilyJoin,
    meta: { requireNoFamily: true },
  },

  // Wishlists
  { path: "/me", component: MyWishlist },
  { path: "/wishlists", component: Others },
  { path: "/wishlists/gifts", component: MyGifts },
  { path: "/wishlists/:userId", component: WishlistView, props: true },

  // Invites
  { path: "/family/invite", redirect: "/wishlists" },

  // Admin
  { path: "/admin", component: AdminHome, meta: { adminOnly: true } },
  {
    path: "/admin/users/:userId",
    component: AdminUser,
    props: true,
    meta: { adminOnly: true },
  },

  // A session that failed, and anything else
  { path: "/oops", component: SessionExpired, meta: { public: true } },
  { path: "/:pathMatch(.*)*", component: NotFound, meta: { public: true } },
];

/** The two old auth paths survive as redirects: bookmarks and family invite
 *  links carry a `redirect` that has to reach the merged screen intact. */
function keepRedirect(to: RouteLocation) {
  return { path: "/", query: to.query };
}

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
    } catch {
      // an expired or missing session is not an error here: the guards below
      // treat the user as logged out
    }
  }

  const isPublic = Boolean(to.meta?.public);

  if (to.meta?.onlyGuest && auth.isLogged) {
    return { path: "/me", replace: true };
  }

  if (!isPublic && !auth.isLogged) {
    return { path: "/", query: { redirect: to.fullPath } };
  }

  if (to.meta?.requireNoFamily && auth.isLogged && auth.inFamily) {
    return { path: "/me", replace: true };
  }

  if (to.meta?.adminOnly && !auth.isAdmin) {
    return { path: "/me", replace: true };
  }

  return true;
});

export default router;
