<template>
  <RouterLink
    to="/wishlists"
    class="pressable -ml-2 mb-2 inline-flex min-h-11 items-center gap-1 rounded-md pl-1 pr-3 font-semibold text-muted no-underline hover:bg-ink/7 hover:text-ink active:bg-ink/14"
    data-test="view-back"
  >
    <Icon name="chevronLeft" :size="20" />
    {{ t("view.back") }}
  </RouterLink>

  <PageHeader v-if="ownerName">
    {{ t("view.title", { name: ownerName }) }}
    <template #lead>{{ t("view.lead", { name: ownerName }) }}</template>
  </PageHeader>

  <PageMessage
    v-if="locked"
    icon="lock"
    :title="t('view.lockedTitle')"
    :body="t('view.locked')"
    :action-label="t('browse.locked.add')"
    action-to="/me"
  />

  <LoadError v-else-if="loadFailed" @retry="load" />

  <ListSkeleton v-else-if="loading" />

  <template v-else-if="items.length">
    <GiftFilters
      v-if="items.length >= FILTERS_FROM"
      v-model:filter="filter"
      v-model:by-price="byPrice"
    />

    <ul v-if="shown.length" class="m-0 list-none border-t border-divider p-0">
      <li
        v-for="it in shown"
        :key="it.id"
        class="border-b border-divider"
        data-test="wishlist-item"
        :data-id="it.id"
      >
        <PersonWishlistItem
          :item="it"
          :viewer-id="auth.user?.id"
          :tone="toneFor(it.id)"
          :busy="busy.has(it.id)"
          @reserve="reserve(it)"
          @unreserve="unreserve(it.id)"
        />
      </li>
    </ul>

    <div v-else class="py-8 text-center" data-test="filter-empty">
      <p class="mb-3 text-muted">{{ t("view.filters.none") }}</p>
      <Button variant="secondary" data-test="filter-reset" @click="filter = 'all'">
        {{ t("view.filters.showAll") }}
      </Button>
    </div>
  </template>

  <p v-else class="py-8 text-center text-muted" data-test="empty-state">
    {{ t("view.empty", { name: ownerName }) }}
  </p>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import { useI18n } from "vue-i18n";
import { api, ApiError } from "../services/api";
import Button from "../components/ui/Button.vue";
import Icon from "../components/ui/Icon.vue";
import ListSkeleton from "../components/ui/ListSkeleton.vue";
import LoadError from "../components/ui/LoadError.vue";
import PageMessage from "../components/ui/PageMessage.vue";
import PageHeader from "../components/PageHeader.vue";
import GiftFilters from "../components/wishlist/GiftFilters.vue";
import PersonWishlistItem from "../components/wishlist/PersonWishlistItem.vue";
import { useToasts } from "../components/ui/useToasts";
import { useAuth } from "../stores/auth.ts";
import { toneFor } from "../utils/tones";
import type { GiftFilter, WishlistItem } from "../types.ts";

const { t } = useI18n();
const { push } = useToasts();
const auth = useAuth();

const ownerName = ref("");
const loading = ref(true);
const items = ref<WishlistItem[]>([]);
const loaded = ref(false);
const loadFailed = ref(false);
const locked = ref(false);

const props = defineProps<{ userId: string }>();
const HTTP_FORBIDDEN = 403;
const HTTP_CONFLICT = 409;

const busy = ref(new Set<string>());

const FILTERS_FROM = 6;
const UNPRICED_LAST = Number.POSITIVE_INFINITY;
const filter = ref<GiftFilter>("all");
const byPrice = ref(false);

function matches(item: WishlistItem, wanted: GiftFilter) {
  if (wanted === "open") return !item.reserved;
  if (wanted === "mine") return !!item.reserved && item.reserver_user_id === auth.user?.id;
  return true;
}

function priceOf(item: WishlistItem) {
  return item.price_eur == null ? UNPRICED_LAST : Number(item.price_eur);
}

const shown = computed(() => {
  const kept = items.value.filter((item) => matches(item, filter.value));
  return byPrice.value ? [...kept].sort((a, b) => priceOf(a) - priceOf(b)) : kept;
});

/** A failed refresh keeps the list on screen and says so in a toast. */
async function load() {
  if (!loaded.value) loading.value = true;
  loadFailed.value = false;
  try {
    const list = await api.viewWishlist(props.userId);
    ownerName.value = list.owner?.name ?? "";
    items.value = list.items ?? [];
    loaded.value = true;
  } catch (e) {
    if (e instanceof ApiError && e.status === HTTP_FORBIDDEN) locked.value = true;
    else if (loaded.value) push(t("toast.error"), "error");
    else loadFailed.value = true;
  } finally {
    loading.value = false;
  }
}

function failureMessage(e: unknown) {
  return e instanceof ApiError && e.status === HTTP_CONFLICT
    ? t("toast.justTaken")
    : t("toast.error");
}

async function act(id: string, request: () => Promise<void>) {
  if (busy.value.has(id)) return;
  busy.value.add(id);
  try {
    await request();
  } catch (e) {
    push(failureMessage(e), "error");
  } finally {
    await load();
    busy.value.delete(id);
  }
}

function reserve(item: WishlistItem) {
  return act(item.id, async () => {
    await api.reserve(item.id);
    push(t("toast.giving", { title: item.title }), "success");
  });
}

function unreserve(id: string) {
  return act(id, async () => {
    await api.unreserve(id);
    push(t("toast.notGiving"), "info");
  });
}

onMounted(load);
</script>
