<script setup lang="ts">
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import Button from "../ui/Button.vue";
import Input from "../ui/Input.vue";
import Sheet from "../ui/Sheet.vue";
import { useToasts } from "../ui/useToasts";
import { api } from "../../services/api";
import { errorMessage } from "../../utils/errors";

const props = defineProps<{ open: boolean; userId: string }>();
const emit = defineEmits<{ close: [] }>();

const { t } = useI18n();
const { push } = useToasts();

const password = ref("");
const saving = ref(false);

watch(
  () => props.open,
  (open) => {
    if (open) password.value = "";
  },
);

async function submit() {
  saving.value = true;
  try {
    await api.adminSetPassword(props.userId, password.value);
    push(t("admin.passwordSaved"), "success");
    emit("close");
  } catch (e) {
    push(errorMessage(e, t("toast.error")), "error");
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <Sheet :open="open" :title="t('admin.password')" @close="emit('close')">
    <form class="grid gap-4" data-test="admin-password-form" @submit.prevent="submit">
      <Input
        v-model="password"
        name="password"
        type="text"
        autocomplete="off"
        autocapitalize="none"
        minlength="6"
        :label="t('admin.passwordLabel')"
        :help="t('admin.passwordHelp')"
        required
      />
      <Button
        variant="primary"
        type="submit"
        block
        :loading="saving"
        data-test="admin-password-submit"
      >
        {{ t("admin.save") }}
      </Button>
    </form>
  </Sheet>
</template>
