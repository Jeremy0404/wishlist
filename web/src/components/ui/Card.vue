<script setup lang="ts">
withDefaults(defineProps<{ elevation?: "sm" | "md" | "lg" | "none" }>(), {
  elevation: "sm",
});
</script>

<template>
  <div
    :class="[
      'flex flex-col gap-2 rounded-card bg-surface p-3',
      elevation === 'sm' && 'shadow-sm',
      elevation === 'md' && 'shadow-md',
      elevation === 'lg' && 'shadow-lg',
    ]"
  >
    <div v-if="$slots.header" class="border-b border-divider pb-2">
      <slot name="header" />
    </div>
    <p v-if="$slots.kicker" class="mb-0 text-kicker uppercase text-accent">
      <slot name="kicker" />
    </p>
    <div v-if="$slots.title" class="font-heading text-card-title">
      <slot name="title" />
    </div>
    <p v-if="$slots.body" class="mb-0 flex-1 text-caption opacity-80">
      <slot name="body" />
    </p>
    <slot />
    <div v-if="$slots.meta" class="flex items-center gap-2 text-meta text-muted">
      <slot name="meta" />
    </div>
  </div>
</template>
