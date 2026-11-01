<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import AccountSheet from "./AccountSheet.vue";
import Avatar from "./ui/Avatar.vue";
import { useAuth } from "../stores/auth";

const { t } = useI18n();
const auth = useAuth();
const open = ref(false);
</script>

<template>
  <div class="contents">
    <button
      type="button"
      class="flex-none rounded-full transition-transform active:scale-95"
      data-test="account-open"
      :aria-label="t('account.open')"
      @click="open = true"
    >
      <Avatar :name="auth.user?.name ?? ''" aria-hidden="true" />
    </button>
    <AccountSheet :open="open" @close="open = false" />
  </div>
</template>
