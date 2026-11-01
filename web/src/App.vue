<template>
  <div class="min-h-screen bg-bg text-ink">
    <template v-if="isMinimalLayout">
      <ToastContainer />
      <main class="min-h-screen">
        <router-view />
      </main>
    </template>

    <template v-else>
      <AppNav v-if="auth.isLogged" />
      <header v-else class="mx-auto max-w-3xl px-4 pt-6 md:px-6">
        <RouterLink to="/" class="text-ink transition-opacity hover:opacity-75">
          <BrandLockup />
        </RouterLink>
      </header>

      <main
        class="mx-auto max-w-3xl px-4 pt-6 md:px-6 md:pb-16 md:pt-10"
        :class="auth.isLogged ? 'pb-28' : 'pb-12'"
      >
        <ToastContainer />
        <div class="*:not-first:mt-6 *:not-first:mb-0">
          <router-view />
        </div>
      </main>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import { RouterLink, useRoute } from "vue-router";
import AppNav from "./components/AppNav.vue";
import BrandLockup from "./components/ui/BrandLockup.vue";
import ToastContainer from "./components/ui/ToastContainer.vue";
import { useAuth } from "./stores/auth.ts";

const auth = useAuth();
const route = useRoute();
const isMinimalLayout = computed(() => Boolean(route.meta?.minimal));
onMounted(() => {
  if (auth.user === undefined) auth.hydrate();
});
</script>
