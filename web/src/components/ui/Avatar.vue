<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{ name: string; size?: "sm" | "md" | "lg"; tone?: string }>(),
  { size: "md", tone: "bg-tone-green text-tone-green-ink" },
);

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
      'inline-flex flex-none items-center justify-center rounded-full font-semibold',
      tone,
      size === 'sm' && 'h-9 w-9 text-caption',
      size === 'md' && 'h-11 w-11 text-body',
      size === 'lg' && 'h-12 w-12 text-h5',
    ]"
    :aria-label="name"
  >
    {{ initials }}
  </span>
</template>
