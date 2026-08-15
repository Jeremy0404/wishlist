<script setup lang="ts">
import { computed } from "vue";
import { RouterLink } from "vue-router";
import Spinner from "./Spinner.vue";

const props = withDefaults(
  defineProps<{
    variant?: "primary" | "secondary" | "danger" | "ghost";
    disabled?: boolean;
    loading?: boolean;
    icon?: boolean;
    block?: boolean;
    to?: string;
    type?: "button" | "submit" | "reset";
  }>(),
  { variant: "ghost", type: "button" },
);

const classes = computed(() => [
  "inline-flex items-center justify-center gap-2 rounded-pill border border-transparent font-heading text-control text-ink no-underline transition-colors",
  props.icon ? "h-9 w-9 p-0" : props.variant === "ghost" ? "px-1 py-2" : "px-4 py-2",
  props.block && "w-full",
  props.variant === "primary" &&
    "bg-accent text-bg hover:bg-accent-600 active:bg-accent-700",
  props.variant === "secondary" && "border-divider hover:bg-ink/7 active:bg-ink/14",
  props.variant === "danger" &&
    "border-accent-700 text-accent-700 hover:bg-accent-100 active:bg-accent-200",
  props.variant === "ghost" && "text-accent hover:bg-accent/10 active:bg-accent/18",
  (props.disabled || props.loading) && "cursor-not-allowed opacity-45",
]);
</script>

<template>
  <RouterLink v-if="to" :to="to" :class="classes">
    <Spinner v-if="loading" />
    <slot />
  </RouterLink>
  <button
    v-else
    :type="type"
    :disabled="disabled || loading"
    :class="classes"
  >
    <Spinner v-if="loading" />
    <slot />
  </button>
</template>
