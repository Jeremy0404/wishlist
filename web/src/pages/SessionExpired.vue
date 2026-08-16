<script setup lang="ts">
import { useI18n } from "vue-i18n";
import PageMessage from "../components/ui/PageMessage.vue";

const { t } = useI18n();
</script>

<template>
  <PageMessage
    icon="alertCircle"
    :title="t('sessionExpired.title')"
    :body="t('sessionExpired.body')"
    :action-label="t('sessionExpired.action')"
    action-to="/"
    data-test="session-expired"
  />
</template>
