<template>
  <div>
    <NavBar />
    <main style="max-width: 900px; margin: 1rem auto; padding: 0 1rem;">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import NavBar from './components/NavBar.vue';
</script>

<style>
body { font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; }
a { text-decoration: none; color: inherit; }
</style>
