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
      <div v-if="auth.myFamily" class="flex gap-2 mt-2">
        <Button variant="ghost" @click="copy">{{ t("common.copy") }}</Button>
        <InviteShareButton
          v-if="canShare"
          :name="auth.myFamily.name"
          :code="auth.myFamily.invite_code"
        />
        <Button :disabled="rotating" variant="primary" @click="rotate">
          {{ rotating ? t("common.loading") : t("familyInvite.rotate") }}
        </Button>
      </div>
      <p v-if="copied" class="text-green-700 text-sm mt-2">
        {{ t("familyInvite.copied") }}
      </p>
    </Card>

    <Card class="mt-4">
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-lg font-semibold">
          {{ t("familyInvite.membersTitle") }}
        </h2>
        <Button variant="ghost" :disabled="loadingMembers" @click="fetchMembers">
          {{ loadingMembers ? t("common.loading") : t("familyInvite.refresh") }}
        </Button>
      </div>
      <p v-if="loadingMembers" class="text-zinc-600 text-sm">
        {{ t("familyInvite.loadingMembers") }}
      </p>
      <ul v-else class="space-y-2">
        <li
          v-for="member in members"
          :key="member.id"
          class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1"
        >
          <div>
            <p class="font-medium">{{ member.name }}</p>
            <p class="text-sm text-zinc-600">
              {{ t("familyInvite.roleLabel", { role: member.role }) }}
            </p>
          </div>
          <p class="text-sm text-zinc-600">
            {{ t("familyInvite.joinedAt", { date: formatDate(member.joined_at) }) }}
          </p>
        </li>
      </ul>
      <p v-if="!loadingMembers && members.length === 0" class="text-zinc-600 text-sm">
        {{ t("familyInvite.noMembers") }}
      </p>
    </Card>
  </div>

  <p v-else class="text-zinc-600">{{ t("familyInvite.noFamily") }}</p>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import Button from "../components/ui/Button.vue";
import Card from "../components/ui/Card.vue";
import { useAuth } from "../stores/auth";
import InviteShareButton from "../components/InviteShareButton.vue";
import api from "../services/api";
import type { FamilyMember } from "../types";
import { useToasts } from "../components/ui/useToasts";

const { t } = useI18n();
const { push } = useToasts();
const auth = useAuth();
const copied = ref(false);
const members = ref<FamilyMember[]>([]);
const loadingMembers = ref(false);
const rotating = ref(false);
const canShare = computed(
  () => typeof navigator !== "undefined" && !!(navigator as any).share,
);

async function copy() {
  if (!auth.inviteCode) return;
  await navigator.clipboard.writeText(auth.inviteCode);
  copied.value = true;
  setTimeout(() => (copied.value = false), 1500);
}

function formatDate(value: string) {
  const d = new Date(value);
  return d.toLocaleDateString();
}

async function fetchMembers() {
  if (!auth.inFamily) return;
  loadingMembers.value = true;
  try {
    members.value = await api.getFamilyMembers();
  } catch (err) {
    console.error(err);
    push(t("familyInvite.membersError"), "error");
  } finally {
    loadingMembers.value = false;
  }
}

async function rotate() {
  if (!auth.inFamily || rotating.value) return;

  const ok = window.confirm(t("familyInvite.rotateConfirm"));
  if (!ok) return;

  rotating.value = true;
  try {
    await auth.rotateFamilyInvite();
    push(t("familyInvite.codeRotated"), "success");
  } catch (err) {
    console.error(err);
    push(t("familyInvite.rotateError"), "error");
  } finally {
    rotating.value = false;
  }
}

watch(
  () => auth.myFamily?.id,
  () => {
    if (auth.inFamily) fetchMembers();
  },
  { immediate: true },
);
</script>
