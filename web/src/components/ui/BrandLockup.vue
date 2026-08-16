<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { BRAND_MARK } from "./brandMark";

const { t } = useI18n();
</script>

<template>
  <span
    class="inline-flex items-center gap-2 font-heading text-wordmark text-ink"
    data-test="brand-lockup"
  >
    <svg
      width="22"
      height="22"
      :viewBox="BRAND_MARK.viewBox"
      fill="currentColor"
      aria-hidden="true"
      class="block shrink-0 text-accent-700"
    >
      <path :d="BRAND_MARK.tag" />
      <circle
        :cx="BRAND_MARK.hole.cx"
        :cy="BRAND_MARK.hole.cy"
        :r="BRAND_MARK.hole.r"
        class="fill-bg"
      />
    </svg>
    <span>{{ t("nav.wishlist") }}</span>
  </span>
</template>
