<template>
  <div v-if="auth.inFamily" class="flex items-center gap-2 text-sm">
    <span class="px-2 py-1 rounded bg-zinc-100">
      👨‍👩‍👧 {{ auth.myFamily?.name }}
    </span>
    <span class="hidden sm:inline text-zinc-600">
      Code: <code class="bg-zinc-100 px-1 rounded">{{ auth.inviteCode }}</code>
    </span>
    <Button variant="ghost" @click="copy">Copy</Button>
    <Button v-if="canShare" variant="ghost" @click="share">Share…</Button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import Button from './ui/Button.vue';
import { useToasts } from './ui/useToasts';
import { useAuth } from '../stores/auth';

const auth = useAuth();
const { push } = useToasts();
const canShare = computed(() => typeof navigator !== 'undefined' && !!(navigator as any).share);

async function copy(){
  if (!auth.inviteCode) return;
  await navigator.clipboard.writeText(auth.inviteCode);
  push('Invite code copied','success');
}
async function share(){
  const fam = auth.myFamily;
  if (!fam?.invite_code) return;
  try {
    await (navigator as any).share({
      title: 'Join my family on Wishlist',
      text: `Family: ${fam.name}\nInvite code: ${fam.invite_code}`
    });
  } catch {}
}
</script>
