<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-900">
    <NavBar />

    <main class="max-w-6xl mx-auto px-4 py-10">
      <div
        class="bg-white/85 backdrop-blur-lg border border-slate-200 shadow-xl shadow-slate-900/5 rounded-3xl p-6 md:p-10 space-y-6"
      >
        <ToastContainer />
        <router-view />
      </div>
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
a {
  text-decoration: none;
  color: inherit;
}
</style>
