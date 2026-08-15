<script setup lang="ts">
withDefaults(
  defineProps<{ variant?: "accent" | "accent-2" | "neutral" | "outline" }>(),
  { variant: "neutral" },
);
</script>

<template>
  <span
    :class="[
      'inline-flex items-center gap-1 rounded-pill px-3 py-0.5 text-meta tracking-wide',
      variant === 'accent' && 'bg-accent-100 text-accent-800',
      variant === 'accent-2' && 'bg-accent-2-100 text-accent-2-800',
      variant === 'neutral' && 'bg-neutral-100 text-neutral-800',
      variant === 'outline' && 'border border-accent text-accent',
    ]"
  >
    <slot />
  </span>
</template>
