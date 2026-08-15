<template>
  <div class="mb-4 flex items-center justify-between gap-3">
    <h1 class="text-xl font-semibold">{{ t("my.title") }}</h1>
    <WishlistExportButton :items="items" />
  </div>

  <ShareCard :wishlist="wishlist" @change="(updated) => (wishlist = updated)" />

  <InviteNudge />

  <QuickAdd @added="onAdded" />

  <div v-if="items.length === 0" class="text-neutral-700">
    {{ t("my.empty") }}
  </div>

  <ul class="grid gap-3">
    <li
      v-for="it in items"
      :key="it.id"
      data-test="wishlist-item"
      :data-title="it.original_title || it.title"
      :data-id="it.id"
    >
      <WishlistItemEditor
        v-if="editingId === it.id"
        :initial-item="it"
        :loading="editSubmitting"
        @save="(payload) => saveEdit(it.id, payload)"
        @cancel="cancelEdit"
      />
      <WishlistItemCard
        v-else
        :item="it"
        @edit="beginEdit(it)"
        @delete="removeItem(it.id)"
      />
    </li>
  </ul>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { api } from "../services/api";
import { useToasts } from "../components/ui/useToasts";
import { useI18n } from "vue-i18n";
import QuickAdd from "../components/wishlist/QuickAdd.vue";
import WishlistItemCard from "../components/wishlist/WishlistItemCard.vue";
import WishlistItemEditor from "../components/wishlist/WishlistItemEditor.vue";
import WishlistExportButton from "../components/wishlist/WishlistExportButton.vue";
import ShareCard from "../components/wishlist/ShareCard.vue";
import InviteNudge from "../components/InviteNudge.vue";
import type { Wishlist, WishlistItem, WishlistItemForm } from "../types.ts";

const { push } = useToasts();
const { t } = useI18n();

const items = ref<WishlistItem[]>([]);
const wishlist = ref<Wishlist | null>(null);
const editSubmitting = ref(false);
const editingId = ref<string | null>(null);

function normalizeItem(item: WishlistItem): WishlistItem {
  return { ...item, original_title: item.original_title ?? item.title };
}

async function load() {
  const data = await api.getMyWishlist();
  items.value = (data.items ?? []).map(normalizeItem);
  wishlist.value = data.wishlist ?? null;
}

async function onAdded(created: WishlistItem) {
  items.value.unshift(normalizeItem(created));
  if (!wishlist.value) wishlist.value = (await api.getMyWishlist()).wishlist;
}

async function removeItem(id: string) {
  await api.deleteMyItem(id);
  items.value = items.value.filter((i) => i.id !== id);
  push(t("toast.removed"), "info");
}

function beginEdit(item: WishlistItem) {
  editingId.value = item.id;
}

function cancelEdit() {
  editingId.value = null;
  editSubmitting.value = false;
}

async function saveEdit(id: string, form: WishlistItemForm) {
  if (!form.title?.trim()) {
    push(t("my.validation.titleRequired"), "error");
    return;
  }

  editingId.value = id;
  editSubmitting.value = true;
  try {
    const updated = await api.updateMyItem(id, {
      title: form.title.trim(),
      url: form.url || undefined,
      price_eur: form.price_eur,
      notes: form.notes || undefined,
      priority: form.priority,
    });
    items.value = items.value.map((it) =>
      it.id === id
        ? normalizeItem({
            ...it,
            ...updated,
            original_title: it.original_title,
          })
        : it,
    );
    push(t("toast.updated"), "success");
    cancelEdit();
  } catch (e: any) {
    push(e?.message || t("toast.error"), "error");
  } finally {
    editSubmitting.value = false;
  }
}

onMounted(load);
</script>
