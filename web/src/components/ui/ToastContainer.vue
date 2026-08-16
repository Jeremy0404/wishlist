<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { type Toast, useToasts } from "./useToasts";
import Icon from "./Icon.vue";

const { t } = useI18n();
const { items, clear } = useToasts();

// Filter in script so there's no v-if on the v-for node (avoids the union-type bug)
const visible = computed<Toast[]>(() =>
  items.value.filter((t) => !!t.text && String(t.text).trim().length > 0),
);
</script>

<template>
  <div class="fixed bottom-4 right-4 z-50 space-y-2">
    <TransitionGroup name="toast-fade" tag="div">
      <div
        v-for="toast in visible"
        :key="toast.id"
        class="flex min-w-56 max-w-sm items-start gap-3 rounded-pill px-4 py-2 text-control shadow-md"
        :class="{
          'bg-accent-2-700 text-bg': toast.kind === 'success',
          'bg-danger text-danger-on': toast.kind === 'error',
          'bg-neutral-800 text-bg': !toast.kind || toast.kind === 'info',
        }"
      >
        <Icon
          :name="
            toast.kind === 'success'
              ? 'checkCircle'
              : toast.kind === 'error'
                ? 'alertCircle'
                : 'bell'
          "
        />
        <div class="flex-1 break-words">
          {{ toast.text }}
        </div>
        <button
          class="opacity-70 transition-opacity hover:opacity-100"
          :title="t('common.close')"
          @click="clear(toast.id)"
        >
          <Icon name="close" :size="14" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: all 0.18s ease;
}
.toast-fade-enter-from {
  opacity: 0;
  transform: translateY(theme("spacing.2"));
}
.toast-fade-leave-to {
  opacity: 0;
  transform: translateY(theme("spacing.2"));
}
</style>
