<script setup lang="ts">
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import Button from "../ui/Button.vue";
import Input from "../ui/Input.vue";
import InlineConfirm from "../ui/InlineConfirm.vue";
import Sheet from "../ui/Sheet.vue";
import { useToasts } from "../ui/useToasts";
import { api } from "../../services/api";
import { errorMessage } from "../../utils/errors";

const props = defineProps<{
  open: boolean;
  family: { id: string; name: string } | null;
}>();
const emit = defineEmits<{ close: []; renamed: [name: string] }>();

const { t } = useI18n();
const { push } = useToasts();

const name = ref("");
const saving = ref(false);
const confirmingRotation = ref(false);
const rotating = ref(false);

watch(
  () => props.open,
  (open) => {
    if (!open) return;
    name.value = props.family?.name ?? "";
    confirmingRotation.value = false;
  },
);

async function rename() {
  if (!props.family) return;
  saving.value = true;
  try {
    const family = await api.adminRenameFamily(props.family.id, name.value.trim());
    push(t("admin.familySheet.renamed"), "success");
    emit("renamed", family.name);
  } catch (e) {
    push(errorMessage(e, t("toast.error")), "error");
  } finally {
    saving.value = false;
  }
}

async function rotate() {
  if (!props.family) return;
  rotating.value = true;
  try {
    await api.adminRotateInvite(props.family.id);
    push(t("admin.familySheet.rotated"), "success");
    confirmingRotation.value = false;
  } catch (e) {
    push(errorMessage(e, t("toast.error")), "error");
  } finally {
    rotating.value = false;
  }
}
</script>

<template>
  <Sheet :open="open" :title="t('admin.familySheet.open')" @close="emit('close')">
    <form class="grid gap-4" data-test="admin-family-form" @submit.prevent="rename">
      <Input
        v-model="name"
        name="family-name"
        :label="t('admin.familySheet.nameLabel')"
        required
      />
      <Button
        variant="primary"
        type="submit"
        block
        :loading="saving"
        data-test="admin-family-save"
      >
        {{ t("admin.save") }}
      </Button>
    </form>

    <InlineConfirm
      v-if="confirmingRotation"
      :question="t('admin.familySheet.rotateConfirm')"
      :confirm-label="t('admin.familySheet.rotateYes')"
      :loading="rotating"
      @confirm="rotate"
      @cancel="confirmingRotation = false"
    />
    <Button
      v-else
      variant="secondary"
      block
      data-test="admin-family-rotate"
      @click="confirmingRotation = true"
    >
      {{ t("admin.familySheet.rotate") }}
    </Button>
  </Sheet>
</template>
