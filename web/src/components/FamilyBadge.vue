<template>
  <div v-if="auth.inFamily" class="flex items-center gap-2 text-sm">
    <span class="px-2 py-1 rounded bg-zinc-100">
      👨‍👩‍👧 {{ auth.myFamily?.name }}
    </span>
    <span class="hidden sm:inline text-zinc-600">
      {{ t("family.code") }} :
      <code class="bg-zinc-100 px-1 rounded">{{ auth.inviteCode }}</code>
    </span>
    <Button variant="ghost" @click="copy">{{ t("family.code") }}</Button>
    <Button v-if="canShare" variant="ghost" @click="share">Partager…</Button>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import Button from "./ui/Button.vue";
import { useToasts } from "./ui/useToasts";
import { useAuth } from "../stores/auth";

const { t } = useI18n();
const auth = useAuth();
const { push } = useToasts();
const canShare = computed(
  () => typeof navigator !== "undefined" && !!(navigator as any).share,
);
async function copy() {
  if (!auth.inviteCode) return;
  await navigator.clipboard.writeText(auth.inviteCode);
  push(t("family.copied"), "success");
}
async function share() {
  const fam = auth.myFamily;
  if (!fam?.invite_code) return;
  try {
    await (navigator as any).share({
      title: t("family.shareTitle"),
      text: t("family.shareText", { name: fam.name, code: fam.invite_code }),
    });
  } catch {}
}
</script>
