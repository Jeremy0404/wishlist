<script setup lang="ts">
import Button from "./Button.vue";
import Icon from "./Icon.vue";
import type { IconName } from "./icons";

defineProps<{
  icon: IconName;
  title: string;
  body: string;
  actionLabel: string;
  actionTo: string;
}>();
</script>

<template>
  <div
    class="mx-auto max-w-[880px] px-4 py-8 text-center"
    data-test="page-message"
  >
    <Icon :name="icon" :size="36" class="mx-auto mb-3 text-neutral-500" />
    <h1 class="mb-1 text-h3">{{ title }}</h1>
    <p class="mb-4 text-muted">{{ body }}</p>
    <Button variant="primary" :to="actionTo" data-test="page-message-action">
      {{ actionLabel }}
    </Button>
  </div>
</template>
