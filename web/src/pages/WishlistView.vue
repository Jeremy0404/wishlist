<template>
  <RouterLink
    to="/wishlists"
    class="-ml-1 mb-2 inline-flex min-h-11 items-center gap-1 font-semibold text-muted no-underline hover:text-ink"
    data-test="view-back"
  >
    <Icon name="chevronLeft" :size="20" />
    {{ t("view.back") }}
  </RouterLink>

  <PageHeader v-if="ownerName">
    {{ t("view.title", { name: ownerName }) }}
    <template #lead>{{ t("view.lead", { name: ownerName }) }}</template>
  </PageHeader>

  <p v-if="error" class="text-danger">{{ error }}</p>

  <ListSkeleton v-else-if="loading" />

  <ul
    v-else-if="items.length"
    class="m-0 list-none border-t border-divider p-0"
  >
    <li
      v-for="(it, index) in items"
      :key="it.id"
      class="border-b border-divider"
      data-test="wishlist-item"
      :data-id="it.id"
    >
      <PersonWishlistItem
        :item="it"
        :viewer-id="auth.user?.id"
        :tone="toneAt(index)"
        @reserve="reserve(it)"
        @unreserve="unreserve(it.id)"
      />
    </li>
  </ul>

  <p v-else class="py-8 text-center text-muted" data-test="empty-state">
    {{ t("view.empty", { name: ownerName }) }}
  </p>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import { useI18n } from "vue-i18n";
import { api } from "../services/api";
import Icon from "../components/ui/Icon.vue";
import ListSkeleton from "../components/ui/ListSkeleton.vue";
import PageHeader from "../components/PageHeader.vue";
import PersonWishlistItem from "../components/wishlist/PersonWishlistItem.vue";
import { useToasts } from "../components/ui/useToasts";
import { useAuth } from "../stores/auth.ts";
import { toneAt } from "../utils/tones";
import type { WishlistItem } from "../types.ts";

const { t } = useI18n();
const { push } = useToasts();
const auth = useAuth();

const ownerName = ref("");
const loading = ref(true);
const items = ref<WishlistItem[]>([]);
const error = ref("");

const props = defineProps<{ userId: string }>();

async function load() {
  try {
    const list = await api.viewWishlist(props.userId);
    ownerName.value = list.owner?.name ?? "";
    items.value = list.items ?? [];
  } catch (e: any) {
    error.value = e.message ?? t("toast.error");
  } finally {
    loading.value = false;
  }
}

async function reserve(item: WishlistItem) {
  await api.reserve(item.id);
  push(t("toast.giving", { title: item.title }), "success");
  await load();
}

async function unreserve(id: string) {
  await api.unreserve(id);
  push(t("toast.notGiving"), "info");
  await load();
}

onMounted(load);
</script>
