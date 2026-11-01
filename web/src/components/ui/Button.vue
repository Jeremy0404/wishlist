<script setup lang="ts">
import { computed } from "vue";
import { RouterLink } from "vue-router";
import Spinner from "./Spinner.vue";

const props = withDefaults(
  defineProps<{
    variant?: "primary" | "secondary" | "danger" | "ghost" | "ghost-danger";
    disabled?: boolean;
    loading?: boolean;
    icon?: boolean;
    block?: boolean;
    to?: string;
    type?: "button" | "submit" | "reset";
  }>(),
  { variant: "ghost", type: "button" },
);

const VARIANT_CLASSES = {
  primary: "bg-accent text-on-fill",
  secondary: "border-neutral-400",
  danger: "bg-danger text-danger-on",
  ghost: "text-accent",
  "ghost-danger": "text-ink/70",
};

const VARIANT_FEEDBACK = {
  primary: "hover:bg-accent-700 active:bg-accent-800",
  secondary: "hover:bg-ink/7 active:bg-ink/14",
  danger: "hover:bg-danger-dark active:bg-danger-dark",
  ghost: "hover:bg-accent/10 active:bg-accent/18",
  "ghost-danger":
    "hover:bg-danger-tint hover:text-danger active:bg-danger-tint active:text-danger-dark",
};

const inert = computed(() => props.disabled || props.loading);

const classes = computed(() => [
  "pressable inline-flex items-center justify-center gap-2 rounded-md border border-transparent font-semibold text-control text-ink no-underline",
  props.icon
    ? "h-9 w-9 p-0"
    : props.variant === "ghost"
      ? "px-3 py-2"
      : "px-4 py-2",
  props.block && "w-full",
  VARIANT_CLASSES[props.variant],
  inert.value ? "cursor-not-allowed opacity-45" : VARIANT_FEEDBACK[props.variant],
]);
</script>

<template>
  <RouterLink v-if="to" :to="to" :class="classes">
    <Spinner v-if="loading" />
    <slot />
  </RouterLink>
  <button v-else :type="type" :disabled="disabled || loading" :class="classes">
    <Spinner v-if="loading" />
    <slot />
  </button>
</template>
