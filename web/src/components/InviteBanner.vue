<script setup lang="ts">
import { useI18n } from "vue-i18n";
import Button from "./ui/Button.vue";

const props = defineProps<{
  familyName: string;
  inviteCode: string;
  copied: boolean;
  canShare: boolean;
}>();

const emit = defineEmits<{
  (e: "copy"): void;
  (e: "share"): void;
}>();

const { t } = useI18n();
</script>

<template>
  <div class="rounded-xl border border-neutral-300 p-4 bg-surface shadow-sm">
    <p class="mb-1">
      {{ t("landing.youAreIn", { fam: props.familyName }) }}
    </p>
    <div class="flex flex-wrap items-center gap-2 mt-1">
      <span class="text-sm">{{ t("landing.yourInviteCode") }} :</span>
      <code class="bg-neutral-200 px-2 py-0.5 rounded">{{ props.inviteCode }}</code>
      <Button variant="ghost" @click="emit('copy')">{{ t("common.copy") }}</Button>
      <Button v-if="props.canShare" @click="emit('share')">{{ t("common.share") }}</Button>
      <span v-if="props.copied" class="text-accent-2-700 text-sm">
        ✔ {{ t("landing.copied") }}
      </span>
    </div>
  </div>
</template>
