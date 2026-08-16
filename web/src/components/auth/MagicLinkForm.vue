<template>
  <div v-if="sentTo" class="grid gap-3 text-center" data-test="magic-sent">
    <Icon name="mail" class="mx-auto h-8 w-8 text-accent" />
    <h2 class="font-heading text-h4 text-ink">{{ t("auth.magic.sentTitle") }}</h2>
    <p class="text-meta text-muted">
      {{ t("auth.magic.sentTo", { email: sentTo }) }}
      {{ t("auth.magic.sentHint") }}
    </p>
    <Button variant="secondary" :loading="submitting" @click="submit">
      {{ t("auth.magic.resend") }}
    </Button>
  </div>

  <form v-else class="grid gap-3" @submit.prevent="submit">
    <Input
      v-model="email"
      type="email"
      name="email"
      autocomplete="email"
      :label="t('auth.email')"
      data-test="magic-email"
      required
    />
    <Button
      variant="primary"
      block
      type="submit"
      :loading="submitting"
      :disabled="!email.trim()"
      data-test="magic-send"
    >
      {{ t("auth.magic.send") }}
    </Button>
    <p class="text-meta text-muted">{{ t("auth.magic.fineprint") }}</p>
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
