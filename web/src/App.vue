<script setup lang="ts">
import { RouterLink, useRoute } from "vue-router";
import FamilyBadge from "./components/FamilyBadge.vue";
import ToastContainer from "./components/ui/ToastContainer.vue";
import { useAuth } from "./stores/auth";

const route = useRoute();
const auth = useAuth();
</script>

<template>
  <div class="min-h-screen bg-white text-zinc-900">
    <nav class="border-b border-zinc-200">
      <div
        class="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3 flex-wrap"
      >
        <RouterLink to="/" class="font-semibold">🎄 Wishlist</RouterLink>

        <FamilyBadge v-if="route.path !== '/'" class="ml-2" />

        <div class="ml-auto flex items-center gap-2">
          <template v-if="route.path === '/'">
            <RouterLink
              class="px-3 py-1.5 rounded hover:bg-zinc-100"
              to="/auth/register"
              >Créer un compte</RouterLink
            >
            <RouterLink
              class="px-3 py-1.5 rounded hover:bg-zinc-100"
              to="/auth/login"
              >Se connecter</RouterLink
            >
          </template>
          <template v-else>
            <RouterLink class="px-3 py-1.5 rounded hover:bg-zinc-100" to="/me"
              >Ma liste</RouterLink
            >
            <RouterLink
              class="px-3 py-1.5 rounded hover:bg-zinc-100"
              to="/wishlists"
              v-if="auth.inFamily"
              >Les autres</RouterLink
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
