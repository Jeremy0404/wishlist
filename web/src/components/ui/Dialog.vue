<script setup lang="ts">
import { onBeforeUnmount, watch } from "vue";
import { useI18n } from "vue-i18n";
import Button from "./Button.vue";
import Icon from "./Icon.vue";

const props = defineProps<{ open: boolean; title: string }>();
const emit = defineEmits<{ close: [] }>();

const { t } = useI18n();

function onKeydown(e: KeyboardEvent) {
  if (e.key === "Escape") emit("close");
}

watch(
  () => props.open,
  (open) => {
    if (open) document.addEventListener("keydown", onKeydown);
    else document.removeEventListener("keydown", onKeydown);
  },
  { immediate: true },
);

onBeforeUnmount(() => document.removeEventListener("keydown", onKeydown));
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 grid place-items-center bg-neutral-900/50 p-4"
      @click.self="emit('close')"
    >
      <div
        role="dialog"
        aria-modal="true"
        :aria-label="title"
        class="flex w-[min(440px,100%)] flex-col gap-3 rounded-card bg-surface p-4 shadow-lg"
      >
        <div class="flex items-start justify-between gap-2">
          <h2 class="mb-0 font-heading text-h4">{{ title }}</h2>
          <Button icon variant="ghost" :aria-label="t('common.close')" @click="emit('close')">
            <Icon name="close" :size="16" />
          </Button>
        </div>
        <div class="text-dialog-body opacity-85">
          <slot />
        </div>
        <div v-if="$slots.actions" class="mt-2 flex justify-end gap-2">
          <slot name="actions" />
        </div>
      </div>
    </div>
  </Teleport>
</template>
