<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { api } from '../services/api';

const route = useRoute();
const ownerName = ref('');
const items = ref<any[]>([]);
const error = ref('');

async function load() {
  try {
    const userId = String(route.params.userId);
    const list = await api.viewWishlist(userId);
    ownerName.value = list.owner?.name ?? '';
    items.value = list.items ?? [];
  } catch (e: any) {
    error.value = e.message ?? 'Failed to load';
  }
}
onMounted(load);

async function reserve(itemId: string) { try { await api.reserve(itemId); await load(); } catch (e: any) { error.value = e.message; } }
async function unreserve(itemId: string) { try { await api.unreserve(itemId); await load(); } catch (e: any) { error.value = e.message; } }
async function purchase(itemId: string) { try { await api.purchase(itemId); await load(); } catch (e: any) { error.value = e.message; } }
</script>

<template>
  <h1>{{ ownerName ? `${ownerName}'s wishlist` : 'Wishlist' }}</h1>
  <p v-if="error" style="color:#b00">{{ error }}</p>

  <ul v-if="items.length" style="list-style:none; padding:0; display:grid; gap:.5rem;">
    <li v-for="it in items" :key="it.id" style="border:1px solid #eee; padding:.75rem; border-radius:8px;">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <strong>{{ it.title }}</strong>
          <span v-if="it.priority"> • P{{ it.priority }}</span>
          <div v-if="it.url"><a :href="it.url" target="_blank">{{ it.url }}</a></div>
          <div v-if="it.price_cents != null">{{ (it.price_cents/100).toFixed(2) }} {{ it.currency ?? 'EUR' }}</div>
          <div v-if="it.notes" style="white-space:pre-wrap; opacity:.85;">{{ it.notes }}</div>
        </div>
        <div style="display:flex; gap:.5rem; align-items:center;">
          <template v-if="it.reserved">
            <span>Reserved ({{ it.reservation_status }})</span>
            <span v-if="it.reserver_name">by {{ it.reserver_name }}</span>
            <button @click="unreserve(it.id)">Unreserve</button>
            <button @click="purchase(it.id)">Mark purchased</button>
          </template>
          <template v-else>
            <button @click="reserve(it.id)">Reserve</button>
          </template>
        </div>
      </div>
    </li>
  </ul>

  <div v-else style="opacity:.7;">No items here yet.</div>
</template>
