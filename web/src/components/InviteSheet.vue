<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import Button from "./ui/Button.vue";
import Icon from "./ui/Icon.vue";
import Input from "./ui/Input.vue";
import Sheet from "./ui/Sheet.vue";
import { useToasts } from "./ui/useToasts";
import { useInviteShare } from "../composables/useInviteShare";
import { api } from "../services/api";
import { useAuth } from "../stores/auth";
import { buildJoinUrl } from "../utils/buildJoinUrl";

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ close: [] }>();

const { t } = useI18n();
const { push } = useToasts();
const { shareFamily } = useInviteShare();
const auth = useAuth();

const familyName = ref("");
const creating = ref(false);
const nameError = ref("");

const family = computed(() => auth.myFamily);
const link = computed(() =>
  family.value ? buildJoinUrl(family.value.invite_code) : "",
);

watch(
  () => props.open,
  (open) => {
    if (!open) return;
    familyName.value = t("invite.namePrefill");
    nameError.value = "";
  },
);

async function createFamily() {
  const name = familyName.value.trim();
  if (!name || name === t("invite.namePrefill").trim()) {
    nameError.value = t("invite.nameRequired");
    return;
  }
  creating.value = true;
  try {
    await api.createFamily(name);
    await auth.refreshFamilies();
  } catch (e: any) {
    push(e?.message || t("toast.error"), "error");
  } finally {
    creating.value = false;
  }
}

async function share() {
  if (!family.value) return;
  const res = await shareFamily({
    name: family.value.name,
    code: family.value.invite_code,
  });
  if (res.ok && res.method === "clipboard") push(t("invite.copied"), "success");
}

async function copy() {
  if (!link.value) return;
  await navigator.clipboard.writeText(link.value);
  push(t("invite.copied"), "success");
}
</script>

<template>
  <Sheet :open="open" :title="t('invite.title')" @close="emit('close')">
    <form
      v-if="!family"
      class="grid gap-4"
      novalidate
      data-test="invite-name-step"
      @submit.prevent="createFamily"
    >
      <p class="mb-0">{{ t("invite.nameBody") }}</p>
      <Input
        v-model="familyName"
        name="family-name"
        data-test="family-name-input"
        :label="t('invite.nameLabel')"
        :error="nameError"
        @update:model-value="nameError = ''"
      />
      <Button
        variant="primary"
        type="submit"
        block
        class="min-h-14 text-body"
        data-test="family-name-submit"
        :loading="creating"
      >
        {{ t("invite.nameSubmit") }}
      </Button>
    </form>

    <div v-else class="grid gap-3" data-test="invite-link-step">
      <p class="mb-1">{{ t("invite.body", { name: family.name }) }}</p>
      <p
        class="mb-1 flex items-start gap-2 text-caption text-muted"
        data-test="invite-privacy"
      >
        <Icon name="lock" :size="18" class="mt-0.5 flex-none" />
        {{ t("invite.privacy") }}
      </p>
      <Button
        variant="primary"
        block
        class="min-h-14 text-body"
        data-test="invite-share"
        @click="share"
      >
        <Icon name="share" :size="22" />
        {{ t("invite.send") }}
      </Button>
      <Button
        variant="secondary"
        block
        class="min-h-14 bg-surface text-body"
        data-test="invite-copy"
        @click="copy"
      >
        <Icon name="copy" :size="20" />
        {{ t("invite.copy") }}
      </Button>
      <p
        class="mb-0 break-all text-center text-caption text-muted"
        data-test="invite-link"
      >
        {{ link }}
      </p>
    </div>
  </Sheet>
</template>
