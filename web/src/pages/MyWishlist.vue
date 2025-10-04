<template>
  <h1>My wishlist</h1>

  <form @submit.prevent="add" style="display:grid; gap:.5rem; max-width: 520px; margin-bottom:1rem;">
    <input v-model="form.title" placeholder="Title" required />
    <input v-model="form.url" placeholder="Link (optional)" />
    <div style="display:flex; gap:.5rem;">
      <input v-model.number="form.price_cents" type="number" min="0" step="1" placeholder="Price (cents)" />
      <input v-model="form.currency" placeholder="CUR" maxlength="3" style="width:6rem;" />
      <input v-model.number="form.priority" type="number" min="1" max="5" placeholder="Priority 1–5" />
    </div>
    <textarea v-model="form.notes" rows="3" placeholder="Notes"></textarea>
    <button>Add item</button>
    <p v-if="error" style="color:#b00">{{ error }}</p>
  </form>

  <div v-if="items.length === 0" style="opacity:.7;">No items yet — add your first to unlock others’ lists.</div>

  <ul style="list-style:none; padding:0; display:grid; gap:.5rem;">
    <li v-for="it in items" :key="it.id" style="border:1px solid #eee; padding:.75rem; border-radius:8px;">
      <div style="display:flex; justify-content:space-between; gap:1rem; align-items:center;">
        <div>
          <strong>{{ it.title }}</strong>
          <span v-if="it.priority"> • P{{ it.priority }}</span>
          <div v-if="it.url"><a :href="it.url" target="_blank">{{ it.url }}</a></div>
          <div v-if="it.price_cents != null">
            {{ (it.price_cents/100).toFixed(2) }} {{ it.currency ?? 'EUR' }}
          </div>
          <div v-if="it.notes" style="white-space:pre-wrap; opacity:.85;">{{ it.notes }}</div>
        </div>
        <div style="display:flex; gap:.5rem;">
          <button @click="removeItem(it.id)">Delete</button>
        </div>
      </div>
    </li>
  </ul>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { api } from '../services/api';

const items = ref<any[]>([]);
const error = ref('');

const form = reactive({
  title: '',
  url: '',
  price_cents: undefined as number | undefined,
  currency: 'EUR',
  notes: '',
  priority: 3
});

async function load() {
  error.value = '';
  await api.ensureMyWishlist().catch(() => {});
  const data = await api.getMyWishlist();
  items.value = data.items ?? [];
}

async function add() {
  error.value = '';
  try {
    const created = await api.addMyItem({
      title: form.title,
      url: form.url || undefined,
      price_cents: form.price_cents ? Number(form.price_cents) : undefined,
      currency: form.currency || undefined,
      notes: form.notes || undefined,
      priority: form.priority
    });
    items.value.unshift(created);
    form.title = '';
    form.url = '';
    form.price_cents = undefined;
    form.notes = '';
    form.priority = 3;
  } catch (e: any) {
    error.value = e.message ?? 'Failed to add';
  }
}

async function removeItem(id: string) {
  await api.deleteMyItem(id);
  items.value = items.value.filter(i => i.id !== id);
}

onMounted(load);
</script>
