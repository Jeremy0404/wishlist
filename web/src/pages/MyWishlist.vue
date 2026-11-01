<template>
  <PageHeader>
    {{ t("my.title") }}
    <template #lead>{{ t("my.lead") }}</template>
  </PageHeader>

  <Button
    variant="primary"
    block
    class="min-h-14 text-body"
    data-test="wishlist-add-open"
    @click="openAdd"
  >
    <Icon name="plus" :size="22" />
    {{ t("item.add") }}
  </Button>

  <ListSkeleton v-if="loading" />

  <div
    v-else-if="items.length === 0"
    class="px-2 py-8 text-center"
    data-test="empty-state"
  >
    <p class="mb-1 font-semibold">{{ t("my.emptyTitle") }}</p>
    <p class="mb-0 text-muted">{{ t("my.emptyBody") }}</p>
  </div>

  <ul v-else class="m-0 list-none border-t border-divider p-0">
    <li
      v-for="(it, index) in items"
      :key="it.id"
      class="border-b border-divider"
      data-test="wishlist-item"
      :data-title="it.original_title || it.title"
      :data-id="it.id"
    >
      <WishlistRow :item="it" :tone="toneAt(index)" @open="openEdit(it)" />
    </li>
  </ul>

  <ShareCard :wishlist="wishlist" @change="(updated) => (wishlist = updated)" />

  <InviteNudge />

  <ItemSheet
    :open="sheetOpen"
    :item="editing"
    @close="sheetOpen = false"
    @added="onAdded"
    @updated="onUpdated"
    @removed="onRemoved"
  />
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { api } from "../services/api";
import Button from "../components/ui/Button.vue";
import Icon from "../components/ui/Icon.vue";
import ListSkeleton from "../components/ui/ListSkeleton.vue";
import ItemSheet from "../components/wishlist/ItemSheet.vue";
import WishlistRow from "../components/wishlist/WishlistRow.vue";
import ShareCard from "../components/wishlist/ShareCard.vue";
import InviteNudge from "../components/InviteNudge.vue";
import PageHeader from "../components/PageHeader.vue";
import { toneAt } from "../utils/tones";
import type { Wishlist, WishlistItem } from "../types.ts";

const { t } = useI18n();

const loading = ref(true);
const items = ref<WishlistItem[]>([]);
const wishlist = ref<Wishlist | null>(null);
const sheetOpen = ref(false);
const editing = ref<WishlistItem | null>(null);

function normalizeItem(item: WishlistItem): WishlistItem {
  return { ...item, original_title: item.original_title ?? item.title };
}

async function load() {
  try {
    const data = await api.getMyWishlist();
    items.value = (data.items ?? []).map(normalizeItem);
    wishlist.value = data.wishlist ?? null;
  } finally {
    loading.value = false;
  }
}

function openAdd() {
  editing.value = null;
  sheetOpen.value = true;
}

function openEdit(item: WishlistItem) {
  editing.value = item;
  sheetOpen.value = true;
}

async function onAdded(created: WishlistItem) {
  items.value.unshift(normalizeItem(created));
  if (!wishlist.value) wishlist.value = (await api.getMyWishlist()).wishlist;
}

function onUpdated(updated: WishlistItem) {
  items.value = items.value.map((it) =>
    it.id === updated.id
      ? normalizeItem({ ...it, ...updated, original_title: it.original_title })
      : it,
  );
}

function onRemoved(id: string) {
  items.value = items.value.filter((it) => it.id !== id);
}

onMounted(load);
</script>
