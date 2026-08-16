<script setup lang="ts">
import { nextTick, ref } from "vue";
import { useI18n } from "vue-i18n";
import Button from "./ui/Button.vue";
import Icon from "./ui/Icon.vue";
import Input from "./ui/Input.vue";
import { useToasts } from "./ui/useToasts";
import { useAuth } from "../stores/auth";

const { t } = useI18n();
const { push } = useToasts();
const auth = useAuth();

const editing = ref(false);
const draft = ref("");
const submitting = ref(false);
const field = ref<InstanceType<typeof Input> | null>(null);

async function startEditing() {
  draft.value = auth.user?.name ?? "";
  editing.value = true;
  await nextTick();
  field.value?.focus();
}

async function save() {
  submitting.value = true;
  try {
    await auth.updateName(draft.value);
    editing.value = false;
    push(t("my.name.saved"), "success");
  } catch (e: any) {
    push(e?.message || t("toast.error"), "error");
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <form
    v-if="editing"
    class="mb-4 flex flex-wrap items-end gap-2"
    data-test="display-name-editor"
    @submit.prevent="save"
  >
    <Input
      ref="field"
      v-model="draft"
      name="display-name"
      class="min-w-[220px] flex-1"
      data-test="display-name-input"
      :label="t('my.name.label')"
      required
    />
    <Button
      variant="primary"
      type="submit"
      :loading="submitting"
      data-test="display-name-save"
    >
      {{ t("my.name.save") }}
    </Button>
    <Button
      variant="ghost"
      data-test="display-name-cancel"
      @click="editing = false"
    >
      {{ t("my.name.cancel") }}
    </Button>
  </form>

  <p v-else class="mb-4 text-meta text-muted" data-test="display-name">
    {{ t("my.name.shownAs") }}
    <span class="text-ink" data-test="display-name-value">
      {{ auth.user?.name }}
    </span>
    <Button
      variant="ghost"
      class="align-middle"
      data-test="display-name-edit"
      @click="startEditing"
    >
      <Icon name="pencil" :size="14" />
      {{ t("my.name.edit") }}
    </Button>
  </p>
</template>
