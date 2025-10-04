<template>
  <div class="max-w-md mx-auto">
    <h1 class="text-2xl font-semibold mb-4">{{ t("auth.login") }}</h1>

    <Card>
      <form class="grid gap-3" @submit.prevent="submit">
        <Input
          v-model="email"
          type="email"
          autocomplete="email"
          :label="t('auth.email')"
          required
        />
        <Input
          v-model="password"
          type="password"
          autocomplete="current-password"
          :label="t('auth.password')"
          required
        />

        <div class="mt-2 flex items-center gap-2">
          <Button variant="primary" :loading="submitting" type="submit">
            {{ t("auth.login") }}
          </Button>
          <RouterLink
            to="/auth/register"
            class="inline-flex items-center justify-center gap-1 rounded-lg px-4 py-2 text-sm font-medium transition border border-zinc-300 bg-white hover:bg-zinc-100"
          >
            {{ t("auth.register") }}
          </RouterLink>
        </div>
      </form>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { RouterLink, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import Card from "../components/ui/Card.vue";
import Input from "../components/ui/Input.vue";
import Button from "../components/ui/Button.vue";
import { useToasts } from "../components/ui/useToasts";
import { useAuth } from "../stores/auth";

const { t } = useI18n();
const router = useRouter();
const { push } = useToasts();
const auth = useAuth();

const email = ref("");
const password = ref("");
const submitting = ref(false);

async function submit() {
  if (submitting.value) return;
  submitting.value = true;
  try {
    await auth.login(email.value.trim(), password.value);
    push("Bienvenue 👋", "success");
    router.push("/me");
  } catch (e: any) {
    push(e?.message ?? "Erreur de connexion", "error");
  } finally {
    submitting.value = false;
  }
}
</script>
