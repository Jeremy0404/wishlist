<template>
  <h1 class="text-xl font-semibold mb-4">My wishlist</h1>

  <Card class="mb-4">
    <template #header><h2 class="font-semibold">Add an item</h2></template>
    <form @submit.prevent="add" class="grid gap-3 sm:grid-cols-2">
      <Input v-model="form.title" label="Title" required />
      <Input v-model="form.url" label="Link (optional)" />
      <Input
        v-model.number="form.price_cents"
        type="number"
        label="Price (cents)"
      />
      <Input
        v-model.number="form.priority"
        type="number"
        label="Priority (1–5)"
      />
      <div class="sm:col-span-2">
        <label class="block text-sm mb-1" for="notes">Notes</label>
        <textarea
          v-model="form.notes"
          rows="3"
          class="w-full rounded-lg border-zinc-300 bg-white text-sm focus:ring-brand-500 focus:border-brand-500"
          placeholder="Notes"
        ></textarea>
      </div>
      <div class="sm:col-span-2">
        <Button variant="primary" :loading="submitting">Add item</Button>
      </div>
    </form>
  </Card>

  <div v-if="items.length === 0" class="text-zinc-600">
    No items yet — add your first to unlock others’ lists.
  </div>

  <ul class="grid gap-3">
    <li v-for="it in items" :key="it.id">
      <Card>
        <div class="flex items-start justify-between gap-3">
          <div>
            <div class="font-medium">
              {{ it.title }}
              <span v-if="it.priority" class="text-xs text-zinc-500"
                >• P{{ it.priority }}</span
              >
            </div>
            <div v-if="it.url" class="text-sm text-brand-700">
              <a :href="it.url" target="_blank">{{ it.url }}</a>
            </div>
            <div v-if="it.price_cents != null" class="text-sm text-zinc-600">
              {{ (it.price_cents / 100).toFixed(2) }} EUR
            </div>
            <div
              v-if="it.notes"
              class="text-sm text-zinc-700 whitespace-pre-wrap mt-1"
            >
              {{ it.notes }}
            </div>
          </div>
          <Button variant="ghost" @click="removeItem(it.id)">Delete</Button>
        </div>
      </Card>
    </li>
  </ul>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { api } from "../services/api";
import Card from "../components/ui/Card.vue";
import Button from "../components/ui/Button.vue";
import Input from "../components/ui/Input.vue";
import { useToasts } from "../components/ui/useToasts";

const { push } = useToasts();

const items = ref<any[]>([]);
const submitting = ref(false);
const form = reactive({
  title: "",
  url: "",
  price_cents: undefined as number | undefined,
  notes: "",
  priority: 3,
});

async function load() {
  await api.ensureMyWishlist().catch(() => {});
  const data = await api.getMyWishlist(); // server returns NO reservation info for owner
  items.value = data.items ?? [];
}

async function add() {
  submitting.value = true;
  try {
    const created = await api.addMyItem({
      title: form.title || "",
      url: form.url || undefined,
      price_cents: form.price_cents ? Number(form.price_cents) : undefined,
      notes: form.notes || undefined,
      priority: form.priority,
    });
    items.value.unshift(created);
    form.title = "";
    form.url = "";
    form.price_cents = undefined;
    form.notes = "";
    form.priority = 3;
    push("Item added", "success");
  } finally {
    submitting.value = false;
  }
}

async function removeItem(id: string) {
  await api.deleteMyItem(id);
  items.value = items.value.filter((i) => i.id !== id);
  push("Item removed", "info");
}

onMounted(load);
</script>
