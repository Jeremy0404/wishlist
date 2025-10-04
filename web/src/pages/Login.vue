<template>
  <h1>Login</h1>
  <form @submit.prevent="submit" style="display:grid; gap:.5rem; max-width: 420px;">
    <input v-model="email" type="email" placeholder="email" required />
    <input v-model="password" type="password" placeholder="password" required />
    <button :disabled="auth.loading">Login</button>
    <p v-if="error" style="color:#b00">{{ error }}</p>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuth } from '../stores/auth';
import { useRouter } from 'vue-router';

const auth = useAuth();
const router = useRouter();
const email = ref('');
const password = ref('');
const error = ref('');

async function submit() {
  error.value = '';
  try {
    await auth.login(email.value, password.value);
    router.push('/family/new');
  } catch (e: any) {
    error.value = e.message ?? 'Login failed';
  }
}
</script>
