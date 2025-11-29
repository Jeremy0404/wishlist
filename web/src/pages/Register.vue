<template>
  <div class="max-w-md mx-auto">
    <h1 class="text-2xl font-semibold mb-4">{{ t("auth.register") }}</h1>

    <Card>
      <form class="grid gap-3" @submit.prevent="submit" autocomplete="on">
        <Input
          type="text"
          v-model="name"
          name="name"
          autocomplete="name"
          :label="t('auth.name')"
          required
        />
        <Input
          v-model="email"
          type="email"
          name="email"
          autocomplete="email"
          :label="t('auth.email')"
          required
        />
        <Input
          v-model="password"
          type="password"
          name="new-password"
          autocomplete="new-password"
          :label="t('auth.password')"
          required
        />
        <div class="mt-2 flex items-center gap-2">
          <Button variant="primary" :loading="submitting" type="submit">
            {{ t("auth.create") }}
          </Button>
          <RouterLink
            :to="loginLink"
            class="inline-flex items-center justify-center gap-1 rounded-lg px-4 py-2 text-sm font-medium transition border border-zinc-300 bg-white hover:bg-zinc-100"
          >
            {{ t("auth.login") }}
          </RouterLink>
        </div>
      </form>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import Card from "../components/ui/Card.vue";
import Input from "../components/ui/Input.vue";
import Button from "../components/ui/Button.vue";
import { useToasts } from "../components/ui/useToasts";
import { useAuth } from "../stores/auth";

const { t } = useI18n();
const { push } = useToasts();
const auth = useAuth();
const route = useRoute();
const router = useRouter();
const redirect = computed(() => {
  const r = route.query.redirect;
  return typeof r === "string" && r ? r : "/me";
});

const loginLink = computed(() => {
  const r = route.query.redirect;
  if (typeof r === "string" && r) {
    return { path: "/auth/login", query: { redirect: r } };
  }
  return { path: "/auth/login" };
});

const name = ref("");
const email = ref("");
const password = ref("");
const submitting = ref(false);

async function submit() {
  if (submitting.value) return;
  submitting.value = true;
  try {
    await auth.register(name.value.trim(), email.value.trim(), password.value);
    push(t("auth.registerSuccess"), "success");
    await router.replace(redirect.value);
  } catch (e: any) {
    push(e?.message, "error");
  } finally {
    submitting.value = false;
  }
}
</script>
