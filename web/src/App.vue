<template>
  <div class="min-h-screen bg-white text-zinc-900">
    <nav class="border-b border-zinc-200">
      <div class="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3 flex-wrap">
        <span class="font-semibold">🎄 Wishlist</span>
        <FamilyBadge class="ml-2" />
        <div class="ml-auto flex items-center gap-2">
          <RouterLink class="px-3 py-1.5 rounded hover:bg-zinc-100" to="/me">My list</RouterLink>
          <RouterLink class="px-3 py-1.5 rounded hover:bg-zinc-100" to="/wishlists">Others</RouterLink>
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
import { RouterLink } from 'vue-router';
import FamilyBadge from './components/FamilyBadge.vue';
import ToastContainer from './components/ui/ToastContainer.vue';
</script>

<style>
body { font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; }
a { text-decoration: none; color: inherit; }
</style>
