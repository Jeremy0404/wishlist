<template>
  <h1 class="text-xl font-semibold mb-4">{{ t("familyInvite.title") }}</h1>

  <div v-if="auth.inFamily" class="max-w-xl">
    <Card>
      <p class="mb-2">
        <strong>{{ t("familyInvite.famLabel") }} :</strong>
        {{ auth.myFamily?.name }}
      </p>
      <p class="mb-2">
        <strong>{{ t("familyInvite.codeLabel") }} :</strong>
        <code class="bg-zinc-100 px-2 py-0.5 rounded">{{
          auth.inviteCode
        }}</code>
      </p>
      <div class="flex gap-2 mt-2">
        <Button variant="ghost" @click="copy">{{
          t("familyInvite.copy")
        }}</Button>
        <Button v-if="canShare" variant="ghost" @click="share">{{
          t("familyInvite.share")
        }}</Button>
      </div>
      <p v-if="copied" class="text-green-700 text-sm mt-2">
        {{ t("familyInvite.copied") }}
      </p>
    </Card>
  </div>

  <p v-else class="text-zinc-600">{{ t("familyInvite.noFamily") }}</p>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import Button from "../components/ui/Button.vue";
import Card from "../components/ui/Card.vue";
import { useAuth } from "../stores/auth";

const { t } = useI18n();
const auth = useAuth();
const copied = ref(false);
const canShare = computed(
  () => typeof navigator !== "undefined" && !!(navigator as any).share,
);

async function copy() {
  if (!auth.inviteCode) return;
  await navigator.clipboard.writeText(auth.inviteCode);
  copied.value = true;
  setTimeout(() => (copied.value = false), 1500);
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
