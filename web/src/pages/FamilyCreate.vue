<template>
  <h1>Create your family</h1>
  <form @submit.prevent="submit" style="display:grid; gap:.5rem; max-width:420px;">
    <input v-model="name" placeholder="Family name" required />
    <button>Create</button>
  </form>

  <div v-if="family" style="margin-top:1rem; padding:.75rem; border:1px solid #eee; border-radius:8px;">
    <p>Family <strong>{{ family.name }}</strong> created.</p>
    <p>Invite code: <code>{{ family.invite_code }}</code></p>
    <RouterLink to="/me">Go to my wishlist</RouterLink>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { api } from '../services/api';
import { useAuth } from '../stores/auth';
import { RouterLink } from 'vue-router';

const name = ref('Ma Famille');
const family = ref<{ id:string; name:string; invite_code:string } | null>(null);
const auth = useAuth();

async function submit() {
  family.value = await api.createFamily(name.value);
  await auth.refreshFamilies();
}
</script>
