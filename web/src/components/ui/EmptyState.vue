<script setup lang="ts">
import Card from "./Card.vue";
import Icon from "./Icon.vue";
import type { IconName } from "./icons";

defineProps<{ icon: IconName; message: string }>();
</script>

<template>
  <Card class="items-center p-6 text-center" data-test="empty-state">
    <Icon :name="icon" :size="26" class="my-1 text-neutral-500" />
    <p class="mb-0 text-caption opacity-80">{{ message }}</p>
    <div v-if="$slots.action" class="mt-1">
      <slot name="action" />
    </div>
  </Card>
</template>
