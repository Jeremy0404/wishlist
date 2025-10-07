<template>
  <h1 class="text-xl font-semibold mb-4">{{ t("familyJoin.title") }}</h1>

  <Card class="max-w-xl">
    <form @submit.prevent="submit" class="grid gap-3">
      <Input v-model="code" :label="t('familyJoin.codeLabel')" required />
      <div>
        <Button variant="primary">{{ t("familyJoin.joinBtn") }}</Button>
      </div>
    </form>

    <p
      v-if="msg"
      :class="['mt-3 text-sm', ok ? 'text-green-700' : 'text-red-700']"
    >
      {{ msg }}
    </p>
  </Card>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import api from "../services/api";
import { useAuth } from "../stores/auth";
import Button from "../components/ui/Button.vue";
import Input from "../components/ui/Input.vue";
import Card from "../components/ui/Card.vue";

const { t } = useI18n();
const auth = useAuth();
const route = useRoute();

const code = ref("");
const msg = ref("");
const ok = ref(false);

onMounted(() => {
  const q = route.query.code;
  if (typeof q === "string" && q.trim()) {
    code.value = q.trim();
  }
});

async function submit() {
  msg.value = "";
  try {
    const r = await api.joinFamily(code.value);
    ok.value = true;
    msg.value = t("familyJoin.joined", { name: r.name });
    await auth.refreshFamilies();
  } catch (e: any) {
    ok.value = false;
    msg.value = `${t("familyJoin.error")}: ${e.message}`;
  }
}
</script>
