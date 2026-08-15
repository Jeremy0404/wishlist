<script setup lang="ts">
const props = defineProps<{
  emoji: string;
  title: string;
  description: string;
}>();
</script>

<template>
  <div class="p-5 bg-surface rounded-xl border border-neutral-300 shadow-sm">
    <div class="text-2xl">{{ props.emoji }}</div>
    <h3 class="mt-2 font-semibold">{{ props.title }}</h3>
    <p class="text-sm text-neutral-700 mt-1">{{ props.description }}</p>
  </div>
</template>
