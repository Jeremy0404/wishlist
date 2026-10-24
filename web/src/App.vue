<template>
  <div
    :class="[
      'min-h-screen text-neutral-900',
      isMinimalLayout
        ? 'bg-bg'
        : 'bg-linear-to-br from-neutral-100 via-bg to-neutral-200',
    ]"
  >
    <NavBar v-if="!isMinimalLayout" />

    <main
      :class="[
        isMinimalLayout
          ? 'min-h-screen'
          : 'max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14',
      ]"
    >
      <div v-if="isMinimalLayout">
        <ToastContainer />
        <router-view />
      </div>
      <div
        v-else
        class="bg-surface/80 backdrop-blur-xl border border-divider shadow-lg rounded-card p-6 sm:p-8 lg:p-10 *:not-first:mt-6 *:not-first:mb-0"
      >
        <ToastContainer />
        <router-view />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import NavBar from "./components/NavBar.vue";
import ToastContainer from "./components/ui/ToastContainer.vue";
import { useAuth } from "./stores/auth.ts";

const auth = useAuth();
const route = useRoute();
const isMinimalLayout = computed(() => Boolean(route.meta?.minimal));
onMounted(() => {
  if (auth.user === undefined) auth.hydrate();
});
</script>

