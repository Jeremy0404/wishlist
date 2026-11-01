<template>
  <Card data-test="sample-wishlist">
    <div class="mb-4 flex items-center justify-between gap-3">
      <h2 class="font-heading text-h5 text-ink">{{ t("sample.title") }}</h2>
      <Tag variant="outline">{{ t("sample.badge") }}</Tag>
    </div>

    <ul class="m-0 list-none border-t border-divider p-0">
      <li
        v-for="(item, index) in SAMPLE_ITEMS"
        :key="item.id"
        class="border-b border-divider"
      >
        <PersonWishlistItem :item="item" :tone="toneAt(index)" />
      </li>
    </ul>

    <p class="mt-4 text-meta text-muted">{{ t("sample.disclaimer") }}</p>
  </Card>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import PersonWishlistItem from "./wishlist/PersonWishlistItem.vue";
import Card from "./ui/Card.vue";
import Tag from "./ui/Tag.vue";
import { SAMPLE_ITEMS } from "../data/sampleWishlist";
import { toneAt } from "../utils/tones";

const { t } = useI18n();
</script>
