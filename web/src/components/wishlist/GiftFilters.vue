<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { GiftFilter } from "../../types.ts";

const filter = defineModel<GiftFilter>("filter", { required: true });
const byPrice = defineModel<boolean>("byPrice", { required: true });

const FILTERS: GiftFilter[] = ["all", "open", "mine"];
const ACTIVE = "border-accent bg-accent-100 text-accent-700";
const IDLE = "border-neutral-400 text-ink hover:bg-neutral-200 active:bg-neutral-300";

const { t } = useI18n();
</script>

<template>
  <div
    class="mb-3 flex flex-wrap gap-2"
    role="group"
    :aria-label="t('view.filters.label')"
    data-test="gift-filters"
  >
    <button
      v-for="option in FILTERS"
      :key="option"
      type="button"
      class="pressable min-h-11 rounded-pill border px-4 text-caption font-semibold"
      :class="filter === option ? ACTIVE : IDLE"
      :aria-pressed="filter === option"
      :data-test="`filter-${option}`"
      @click="filter = option"
    >
      {{ t(`view.filters.${option}`) }}
    </button>
    <button
      type="button"
      class="pressable min-h-11 rounded-pill border px-4 text-caption font-semibold"
      :class="byPrice ? ACTIVE : IDLE"
      :aria-pressed="byPrice"
      data-test="sort-price"
      @click="byPrice = !byPrice"
    >
      {{ t("view.filters.byPrice") }}
    </button>
  </div>
</template>
