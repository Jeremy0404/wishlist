<template>
  <div class="mx-auto max-w-md">
    <Card>
      <div v-if="expired" class="grid gap-3 text-center" data-test="magic-expired">
        <h1 class="font-heading text-h4 text-ink">
          {{ t("auth.magic.expiredTitle") }}
        </h1>
        <p class="text-meta text-muted">{{ t("auth.magic.expiredHint") }}</p>
        <Button variant="primary" block to="/">
          {{ t("auth.magic.requestNew") }}
        </Button>
      </div>

      <div v-else class="grid justify-items-center gap-3" data-test="magic-signing-in">
        <Spinner />
        <p class="text-meta text-muted">{{ t("auth.magic.signingIn") }}</p>
      </div>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import Button from "../components/ui/Button.vue";
import Card from "../components/ui/Card.vue";
import Spinner from "../components/ui/Spinner.vue";
import { useToasts } from "../components/ui/useToasts";
import { useAuth } from "../stores/auth";

const { t } = useI18n();
const { push } = useToasts();
const auth = useAuth();
const route = useRoute();
const router = useRouter();

const expired = ref(false);

onMounted(async () => {
  const token = route.query.token;
  if (typeof token !== "string" || !token) {
    expired.value = true;
    return;
  }

  try {
    const { created } = await auth.signInWithMagicLink(token);
    push(t("auth.loginSuccess"), "success");
    await router.replace(created ? "/welcome" : "/me");
  } catch {
    expired.value = true;
  }
});
</script>
