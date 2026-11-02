<script setup lang="ts">
import { useI18n } from "vue-i18n";
import Button from "./Button.vue";

const emit = defineEmits<{ retry: [] }>();
const { t } = useI18n();
</script>

<template>
  <div class="px-2 py-8 text-center" role="alert" data-test="load-error">
    <p class="mb-1 font-semibold">{{ t("load.title") }}</p>
    <p class="mb-4 text-muted">{{ t("load.body") }}</p>
    <Button variant="secondary" data-test="load-retry" @click="emit('retry')">
      {{ t("load.retry") }}
    </Button>
  </div>
</template>
