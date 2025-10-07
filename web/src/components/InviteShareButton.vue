<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import Button from "./ui/Button.vue";
import { useInviteShare } from "../composables/useInviteShare.ts";
import { useAuth } from "../stores/auth.ts";

const { t } = useI18n();
const { shareFamily } = useInviteShare();
const auth = useAuth();

const fam = computed(() => auth.myFamily ?? null);
const toast = ref("");

async function onShare() {
  if (!fam.value?.invite_code) return;
  const res = await shareFamily({
    name: fam.value.name,
    code: fam.value.invite_code,
  });
  if (res.ok && res.method === "clipboard") {
    toast.value = t("common.copied");
    setTimeout(() => (toast.value = ""), 1500);
  }
}
</script>

<template>
  <div class="flex gap-2 items-center">
    <Button :disabled="!fam" @click="onShare">{{ t("common.share") }}</Button>
    <span v-if="!fam" class="text-xs opacity-60">
      {{ t("family.noFamilyShort") }}
    </span>
    <span v-if="toast" class="text-sm opacity-70">{{ toast }}</span>
  </div>
</template>
