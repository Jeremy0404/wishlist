<script setup lang="ts">
const props = defineProps<{
  emoji: string;
  title: string;
  description: string;
}>();
</script>

<template>
  <div class="p-5 bg-white rounded-xl border border-zinc-200 shadow-soft">
    <div class="text-2xl">{{ props.emoji }}</div>
    <h3 class="mt-2 font-semibold">{{ props.title }}</h3>
    <p class="text-sm text-zinc-600 mt-1">{{ props.description }}</p>
  </div>
</template>
