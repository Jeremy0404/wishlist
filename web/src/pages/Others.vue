<template>
  <h1 class="text-xl font-semibold mb-4">Family wishlists</h1>
  <p class="text-zinc-600 mb-3">You can see others once your own wishlist has at least one item.</p>

  <ul v-if="rows.length" class="grid gap-3">
    <li v-for="r in rows" :key="r.user_id">
      <Card>
        <div class="flex items-center justify-between">
          <div class="font-medium">{{ r.name }}</div>
          <RouterLink class="px-3 py-1.5 rounded hover:bg-zinc-100" :to="`/wishlists/${r.user_id}`">Open</RouterLink>
        </div>
      </Card>
    </li>
  </ul>
  <div v-else class="text-zinc-600">No other wishlists yet.</div>

  <p v-if="error" class="text-red-600 mt-3">{{ error }}</p>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { api } from '../services/api';
import Card from '../components/ui/Card.vue';
import { RouterLink } from 'vue-router';
const rows = ref<any[]>([]), error = ref('');
onMounted(async () => { try { rows.value = await api.others(); } catch (e:any){ error.value = e.message ?? 'Failed to load'; }});
</script>
