<template>
  <button
      :disabled="disabled || loading"
      :class="[
      'inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium shadow-soft transition',
      variant === 'primary' ? 'bg-brand text-white hover:bg-brand-700' : 'bg-transparent hover:bg-zinc-100',
      (disabled || loading) && 'opacity-60 cursor-not-allowed'
    ]"
  >
    <Spinner v-if="loading" class="mr-2" />
    <slot />
  </button>
</template>
<script setup lang="ts">
import Spinner from './Spinner.vue';
defineProps<{ variant?: 'primary' | 'ghost'; disabled?: boolean; loading?: boolean }>();
</script>
