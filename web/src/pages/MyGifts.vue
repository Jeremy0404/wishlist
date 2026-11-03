<template>
  <RouterLink
    to="/wishlists"
    class="pressable -ml-2 mb-2 inline-flex min-h-11 items-center gap-1 rounded-md pl-1 pr-3 font-semibold text-muted no-underline hover:bg-ink/7 hover:text-ink active:bg-ink/14"
    data-test="view-back"
  >
    <Icon name="chevronLeft" :size="20" />
    {{ t("view.back") }}
  </RouterLink>

  <PageHeader>
    {{ t("gifts.title") }}
    <template #lead>{{ t("gifts.lead") }}</template>
  </PageHeader>

  <ListSkeleton v-if="loading" />

  <LoadError v-else-if="loadFailed" @retry="load" />

  <template v-else-if="gifts.length">
    <section
      v-for="group in groups"
      :key="group.ownerId"
      class="mb-6"
      data-test="gift-group"
    >
      <RouterLink
        :to="`/wishlists/${group.ownerId}`"
        class="mb-1 inline-flex min-h-11 items-center gap-1 text-h3 font-semibold text-ink no-underline hover:text-accent-800"
      >
        {{ group.ownerName }}
        <Icon name="chevronRight" :size="20" class="text-neutral-500" />
      </RouterLink>
      <ul class="m-0 list-none border-t border-divider p-0">
        <li
          v-for="gift in group.gifts"
          :key="gift.id"
          class="flex items-center gap-3.5 border-b border-divider px-1 py-3"
          data-test="gift-item"
        >
          <ItemTile :image-url="gift.image_url" :tone="toneFor(gift.id)" />
          <span class="min-w-0 flex-1 font-semibold">{{ gift.title }}</span>
          <span v-if="gift.price_eur != null" class="text-caption font-semibold">
            {{ fmtEUR.format(Number(gift.price_eur)) }}
          </span>
        </li>
      </ul>
    </section>

    <p v-if="total" class="text-right font-semibold" data-test="gifts-total">
      {{ t("gifts.total", { amount: fmtEUR.format(total) }) }}
    </p>
  </template>

  <div v-else class="px-2 py-8 text-center" data-test="empty-state">
    <p class="mb-4 text-muted">{{ t("gifts.empty") }}</p>
    <Button variant="primary" to="/wishlists">{{ t("gifts.browse") }}</Button>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import { useI18n } from "vue-i18n";
import { api } from "../services/api";
import Button from "../components/ui/Button.vue";
import Icon from "../components/ui/Icon.vue";
import ListSkeleton from "../components/ui/ListSkeleton.vue";
import LoadError from "../components/ui/LoadError.vue";
import PageHeader from "../components/PageHeader.vue";
import ItemTile from "../components/wishlist/ItemTile.vue";
import { fmtEUR } from "../utils/money";
import { toneFor } from "../utils/tones";
import type { Gift } from "../types.ts";

const { t } = useI18n();

const loading = ref(true);
const loadFailed = ref(false);
const gifts = ref<Gift[]>([]);

const groups = computed(() => {
  const byOwner = new Map<string, { ownerId: string; ownerName: string; gifts: Gift[] }>();
  for (const gift of gifts.value) {
    const group = byOwner.get(gift.owner_id) ?? {
      ownerId: gift.owner_id,
      ownerName: gift.owner_name,
      gifts: [],
    };
    group.gifts.push(gift);
    byOwner.set(gift.owner_id, group);
  }
  return [...byOwner.values()];
});

const total = computed(() =>
  gifts.value.reduce((sum, gift) => sum + Number(gift.price_eur ?? 0), 0),
);

async function load() {
  loading.value = true;
  loadFailed.value = false;
  try {
    gifts.value = await api.myGifts();
  } catch {
    loadFailed.value = true;
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>
