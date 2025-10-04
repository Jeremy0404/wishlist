<template>
  <h1>Family wishlists</h1>
  <p style="opacity:.8;">You can see others once your own wishlist has at least one item.</p>

  <ul v-if="rows.length" style="list-style:none; padding:0; display:grid; gap:.5rem;">
    <li v-for="r in rows" :key="r.user_id" style="border:1px solid #eee; padding:.75rem; border-radius:8px;">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div><strong>{{ r.name }}</strong></div>
        <RouterLink :to="`/wishlists/${r.user_id}`">Open</RouterLink>
      </div>
    </li>
  </ul>

  <div v-else style="opacity:.7;">No other wishlists yet.</div>

  <p v-if="error" style="color:#b00">{{ error }}</p>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { api } from '../services/api';
import { RouterLink } from 'vue-router';

const rows = ref<any[]>([]);
const error = ref('');

onMounted(async () => {
  try {
    rows.value = await api.others();
  } catch (e: any) {
    error.value = e.message ?? 'Failed to load';
  }
});
</script>
