<script setup lang="ts">
import { reactive, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import Button from "../ui/Button.vue";
import Input from "../ui/Input.vue";
import Sheet from "../ui/Sheet.vue";
import { useToasts } from "../ui/useToasts";
import { api } from "../../services/api";
import { TAKEN_MESSAGE_KEY, takenField, type IdentifierField } from "./takenField";

const props = defineProps<{
  open: boolean;
  families: { id: string; name: string }[];
}>();
const emit = defineEmits<{ close: []; created: [userId: string] }>();

const { t } = useI18n();
const { push } = useToasts();

const kind = ref<IdentifierField>("username");
const form = reactive({ name: "", identifier: "", password: "", familyId: "" });
const identifierError = ref("");
const saving = ref(false);

watch(
  () => props.open,
  (open) => {
    if (!open) return;
    Object.assign(form, {
      name: "",
      identifier: "",
      password: "",
      familyId: props.families[0]?.id ?? "",
    });
    identifierError.value = "";
  },
);

async function submit() {
  saving.value = true;
  identifierError.value = "";
  try {
    const user = await api.adminCreateUser({
      name: form.name.trim(),
      [kind.value]: form.identifier.trim(),
      password: form.password,
      familyId: form.familyId || null,
    });
    push(t("admin.created"), "success");
    emit("created", user.id);
  } catch (e: any) {
    const field = takenField(e);
    if (field) identifierError.value = t(TAKEN_MESSAGE_KEY[field]);
    else push(e?.message || t("toast.error"), "error");
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <Sheet :open="open" :title="t('admin.add')" @close="emit('close')">
    <form class="grid gap-4" data-test="admin-create-form" @submit.prevent="submit">
      <Input
        v-model="form.name"
        name="name"
        :label="t('admin.nameLabel')"
        required
      />

      <div class="flex gap-2" role="group">
        <Button
          v-for="option in ['username', 'email'] as const"
          :key="option"
          :variant="kind === option ? 'primary' : 'secondary'"
          class="flex-1"
          :aria-pressed="kind === option"
          :data-test="`admin-kind-${option}`"
          @click="kind = option"
        >
          {{ option === "email" ? t("admin.withEmail") : t("admin.withUsername") }}
        </Button>
      </div>

      <Input
        v-model="form.identifier"
        :name="kind"
        :type="kind === 'email' ? 'email' : 'text'"
        autocapitalize="none"
        :label="kind === 'email' ? t('admin.emailLabel') : t('admin.usernameLabel')"
        :help="kind === 'username' ? t('admin.usernameHelp') : undefined"
        :error="identifierError"
        required
      />

      <Input
        v-model="form.password"
        name="password"
        type="text"
        autocomplete="off"
        autocapitalize="none"
        minlength="6"
        :label="t('admin.passwordLabel')"
        :help="t('admin.passwordHelp')"
        required
      />

      <div>
        <label class="mb-1 block text-label text-ink/70" for="admin-family">
          {{ t("admin.familyLabel") }}
        </label>
        <select
          id="admin-family"
          v-model="form.familyId"
          name="familyId"
          class="min-h-12 w-full rounded-md border border-neutral-400 bg-surface px-4 py-2 text-body text-ink"
        >
          <option v-for="family in families" :key="family.id" :value="family.id">
            {{ family.name }}
          </option>
          <option value="">{{ t("admin.familyless") }}</option>
        </select>
      </div>

      <Button
        variant="primary"
        type="submit"
        block
        :loading="saving"
        data-test="admin-create-submit"
      >
        {{ t("admin.create") }}
      </Button>
    </form>
  </Sheet>
</template>
