<script setup lang="ts">
import { useI18n } from "vue-i18n";
import Button from "./Button.vue";

withDefaults(
  defineProps<{
    question: string;
    confirmLabel: string;
    cancelLabel?: string;
    confirmVariant?: "danger" | "secondary";
    loading?: boolean;
  }>(),
  { confirmVariant: "danger", cancelLabel: undefined },
);

const emit = defineEmits<{
  confirm: [];
  cancel: [];
}>();

const { t } = useI18n();
</script>

<template>
  <div
    class="flex flex-wrap items-center gap-2 rounded-lg border border-danger-tint bg-danger-on p-4"
    data-test="inline-confirm"
  >
    <p class="mb-1 w-full font-semibold">{{ question }}</p>
    <Button
      :variant="confirmVariant"
      class="min-h-12 flex-1 whitespace-nowrap"
      data-test="inline-confirm-accept"
      :loading="loading"
      @click="emit('confirm')"
    >
      <slot name="icon" />
      {{ confirmLabel }}
    </Button>
    <Button
      variant="secondary"
      class="min-h-12 flex-1 bg-surface"
      data-test="inline-confirm-cancel"
      @click="emit('cancel')"
    >
      {{ cancelLabel ?? t("common.cancel") }}
    </Button>
  </div>
</template>
