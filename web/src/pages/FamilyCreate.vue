<template>
  <h1 class="text-xl font-semibold mb-4">{{ t("familyCreate.title") }}</h1>

  <Card class="max-w-xl">
    <form @submit.prevent="submit" class="grid gap-3">
      <Input v-model="name" :label="t('familyCreate.nameLabel')" required />
      <div>
        <Button variant="primary">{{ t("familyCreate.createBtn") }}</Button>
      </div>
    </form>
  </Card>

  <Card v-if="family" class="max-w-xl mt-4">
    <p class="mb-1">{{ t("familyCreate.created") }}</p>
    <p class="mb-2">
      {{ t("family.badge") }} : <strong>{{ family.name }}</strong>
    </p>
    <p class="mb-2">
      {{ t("familyCreate.inviteCode") }} :
      <code class="bg-zinc-100 px-2 py-0.5 rounded">{{
        family.invite_code
      }}</code>
    </p>
    <div class="flex gap-2">
      <Button variant="ghost" @click="copy">{{ t("common.copy") }}</Button>
      <Button v-if="canShare" variant="ghost" @click="share">{{
        t("common.share")
      }}</Button>
      <RouterLink
        class="px-3 py-2 rounded bg-zinc-100 hover:bg-zinc-200"
        to="/me"
        >{{ t("familyCreate.goMyList") }}</RouterLink
      >
    </div>
  </Card>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { RouterLink } from "vue-router";
import { api } from "../services/api";
import Card from "../components/ui/Card.vue";
import Input from "../components/ui/Input.vue";
import Button from "../components/ui/Button.vue";
import { useAuth } from "../stores/auth";
import { useToasts } from "../components/ui/useToasts";
import type { Family } from "../types.ts";

const { t } = useI18n();
const auth = useAuth();
const { push } = useToasts();

const name = ref("Ma Famille");
const family = ref<Family | null>(null);
const canShare = computed(
  () => typeof navigator !== "undefined" && !!(navigator as any).share,
);

async function submit() {
  family.value = await api.createFamily(name.value);
  await auth.refreshFamilies();
}

async function copy() {
  if (!family.value?.invite_code) return;
  await navigator.clipboard.writeText(family.value.invite_code);
  push(t("familyInvite.copied"), "success");
}

async function share() {
  if (!family.value) return;
  try {
    await (navigator as any).share({
      title: t("family.shareTitle"),
      text: t("family.shareText", {
        name: family.value.name,
        code: family.value.invite_code,
      }),
    });
  } catch {}
}
</script>
