<template>
  <div class="min-h-screen bg-white text-zinc-900">
    <NavBar />

    <main class="max-w-5xl mx-auto px-4 py-6">
      <ToastContainer />
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import NavBar from "./components/NavBar.vue";
import ToastContainer from "./components/ui/ToastContainer.vue";
import { useAuth } from "./stores/auth.ts";

const auth = useAuth();
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
