<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useAuth } from "../stores/auth.ts";
import api from "../services/api.ts";
import Button from "../components/ui/Button.vue";
import Card from "../components/ui/Card.vue";
import Input from "../components/ui/Input.vue";
import FamilyOptIn from "../components/FamilyOptIn.vue";
import { useToasts } from "../components/ui/useToasts";
import { errorMessage } from "../utils/errors";

const HOME_AFTER_JOIN = "/me";

const { t } = useI18n();
const { push } = useToasts();
const route = useRoute();
const router = useRouter();
const auth = useAuth();

const code = ref("");
const error = ref("");
const submitting = ref(false);

onMounted(() => {
  const q = route.query.code;
  if (typeof q === "string" && q.trim()) {
    code.value = q.trim();
    void submit();
  }
});

async function submit() {
  error.value = "";
  submitting.value = true;
  try {
    const family = await api.joinFamily(code.value);
    await auth.refreshFamilies();
    push(t("familyJoin.joined", { name: family.name ?? "" }), "success");
    await router.replace(HOME_AFTER_JOIN);
  } catch (e) {
    error.value = errorMessage(e, t("familyJoin.error"));
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
          class="font-mono uppercase tracking-wider"
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
    </Card>
  </FamilyOptIn>
</template>
