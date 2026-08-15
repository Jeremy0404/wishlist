<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(defineProps<{ name: string; size?: "md" | "lg" }>(), {
  size: "md",
});

const initials = computed(() =>
  props.name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase(),
);
</script>

<template>
  <span
    :class="[
      'inline-flex flex-none items-center justify-center rounded-full bg-accent-2-200 font-heading text-accent-2-800',
      size === 'md' ? 'h-11 w-11 text-body' : 'h-12 w-12 text-h5',
    ]"
    :aria-label="name"
  >
    {{ initials }}
  </span>
</template>
