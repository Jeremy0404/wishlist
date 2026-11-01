<template>
  <div
    v-if="sentTo"
    role="status"
    class="grid justify-items-center gap-2.5 rounded-lg border border-divider bg-surface px-5 py-6 text-center"
    data-test="magic-sent"
  >
    <span
      aria-hidden="true"
      class="grid h-14 w-14 place-items-center rounded-full bg-tone-green text-tone-green-ink"
    >
      <Icon name="mail" :size="28" />
    </span>
    <h2 class="mb-0 text-h2">{{ t("auth.magic.sentTitle") }}</h2>
    <p class="mb-0">
      {{ t("auth.magic.sentTo", { email: sentTo }) }}
    </p>
    <p class="mb-0 text-caption text-muted">{{ t("auth.magic.sentHint") }}</p>
    <button
      type="button"
      class="min-h-11 text-caption text-muted underline underline-offset-4"
      data-test="magic-change"
      @click="sentTo = ''"
    >
      {{ t("auth.magic.changeAddress") }}
    </button>
  </div>

  <form v-else class="grid gap-4" @submit.prevent="submit">
    <Input
      v-model="email"
      type="email"
      name="email"
      autocomplete="email"
      :label="t('auth.email')"
      :placeholder="t('auth.emailPlaceholder')"
      data-test="magic-email"
      required
    />
    <Button
      variant="primary"
      block
      type="submit"
      class="min-h-14 text-body"
      :loading="submitting"
      :disabled="!email.trim()"
      data-test="magic-send"
    >
      {{ t("auth.magic.send") }}
    </Button>
  </form>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import Button from "../ui/Button.vue";
import Icon from "../ui/Icon.vue";
import Input from "../ui/Input.vue";
import { useToasts } from "../ui/useToasts";
import { useAuth } from "../../stores/auth";

const { t } = useI18n();
const { push } = useToasts();
const auth = useAuth();

const email = ref("");
const sentTo = ref("");
const submitting = ref(false);

async function submit() {
  if (submitting.value) return;
  const address = email.value.trim();
  if (!address) return;

  submitting.value = true;
  try {
    await auth.requestMagicLink(address);
    sentTo.value = address;
  } catch (e: any) {
    push(e?.message, "error");
  } finally {
    submitting.value = false;
  }
}
</script>
