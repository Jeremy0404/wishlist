<template>
  <div class="mx-auto grid max-w-2xl gap-6">
    <div class="grid gap-2 text-center">
      <h1 class="font-heading text-h2 text-ink">
        {{ t("sample.pageTitle", { name: SAMPLE_OWNER }) }}
      </h1>
      <p class="text-meta text-muted">{{ t("sample.pageSubtitle") }}</p>
    </div>

    <SampleWishlist />

    <Button variant="primary" block to="/" data-test="sample-start">
      {{ t("sample.start") }}
    </Button>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import SampleWishlist from "../components/SampleWishlist.vue";
import Button from "../components/ui/Button.vue";
import { SAMPLE_OWNER } from "../data/sampleWishlist";

const { t } = useI18n();
</script>
