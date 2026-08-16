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
  <div class="fixed bottom-4 right-4 z-50">
    <TransitionGroup name="toast" tag="div" class="flex flex-col gap-2">
      <div
        v-for="toast in visible"
        :key="toast.id"
        data-test="toast"
        :data-kind="toast.kind || 'info'"
        class="flex min-w-56 max-w-sm items-start gap-3 rounded-pill px-4 py-2 text-control text-on-fill shadow-md"
        :class="{
          'bg-accent-2-600': toast.kind === 'success',
          'bg-danger': toast.kind === 'error',
          'bg-neutral-800': !toast.kind || toast.kind === 'info',
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
          data-test="toast-dismiss"
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
.toast-enter-active,
.toast-leave-active {
  transition:
    opacity 150ms ease-out,
    transform 150ms ease-out;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

@media (prefers-reduced-motion: reduce) {
  .toast-enter-active,
  .toast-leave-active {
    transition: none;
  }
  .toast-enter-from,
  .toast-leave-to {
    transform: none;
  }
}
</style>
