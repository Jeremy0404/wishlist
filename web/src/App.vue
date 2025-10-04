<template>
  <div class="min-h-screen bg-white text-zinc-900">
    <nav class="border-b border-zinc-200">
      <div
        class="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3 flex-wrap"
      >
        <RouterLink to="/" class="font-semibold">🎄 Wishlist</RouterLink>

        <div class="ml-auto flex items-center gap-2">
          <RouterLink class="px-3 py-1.5 rounded hover:bg-zinc-100" to="/">{{
            t("nav.home")
          }}</RouterLink>

          <template v-if="auth.user">
            <RouterLink
              class="px-3 py-1.5 rounded hover:bg-zinc-100"
              to="/me"
              >{{ t("nav.myList") }}</RouterLink
            >
            <RouterLink
              v-if="auth.inFamily"
              class="px-3 py-1.5 rounded hover:bg-zinc-100"
              to="/wishlists"
              >{{ t("nav.others") }}</RouterLink
            >
            <RouterLink
              v-if="auth.inFamily"
              class="px-3 py-1.5 rounded hover:bg-zinc-100"
              to="/family/invite"
              >{{ t("nav.invite") }}</RouterLink
            >

            <button
              class="px-3 py-1.5 rounded hover:bg-zinc-100"
              @click="onLogout"
            >
              {{ t("nav.logout") }}
            </button>
          </template>

          <template v-else>
            <RouterLink
              class="px-3 py-1.5 rounded hover:bg-zinc-100"
              to="/auth/login"
              >{{ t("nav.login") }}</RouterLink
            >
            <RouterLink
              class="px-3 py-1.5 rounded bg-brand text-white hover:bg-brand-700"
              to="/auth/register"
              >{{ t("nav.register") }}</RouterLink
            >
          </template>
        </div>
      </div>
    </nav>

    <main class="max-w-5xl mx-auto px-4 py-6">
      <ToastContainer />
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { RouterLink, useRouter } from "vue-router";
import ToastContainer from "./components/ui/ToastContainer.vue";
import { useToasts } from "./components/ui/useToasts";
import { useAuth } from "./stores/auth";
import { onMounted } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const auth = useAuth();
const router = useRouter();
const { push } = useToasts();

async function onLogout() {
  await auth.logout();
  push("À bientôt !", "info");
  router.push("/");
}

onMounted(() => {
  if (auth.user === undefined) auth.hydrate();
});
</script>

<style>
body {
  font-family:
    system-ui,
    -apple-system,
    Segoe UI,
    Roboto,
    sans-serif;
}
a {
  text-decoration: none;
  color: inherit;
}
</style>
