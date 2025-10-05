<template>
  <nav
    class="sticky top-0 z-50 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 border-b border-zinc-200"
  >
    <div class="max-w-5xl mx-auto px-4 py-2">
      <div class="flex items-center gap-2 flex-wrap">
        <RouterLink to="/" class="font-semibold me-2 focus-ring">
          🎄 Wishlist
        </RouterLink>

        <FamilyBadge class="shrink-0" />

        <div class="ms-auto"></div>

        <template v-if="auth.user">
          <button
            class="px-3 py-1.5 rounded hover:bg-zinc-100 focus-ring"
            @click="onLogout"
          >
            {{ t("nav.logout") }}
          </button>
        </template>
        <template v-else>
          <RouterLink
            class="px-3 py-1.5 rounded hover:bg-zinc-100 focus-ring"
            to="/auth/login"
          >
            {{ t("nav.login") }}
          </RouterLink>
          <RouterLink
            class="px-3 py-1.5 rounded bg-brand text-white hover:bg-brand-700 focus-ring"
            to="/auth/register"
          >
            {{ t("nav.register") }}
          </RouterLink>
        </template>
      </div>

      <div class="mt-2 flex items-center gap-1 text-zinc-800 flex-wrap">
        <RouterLink class="nav-link" to="/">{{
          t("nav.home") ?? "Accueil"
        }}</RouterLink>

        <template v-if="auth.user">
          <RouterLink class="nav-link" to="/me">{{
            t("nav.myList")
          }}</RouterLink>
          <RouterLink v-if="auth.inFamily" class="nav-link" to="/wishlists">{{
            t("nav.others")
          }}</RouterLink>
          <RouterLink
            v-if="auth.inFamily"
            class="nav-link"
            to="/family/invite"
            >{{ t("nav.invite") }}</RouterLink
          >
        </template>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { RouterLink, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useAuth } from "../stores/auth.ts";
import { useToasts } from "./ui/useToasts.ts";
import FamilyBadge from "./FamilyBadge.vue";

const { t } = useI18n();
const auth = useAuth();
const router = useRouter();
const { push } = useToasts();

async function onLogout() {
  await auth.logout();
  push("À bientôt !", "info");
  await router.push("/");
}

onMounted(() => {
  if (auth.user === undefined) auth.hydrate();
});
</script>

<style scoped>
.focus-ring:focus-visible,
.nav-link:focus-visible {
  outline: 2px solid rgb(22 101 52);
  outline-offset: 2px;
  border-radius: 0.5rem;
}

.nav-link {
  padding: 0.375rem 0.75rem;
  border-radius: 0.5rem;
}
.nav-link:hover {
  background: rgb(244 244 245);
}
</style>
