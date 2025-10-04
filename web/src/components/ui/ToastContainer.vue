<template>
  <div class="fixed right-4 bottom-4 z-50 space-y-2">
    <TransitionGroup name="toast-fade" tag="div">
      <div
        v-for="t in visible"
        :key="t.id"
        class="min-w-[220px] max-w-[360px] px-4 py-2 rounded-lg shadow-[0_2px_8px_rgba(0,0,0,.12)] text-sm text-white flex items-start gap-3"
        :class="{
          'bg-green-600': t.kind === 'success',
          'bg-red-600': t.kind === 'error',
          'bg-zinc-800': !t.kind || t.kind === 'info',
        }"
      >
        <div class="pt-[2px]">
          <span v-if="t.kind === 'success'">✅</span>
          <span v-else-if="t.kind === 'error'">⚠️</span>
          <span v-else>🔔</span>
        </div>
        <div class="flex-1 leading-5 break-words">
          {{ t.text }}
        </div>
        <button
          class="opacity-70 hover:opacity-100 transition"
          title="Dismiss"
          @click="clear(t.id)"
        >
          ✕
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { type Toast, useToasts } from "./useToasts";

const { items, clear } = useToasts();

// Filter in script so there's no v-if on the v-for node (avoids the union-type bug)
const visible = computed<Toast[]>(() =>
  items.value.filter((t) => !!t.text && String(t.text).trim().length > 0),
);
</script>

<style>
.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: all 0.18s ease;
}
.toast-fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.toast-fade-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
