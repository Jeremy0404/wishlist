<script setup lang="ts">
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import Button from "../components/ui/Button.vue";
import Card from "../components/ui/Card.vue";
import Input from "../components/ui/Input.vue";
import { useToasts } from "../components/ui/useToasts";
import { useAuth } from "../stores/auth";
import { inAppRedirect } from "../utils/redirect.ts";

const { t } = useI18n();
const { push } = useToasts();
const auth = useAuth();
const route = useRoute();
const router = useRouter();

const next = inAppRedirect(route.query.redirect);

const name = ref(auth.user?.name ?? "");
const submitting = ref(false);

async function submit() {
  submitting.value = true;
  try {
    await auth.updateName(name.value);
    await router.replace(next);
  } catch (e: any) {
    push(e?.message || t("toast.error"), "error");
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="mx-auto max-w-[520px]" data-test="welcome-name">
    <h1 class="mb-1 text-h3">{{ t("welcome.title") }}</h1>
    <p class="mb-4 text-caption text-muted">{{ t("welcome.body") }}</p>

    <Card elevation="md" class="p-6">
      <form class="grid gap-3" @submit.prevent="submit">
        <Input
          v-model="name"
          name="name"
          data-test="welcome-name-input"
          :label="t('welcome.nameLabel')"
          :placeholder="t('welcome.namePlaceholder')"
          required
        />
        <Button
          variant="primary"
          block
          type="submit"
          :loading="submitting"
          data-test="welcome-name-submit"
        >
          {{ t("welcome.submit") }}
        </Button>
      </form>
    </Card>

    <div class="mt-3 text-center">
      <Button variant="ghost" :to="next" data-test="welcome-name-skip">
        {{ t("welcome.later") }}
      </Button>
    </div>
  </div>
</template>
