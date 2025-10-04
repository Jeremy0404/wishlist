<template>
  <h1 class="text-xl font-semibold mb-4">{{ ownerName ? `${ownerName}'s wishlist` : 'Wishlist' }}</h1>
  <p v-if="error" class="text-red-600">{{ error }}</p>

  <ul v-if="items.length" class="grid gap-3">
    <li v-for="it in items" :key="it.id">
      <Card>
        <div class="flex items-start justify-between gap-3">
          <div>
            <div class="font-medium">
              {{ it.title }} <span v-if="it.priority" class="text-xs text-zinc-500">• P{{ it.priority }}</span>
            </div>
            <div v-if="it.url" class="text-sm text-brand-700">
              <a :href="it.url" target="_blank">{{ it.url }}</a>
            </div>
            <div v-if="it.price_cents != null" class="text-sm text-zinc-600">
              {{ (it.price_cents/100).toFixed(2) }} EUR
            </div>
            <div v-if="it.notes" class="text-sm text-zinc-700 whitespace-pre-wrap mt-1">{{ it.notes }}</div>
          </div>

          <div class="flex gap-2 items-center">
            <template v-if="it.reserved">
              <span class="text-sm text-zinc-600">Reserved ({{ it.reservation_status }})</span>
              <span v-if="it.reserver_name" class="text-sm text-zinc-600">by {{ it.reserver_name }}</span>
              <Button variant="ghost" @click="unreserve(it.id)">Unreserve</Button>
              <Button variant="primary" @click="purchase(it.id)">Mark purchased</Button>
            </template>
            <template v-else>
              <Button variant="primary" @click="reserve(it.id)">Reserve</Button>
            </template>
          </div>
        </div>
      </Card>
    </li>
  </ul>

  <div v-else class="text-zinc-600">No items here yet.</div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { api } from '../services/api';
import Card from '../components/ui/Card.vue';
import Button from '../components/ui/Button.vue';
import { useToasts } from '../components/ui/useToasts';
const { push } = useToasts();

const route = useRoute();
const ownerName = ref(''); const items = ref<any[]>([]); const error = ref('');

async function load(){
  try {
    const userId = String(route.params.userId);
    const list = await api.viewWishlist(userId);
    ownerName.value = list.owner?.name ?? '';
    items.value = list.items ?? [];
  } catch (e:any){ error.value = e.message ?? 'Failed to load'; }
}
async function reserve(id:string){ await api.reserve(id); push('Reserved','success'); await load(); }
async function unreserve(id:string){ await api.unreserve(id); push('Unreserved','info'); await load(); }
async function purchase(id:string){ await api.purchase(id); push('Marked purchased','success'); await load(); }
onMounted(load);
</script>
