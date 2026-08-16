<template>
  <div class="mb-4 flex items-center justify-between gap-3">
    <h1 class="text-xl font-semibold">{{ t("my.title") }}</h1>
    <WishlistExportButton :items="items" />
  </div>

  <DisplayName />

  <ShareCard :wishlist="wishlist" @change="(updated) => (wishlist = updated)" />

  <InviteNudge />

  <QuickAdd ref="quickAdd" @added="onAdded" />

  <ListSkeleton v-if="loading" />

  <EmptyState
    v-else-if="items.length === 0"
    icon="plus"
    :message="t('my.empty')"
  >
    <template #action>
      <Button
        variant="secondary"
        data-test="empty-add"
        @click="quickAdd?.focus()"
      >
        {{ t("my.emptyAction") }}
      </Button>
    </template>
  </EmptyState>

  <ul v-else class="grid gap-3">
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
        @save="(payload, photo) => saveEdit(it.id, payload, photo)"
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
import Button from "../components/ui/Button.vue";
import EmptyState from "../components/ui/EmptyState.vue";
import ListSkeleton from "../components/ui/ListSkeleton.vue";
import QuickAdd from "../components/wishlist/QuickAdd.vue";
import WishlistItemCard from "../components/wishlist/WishlistItemCard.vue";
import WishlistItemEditor from "../components/wishlist/WishlistItemEditor.vue";
import WishlistExportButton from "../components/wishlist/WishlistExportButton.vue";
import ShareCard from "../components/wishlist/ShareCard.vue";
import InviteNudge from "../components/InviteNudge.vue";
import DisplayName from "../components/DisplayName.vue";
import type { Wishlist, WishlistItem, WishlistItemForm } from "../types.ts";

const { push } = useToasts();
const { t } = useI18n();

const quickAdd = ref<InstanceType<typeof QuickAdd> | null>(null);
const loading = ref(true);
const items = ref<WishlistItem[]>([]);
const wishlist = ref<Wishlist | null>(null);
const editSubmitting = ref(false);
const editingId = ref<string | null>(null);

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

async function onAdded(created: WishlistItem) {
  items.value.unshift(normalizeItem(created));
  if (!wishlist.value) wishlist.value = (await api.getMyWishlist()).wishlist;
}

async function removeItem(id: string) {
  await api.deleteMyItem(id);
  items.value = items.value.filter((i) => i.id !== id);
  push(t("toast.removed"), "success");
}

function beginEdit(item: WishlistItem) {
  editingId.value = item.id;
}

function cancelEdit() {
  editingId.value = null;
  editSubmitting.value = false;
}

async function saveEdit(
  id: string,
  form: WishlistItemForm,
  photo: File | null,
) {
  if (!form.title?.trim()) {
    push(t("my.validation.titleRequired"), "error");
    return;
  }

  editingId.value = id;
  editSubmitting.value = true;
  try {
    const updated = await api.updateMyItem(
      id,
      {
        title: form.title.trim(),
        url: form.url || undefined,
        price_eur: form.price_eur,
        notes: form.notes || undefined,
        priority: form.priority,
        image_url: form.image_url,
      },
      photo,
    );
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
