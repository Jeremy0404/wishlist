<template>
  <div class="mx-auto grid max-w-md gap-10 pt-8 md:pt-14">
    <div class="grid gap-4">
      <h1 class="mb-0">{{ withPassword ? t("auth.login") : t("signIn.title") }}</h1>
      <p v-if="!withPassword" class="mb-0 text-lg text-muted">
        {{ t("signIn.subtitle") }}
      </p>
    </div>

    <PasswordForm v-if="withPassword" :redirect="redirect" @done="go" />
    <MagicLinkForm v-else />

    <Button
      variant="ghost"
      class="mx-auto min-h-11 text-caption font-normal text-muted underline underline-offset-4"
      :data-test="withPassword ? 'use-magic-link' : 'use-password'"
      @click="withPassword = !withPassword"
    >
      {{
        withPassword ? t("auth.magic.linkInstead") : t("auth.magic.passwordInstead")
      }}
    </Button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import MagicLinkForm from "../components/auth/MagicLinkForm.vue";
import PasswordForm from "../components/auth/PasswordForm.vue";
import Button from "../components/ui/Button.vue";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();

const withPassword = ref(false);

const redirect = computed(() => {
  const r = route.query.redirect;
  return typeof r === "string" && r ? r : "/me";
});

function go(to: string) {
  router.replace(to);
}
</script>
