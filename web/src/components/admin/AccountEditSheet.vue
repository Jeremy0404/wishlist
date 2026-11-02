<script setup lang="ts">
import { reactive, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import Button from "../ui/Button.vue";
import Input from "../ui/Input.vue";
import Sheet from "../ui/Sheet.vue";
import { useToasts } from "../ui/useToasts";
import { api } from "../../services/api";
import type { AdminProfile } from "../../types.ts";
import { TAKEN_MESSAGE_KEY, takenField, type IdentifierField } from "./takenField";

const props = defineProps<{ open: boolean; user: AdminProfile }>();
const emit = defineEmits<{ close: []; saved: [user: AdminProfile] }>();

const { t } = useI18n();
const { push } = useToasts();

const form = reactive({ name: "", email: "", username: "" });
const errors = reactive<Record<IdentifierField, string>>({ email: "", username: "" });
const saving = ref(false);

watch(
  () => props.open,
  (open) => {
    if (!open) return;
    Object.assign(form, {
      name: props.user.name,
      email: props.user.email ?? "",
      username: props.user.username ?? "",
    });
    Object.assign(errors, { email: "", username: "" });
  },
);

async function submit() {
  Object.assign(errors, { email: "", username: "" });
  if (!form.email.trim() && !form.username.trim()) {
    errors.username = t("admin.identifierRequired");
    return;
  }
  saving.value = true;
  try {
    const user = await api.adminUpdateUser(props.user.id, {
      name: form.name.trim(),
      email: form.email.trim(),
      username: form.username.trim(),
    });
    push(t("admin.saved"), "success");
    emit("saved", user);
  } catch (e: any) {
    const field = takenField(e);
    if (field) errors[field] = t(TAKEN_MESSAGE_KEY[field]);
    else push(e?.message || t("toast.error"), "error");
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <Sheet :open="open" :title="t('admin.edit')" @close="emit('close')">
    <form class="grid gap-4" data-test="admin-edit-form" @submit.prevent="submit">
      <Input
        v-model="form.name"
        name="name"
        :label="t('admin.nameLabel')"
        required
      />
      <Input
        v-model="form.email"
        name="email"
        type="email"
        autocapitalize="none"
        :label="t('admin.emailLabel')"
        :error="errors.email"
      />
      <Input
        v-model="form.username"
        name="username"
        autocapitalize="none"
        :label="t('admin.usernameLabel')"
        :help="t('admin.identifierHelp')"
        :error="errors.username"
      />
      <Button
        variant="primary"
        type="submit"
        block
        :loading="saving"
        data-test="admin-edit-submit"
      >
        {{ t("admin.save") }}
      </Button>
    </form>
  </Sheet>
</template>
