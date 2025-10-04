<template>
  <nav style="border-bottom: 1px solid #eee; padding: .75rem 1rem; display:flex; gap:1rem; align-items:center;">
    <strong>🎄 Wishlist</strong>
    <div style="flex:1"></div>
    <template v-if="auth.isLogged">
      <RouterLink to="/me">My list</RouterLink>
      <RouterLink to="/wishlists" v-if="auth.inFamily">Others</RouterLink>
      <RouterLink to="/family/new" v-if="!auth.inFamily">New family</RouterLink>
      <RouterLink to="/family/join" v-if="!auth.inFamily">Join</RouterLink>
      <button @click="logout" style="margin-left: 1rem;">Logout</button>
    </template>
    <template v-else>
      <RouterLink to="/auth/login">Login</RouterLink>
      <RouterLink to="/auth/register">Register</RouterLink>
    </template>
  </nav>
</template>

<script setup lang="ts">
import { useAuth } from '../stores/auth';
import { RouterLink, useRouter } from 'vue-router';
const auth = useAuth();
const router = useRouter();
async function logout() {
  await auth.logout();
  router.push('/auth/login');
}
</script>
