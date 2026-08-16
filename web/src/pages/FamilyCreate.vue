<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { api } from "../services/api";
import Button from "../components/ui/Button.vue";
import Card from "../components/ui/Card.vue";
import Icon from "../components/ui/Icon.vue";
import Input from "../components/ui/Input.vue";
import FamilyOptIn from "../components/FamilyOptIn.vue";
import InviteShareButton from "../components/InviteShareButton.vue";
import { useAuth } from "../stores/auth";
import { useToasts } from "../components/ui/useToasts";
import type { Family } from "../types.ts";

const COPIED_FEEDBACK_MS = 2000;

const { t } = useI18n();
const auth = useAuth();
const { push } = useToasts();

const name = ref("");
const submitting = ref(false);
const copied = ref(false);
const family = ref<Family | null>(null);
const canShare = computed(
  () => typeof navigator !== "undefined" && "share" in navigator,
);

async function submit() {
  submitting.value = true;
  try {
    family.value = await api.createFamily(name.value);
    await auth.refreshFamilies();
  } catch (e: any) {
    push(e?.message || t("familyCreate.error"), "error");
  } finally {
    submitting.value = false;
  }
}

async function copy() {
  if (!family.value?.invite_code) return;
  await navigator.clipboard.writeText(family.value.invite_code);
  copied.value = true;
  setTimeout(() => (copied.value = false), COPIED_FEEDBACK_MS);
}
</script>

<template>
  <FamilyOptIn
    v-if="!family"
    :title="t('familyCreate.title')"
    :body="t('familyCreate.body')"
    :cross-label="t('familyCreate.haveCode')"
    cross-to="/family/join"
  >
    <Card elevation="md" class="p-6">
      <form class="grid gap-3" @submit.prevent="submit">
        <Input
          v-model="name"
          name="name"
          class="test-family-name-input"
          data-test="family-name-input"
          :label="t('familyCreate.nameLabel')"
          :placeholder="t('familyCreate.namePlaceholder')"
          required
        />
        <Button
          variant="primary"
          block
          type="submit"
          :loading="submitting"
          data-test="family-create-submit"
        >
          {{ t("familyCreate.createBtn") }}
        </Button>
      </form>
    </Card>
  </FamilyOptIn>

  <div v-else class="mx-auto max-w-[520px]" data-test="family-created">
    <h1 class="mb-1 text-h3">{{ t("familyCreate.createdTitle") }}</h1>
    <p class="mb-4 text-caption text-muted">
      {{ t("familyCreate.createdBody", { name: family.name }) }}
    </p>

    <Card elevation="md" class="p-6">
      <p class="mb-0 text-label text-muted">
        {{ t("familyCreate.inviteCode") }}
      </p>
      <div class="flex flex-wrap items-center justify-between gap-2">
        <code class="font-mono text-h3 uppercase tracking-[0.05em]">
          {{ family.invite_code }}
        </code>
        <div class="flex items-center gap-2">
          <Button
            variant="ghost"
            class="whitespace-nowrap"
            data-test="family-code-copy"
            @click="copy"
          >
            <Icon :name="copied ? 'check' : 'copy'" :size="14" />
            {{ copied ? t("common.copied") : t("common.copy") }}
          </Button>
          <InviteShareButton v-if="canShare" />
        </div>
      </div>
    </Card>

    <Button variant="primary" block class="mt-4" to="/family/invite">
      {{ t("familyCreate.goInvite") }}
    </Button>
    <Button variant="ghost" block to="/me">
      {{ t("familyCreate.goMyList") }}
    </Button>
  </div>
</template>
