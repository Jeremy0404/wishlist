<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import Button from "./ui/Button.vue";
import Icon from "./ui/Icon.vue";
import { useAuth } from "../stores/auth.ts";

const DISMISSED_KEY = "wishlist.inviteNudgeDismissed";

const { t } = useI18n();
const auth = useAuth();

const dismissed = ref(localStorage.getItem(DISMISSED_KEY) === "1");
const visible = computed(() => !auth.inFamily && !dismissed.value);

function dismiss() {
  localStorage.setItem(DISMISSED_KEY, "1");
  dismissed.value = true;
}
</script>

<template>
  <div
    v-if="visible"
    class="mb-6 flex items-center gap-3 rounded-card bg-accent-100 p-3"
    data-test="invite-nudge"
  >
    <Icon name="users" :size="18" class="text-accent-700" />
    <p class="mb-0 flex-1 text-caption">
      {{ t("my.nudge.question") }}
      <strong>{{ t("my.nudge.invite") }}</strong>
      {{ t("my.nudge.reassurance") }}
    </p>
    <Button
      variant="secondary"
      class="whitespace-nowrap"
      data-test="invite-nudge-action"
      to="/family/create"
    >
      {{ t("my.nudge.action") }}
    </Button>
    <Button
      variant="ghost"
      icon
      :aria-label="t('my.nudge.dismiss')"
      data-test="invite-nudge-dismiss"
      @click="dismiss"
    >
      <Icon name="close" :size="12" />
    </Button>
  </div>
</template>
