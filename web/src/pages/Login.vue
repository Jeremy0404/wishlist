<template>
  <h1>{{ t("auth.login") }}</h1>
  <form
    @submit.prevent="submit"
    style="display: grid; gap: 0.5rem; max-width: 420px"
  >
    <input
      v-model="email"
      type="email"
      :placeholder="t('auth.email')"
      required
    />
    <input
      v-model="password"
      type="password"
      :placeholder="t('auth.password')"
      required
    />
    <button :disabled="auth.loading">{{ t("auth.login") }}</button>
    <p v-if="error" style="color: #b00">{{ error }}</p>
  </form>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useAuth } from "../stores/auth";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const auth = useAuth();
const router = useRouter();
const email = ref("");
const password = ref("");
const error = ref("");

async function submit() {
  error.value = "";
  try {
    await auth.login(email.value, password.value);
    await router.push("/family/new");
  } catch (e: any) {
    error.value = e.message ?? "Login failed";
  }
}
</script>
