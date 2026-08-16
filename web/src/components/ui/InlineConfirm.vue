<script setup lang="ts">
import { useI18n } from "vue-i18n";
import Button from "./Button.vue";

defineProps<{
  question: string;
  confirmLabel: string;
  loading?: boolean;
}>();

const emit = defineEmits<{
  confirm: [];
  cancel: [];
}>();

const { t } = useI18n();
</script>

<template>
  <div class="flex flex-wrap items-center gap-2" data-test="inline-confirm">
    <span class="text-meta text-muted">{{ question }}</span>
    <Button
      variant="ghost"
      data-test="inline-confirm-cancel"
      @click="emit('cancel')"
    >
      {{ t("common.cancel") }}
    </Button>
    <Button
      variant="danger"
      class="whitespace-nowrap"
      data-test="inline-confirm-accept"
      :loading="loading"
      @click="emit('confirm')"
    >
      <slot name="icon" />
      {{ confirmLabel }}
    </Button>
  </div>
</template>
