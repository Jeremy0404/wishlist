<template>
  <h1>Join a family</h1>
  <form @submit.prevent="submit" style="display:grid; gap:.5rem; max-width:420px;">
    <input v-model="code" placeholder="Invite code" required />
    <button>Join</button>
  </form>
  <p v-if="msg" :style="{color: ok ? '#070' : '#b00'}">{{ msg }}</p>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { api } from '../services/api';
import { useAuth } from '../stores/auth';

const code = ref('');
const msg = ref('');
const ok = ref(false);
const auth = useAuth();

async function submit() {
  msg.value = '';
  try {
    const r = await api.joinFamily(code.value);
    ok.value = true;
    msg.value = `Joined ${r.name}`;
    await auth.refreshFamilies();
  } catch (e: any) {
    ok.value = false;
    msg.value = e.message ?? 'Join failed';
  }
}
</script>
