<template>
  <h1>Invite to your family</h1>
  <div v-if="auth.inFamily" class="card">
    <p><strong>{{ auth.myFamily?.name }}</strong></p>
    <p>Invite code:</p>
    <p class="code"><code>{{ auth.inviteCode }}</code></p>
    <div class="actions">
      <button @click="copy">Copy</button>
      <button v-if="canShare" @click="share">Share…</button>
    </div>
    <p v-if="copied" class="ok">Copied!</p>
    <p v-if="err" class="err">{{ err }}</p>
  </div>
  <p v-else>Join or create a family first.</p>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useAuth } from '../stores/auth';
const auth = useAuth();
const copied = ref(false);
const err = ref('');
const canShare = computed(() => !!(navigator as any).share);

async function copy() {
  const code = auth.inviteCode;
  if (!code) return;
  try {
    await navigator.clipboard.writeText(code);
    copied.value = true;
    setTimeout(() => (copied.value = false), 1500);
  } catch { err.value = 'Copy failed'; }
}

async function share() {
  const fam = auth.myFamily;
  if (!fam?.invite_code) return;
  try {
    await (navigator as any).share({ title: 'Join my family', text: `Family: ${fam.name}\nInvite code: ${fam.invite_code}` });
  } catch {}
}
</script>

<style scoped>
.card { border:1px solid #eee; border-radius:10px; padding:1rem; max-width:480px; }
.code { font-size:1.2rem; background:#f6f6f6; padding:.25rem .5rem; border-radius:6px; display:inline-block; }
.actions { display:flex; gap:.5rem; margin-top:.5rem; }
.ok { color:#0a0; }
.err { color:#b00; }
</style>
