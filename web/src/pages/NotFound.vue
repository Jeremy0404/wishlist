<script setup lang="ts">
import { useI18n } from "vue-i18n";
import PageMessage from "../components/ui/PageMessage.vue";

const { t } = useI18n();
</script>

<template>
  <PageMessage
    icon="circleSlash"
    :title="t('notFound.title')"
    :body="t('notFound.body')"
    :action-label="t('notFound.action')"
    action-to="/me"
    data-test="not-found"
  />
</template>
