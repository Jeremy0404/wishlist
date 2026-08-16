<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import { useAuth } from "../stores/auth.ts";
import api from "../services/api.ts";
import Button from "../components/ui/Button.vue";
import Card from "../components/ui/Card.vue";
import Input from "../components/ui/Input.vue";
import FamilyOptIn from "../components/FamilyOptIn.vue";

const { t } = useI18n();
const route = useRoute();
const auth = useAuth();

const code = ref("");
const error = ref("");
const joined = ref("");
const submitting = ref(false);

onMounted(() => {
  const q = route.query.code;
  if (typeof q === "string" && q.trim()) {
    code.value = q.trim();
  }
});

async function submit() {
  error.value = "";
  joined.value = "";
  submitting.value = true;
  try {
    const family = await api.joinFamily(code.value);
    joined.value = t("familyJoin.joined", { name: family.name ?? "" });
    await auth.refreshFamilies();
  } catch (e: any) {
    error.value = e?.message || t("familyJoin.error");
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <FamilyOptIn
    :title="t('familyJoin.title')"
    :body="t('familyJoin.body')"
    :cross-label="t('familyJoin.noCode')"
    cross-to="/family/create"
  >
    <Card elevation="md" class="p-6">
      <form class="grid gap-3" @submit.prevent="submit">
        <Input
          v-model="code"
          name="code"
          class="font-mono uppercase tracking-[0.05em]"
          data-test="family-code-input"
          :label="t('familyJoin.codeLabel')"
          :placeholder="t('familyJoin.codePlaceholder')"
          :error="error"
          required
        />
        <Button
          variant="primary"
          block
          type="submit"
          :loading="submitting"
          data-test="family-join-submit"
        >
          {{ t("familyJoin.joinBtn") }}
        </Button>
      </form>

      <p
        v-if="joined"
        class="mb-0 text-caption text-accent-2-700"
        data-test="family-join-success"
      >
        {{ joined }}
      </p>
    </Card>
  </FamilyOptIn>
</template>
