<script setup lang="ts">
import { useI18n } from "vue-i18n";
import Button from "./ui/Button.vue";
import Tag from "./ui/Tag.vue";

defineProps<{
  title: string;
  body: string;
  crossLabel: string;
  crossTo: string;
}>();

const { t } = useI18n();
</script>

<template>
  <div class="mx-auto max-w-[520px]" data-test="family-opt-in">
    <Tag variant="neutral">{{ t("family.optional") }}</Tag>
    <h1 class="mb-1 mt-2 text-h3">{{ title }}</h1>
    <p class="mb-4 text-caption text-muted">{{ body }}</p>

    <slot />

    <Button
      variant="ghost"
      block
      class="mt-4"
      :to="crossTo"
      data-test="family-cross-link"
    >
      {{ crossLabel }}
    </Button>
    <Button variant="ghost" block to="/me" data-test="family-maybe-later">
      {{ t("family.maybeLater") }}
    </Button>
  </div>
</template>
