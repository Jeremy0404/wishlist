<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import Button from "./ui/Button.vue";
import Dialog from "./ui/Dialog.vue";
import Icon from "./ui/Icon.vue";
import { useInviteShare } from "../composables/useInviteShare.ts";
import { useToasts } from "./ui/useToasts.ts";
import { useAuth } from "../stores/auth.ts";

defineProps<{ open: boolean }>();
const emit = defineEmits<{ close: [] }>();

const { t } = useI18n();
const { push } = useToasts();
const { shareFamily } = useInviteShare();
const auth = useAuth();

const family = computed(() => auth.myFamily);

async function copy() {
  if (!auth.inviteCode) return;
  await navigator.clipboard.writeText(auth.inviteCode);
  push(t("browse.invite.copied"), "success");
}

async function share() {
  if (!family.value?.invite_code) return;
  const res = await shareFamily({
    name: family.value.name,
    code: family.value.invite_code,
  });
  if (res.ok && res.method === "clipboard") push(t("browse.invite.copied"), "success");
}
</script>

<template>
  <Dialog :open="open" :title="t('browse.invite.title')" @close="emit('close')">
    <template v-if="family">
      <p class="mb-3">{{ t("browse.invite.description") }}</p>
      <p class="mb-0 flex items-center gap-2">
        <span>{{ t("browse.invite.codeLabel") }}</span>
        <code
          class="rounded-pill bg-neutral-200 px-3 py-0.5 font-body tracking-wide"
          data-test="invite-code"
          >{{ auth.inviteCode }}</code
        >
      </p>
    </template>
    <p v-else class="mb-0">{{ t("browse.invite.noFamily") }}</p>

    <template v-if="family" #actions>
      <Button variant="ghost" data-test="invite-copy" @click="copy">
        <Icon name="copy" :size="14" />
        {{ t("common.copy") }}
      </Button>
      <Button variant="primary" data-test="invite-share" @click="share">
        <Icon name="share" :size="14" />
        {{ t("common.share") }}
      </Button>
    </template>
  </Dialog>
</template>
