<script setup lang="ts">
import { computed } from "vue";
import { icons, type IconName, type IconShapes } from "./icons";

const props = withDefaults(defineProps<{ name: IconName; size?: number }>(), {
  size: 16,
});

const shapes = computed<IconShapes>(() => icons[props.name]);
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2.75"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    class="block shrink-0"
  >
    <path v-for="d in shapes.paths ?? []" :key="d" :d="d" />
    <circle
      v-for="c in shapes.circles ?? []"
      :key="`c${c.join()}`"
      :cx="c[0]"
      :cy="c[1]"
      :r="c[2]"
    />
    <rect
      v-for="r in shapes.rects ?? []"
      :key="`r${r.join()}`"
      :x="r[0]"
      :y="r[1]"
      :width="r[2]"
      :height="r[3]"
      :rx="r[4]"
    />
    <line
      v-for="l in shapes.lines ?? []"
      :key="`l${l.join()}`"
      :x1="l[0]"
      :y1="l[1]"
      :x2="l[2]"
      :y2="l[3]"
    />
  </svg>
</template>
