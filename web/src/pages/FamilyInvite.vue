<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import Avatar from "../components/ui/Avatar.vue";
import Button from "../components/ui/Button.vue";
import Card from "../components/ui/Card.vue";
import EmptyState from "../components/ui/EmptyState.vue";
import Icon from "../components/ui/Icon.vue";
import InlineConfirm from "../components/ui/InlineConfirm.vue";
import Input from "../components/ui/Input.vue";
import ListSkeleton from "../components/ui/ListSkeleton.vue";
import InviteShareButton from "../components/InviteShareButton.vue";
import { buildJoinUrl } from "../utils/buildJoinUrl.ts";
import { useAuth } from "../stores/auth";
import { useToasts } from "../components/ui/useToasts";
import api from "../services/api";
import type { FamilyMember } from "../types";

const COPIED_FEEDBACK_MS = 2000;

const { t } = useI18n();
const { push } = useToasts();
const auth = useAuth();

const members = ref<FamilyMember[]>([]);
const loadingMembers = ref(false);
const rotating = ref(false);
const confirmingRotate = ref(false);
const copiedCode = ref(false);
const copiedLink = ref(false);

const joinLink = computed(() =>
  auth.inviteCode ? buildJoinUrl(auth.inviteCode) : "",
);
const canShare = computed(
  () => typeof navigator !== "undefined" && "share" in navigator,
);

async function copy(value: string, mark: (copied: boolean) => void) {
  if (!value) return;
  try {
    await navigator.clipboard.writeText(value);
    mark(true);
    setTimeout(() => mark(false), COPIED_FEEDBACK_MS);
  } catch (e: any) {
    push(e?.message || t("toast.error"), "error");
  }
}

function copyCode() {
  return copy(auth.inviteCode, (copied) => (copiedCode.value = copied));
}

function copyLink() {
  return copy(joinLink.value, (copied) => (copiedLink.value = copied));
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

  confirmingRotate.value = false;
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

<template>
  <div class="mx-auto max-w-[600px]" data-test="family-invite">
    <h1 class="mb-1 text-h3">{{ t("familyInvite.title") }}</h1>
    <p class="mb-4 text-caption text-muted">
      {{ t("familyInvite.body") }}
    </p>

    <template v-if="auth.inFamily">
      <Card elevation="md" class="p-6">
        <p class="mb-0 text-label text-muted">
          {{ t("familyInvite.codeLabel") }}
        </p>
        <div class="flex flex-wrap items-center justify-between gap-2">
          <code
            class="font-mono text-h3 uppercase tracking-[0.05em]"
            data-test="invite-code"
          >
            {{ auth.inviteCode }}
          </code>
          <div class="flex items-center gap-2">
            <Button
              variant="ghost"
              class="whitespace-nowrap"
              data-test="invite-code-copy"
              @click="copyCode"
            >
              <Icon :name="copiedCode ? 'check' : 'copy'" :size="14" />
              {{ copiedCode ? t("common.copied") : t("common.copy") }}
            </Button>
            <InviteShareButton v-if="canShare" />
          </div>
        </div>

        <div class="my-2 border-t border-divider"></div>

        <p class="mb-0 text-label text-muted">
          {{ t("familyInvite.linkLabel") }}
        </p>
        <div class="flex flex-wrap items-center gap-2">
          <div class="min-w-[220px] flex-1">
            <Input :model-value="joinLink" data-test="invite-link" readonly />
          </div>
          <Button
            variant="ghost"
            class="whitespace-nowrap"
            data-test="invite-link-copy"
            @click="copyLink"
          >
            <Icon :name="copiedLink ? 'check' : 'copy'" :size="14" />
            {{ copiedLink ? t("common.copied") : t("common.copy") }}
          </Button>
        </div>

        <div>
          <Button
            v-if="!confirmingRotate"
            variant="ghost"
            :loading="rotating"
            data-test="invite-rotate"
            @click="confirmingRotate = true"
          >
            {{ t("familyInvite.rotate") }}
          </Button>
          <InlineConfirm
            v-else
            :question="t('familyInvite.rotateConfirm')"
            :confirm-label="t('familyInvite.rotateConfirmBtn')"
            confirm-variant="secondary"
            :loading="rotating"
            @confirm="rotate"
            @cancel="confirmingRotate = false"
          />
        </div>
      </Card>

      <Card elevation="md" class="mt-4 p-6">
        <div class="flex items-center justify-between gap-2">
          <h2 class="mb-0 text-h5">{{ t("familyInvite.membersTitle") }}</h2>
          <Button
            variant="ghost"
            :loading="loadingMembers"
            data-test="members-refresh"
            @click="fetchMembers"
          >
            {{ t("familyInvite.refresh") }}
          </Button>
        </div>

        <ListSkeleton v-if="loadingMembers" />
        <p v-else-if="members.length === 0" class="mb-0 text-caption text-muted">
          {{ t("familyInvite.noMembers") }}
        </p>
        <ul v-else class="grid gap-3">
          <li
            v-for="member in members"
            :key="member.id"
            class="flex items-center gap-3"
            data-test="family-member"
          >
            <Avatar :name="member.name" size="sm" />
            <span>{{ member.name }}</span>
          </li>
        </ul>
      </Card>
    </template>

    <EmptyState v-else icon="users" :message="t('familyInvite.noFamily')">
      <template #action>
        <Button variant="secondary" to="/family/create">
          {{ t("familyInvite.noFamilyAction") }}
        </Button>
      </template>
    </EmptyState>
  </div>
</template>
