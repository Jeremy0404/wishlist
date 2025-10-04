<template>
  <div v-if="auth.inFamily" class="badge">
    <span class="name">👨‍👩‍👧 {{ auth.myFamily?.name }}</span>
    <span v-if="auth.inviteCode" class="code">Code: <code>{{ auth.inviteCode }}</code></span>
    <button @click="copy" title="Copy invite code">Copy</button>
    <button v-if="canShare" @click="share" title="Share via system">Share…</button>
    <span v-if="copied" class="ok">Copied!</span>
    <span v-if="err" class="err">{{ err }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useAuth } from '../stores/auth';

const auth = useAuth();
const copied = ref(false);
const err = ref('');

const canShare = computed(() => typeof navigator !== 'undefined' && !!(navigator as any).share);

async function copy() {
  err.value = '';
  const code = auth.inviteCode;
  if (!code) return;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(code);
    } else {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = code;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);

    }
    copied.value = true;
    setTimeout(() => (copied.value = false), 1500);
  } catch (err: any) {
    err.value = 'Copy failed';
  }
}

async function share() {
  const fam = auth.myFamily;
  if (!fam?.invite_code) return;
  try {
    await (navigator as any).share({
      title: 'Join my family on Wishlist',
      text: `Family: ${fam.name}\nInvite code: ${fam.invite_code}`,
    });
  } catch {
    // ignore user cancel
  }
}
</script>

<style scoped>
.badge { display:flex; gap:.5rem; align-items:center; font-size: .95rem; }
.name { font-weight: 600; }
.code { background:#f6f6f6; padding:.15rem .4rem; border-radius:6px; }
button { padding:.2rem .5rem; border:1px solid #ddd; border-radius:6px; background:#fff; cursor:pointer; }
button:hover { background:#f3f3f3; }
.ok { color:#0a0; }
.err { color:#b00; }
</style>
