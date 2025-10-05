<template>
  <div v-if="auth.inFamily" class="flex items-center gap-2 text-sm">
    <span class="px-2 py-1 rounded bg-zinc-100">
      👨‍👩‍👧 {{ auth.myFamily?.name }}
    </span>
    <span class="hidden sm:inline text-zinc-600">
      {{ t("family.code") }} :
      <code class="bg-zinc-100 px-1 rounded">{{ auth.inviteCode }}</code>
    </span>
    <Button variant="ghost" @click="copy">{{ t("common.copy") }}</Button>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import Button from "./ui/Button.vue";
import { useToasts } from "./ui/useToasts";
import { useAuth } from "../stores/auth";

const { t } = useI18n();
const auth = useAuth();
const { push } = useToasts();

async function copy() {
  if (!auth.inviteCode) return;
  await navigator.clipboard.writeText(auth.inviteCode);
  push(t("family.copied"), "success");
}
</script>
