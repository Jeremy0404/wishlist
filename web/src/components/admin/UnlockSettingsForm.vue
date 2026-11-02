<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import Button from "../ui/Button.vue";
import Input from "../ui/Input.vue";
import { useToasts } from "../ui/useToasts";
import { api } from "../../services/api";

const MAX_MIN_ITEMS_TO_VIEW = 50;

const { t } = useI18n();
const { push } = useToasts();

const minItemsToView = ref<number | string>(0);
const saving = ref(false);

async function save() {
  saving.value = true;
  try {
    const saved = await api.adminSaveSettings({
      minItemsToView: Number(minItemsToView.value || 0),
    });
    minItemsToView.value = saved.minItemsToView;
    push(t("admin.saved"), "success");
  } catch (e: any) {
    push(e?.message || t("toast.error"), "error");
  } finally {
    saving.value = false;
  }
}

onMounted(async () => {
  ({ minItemsToView: minItemsToView.value } = await api.adminSettings());
});
</script>

<template>
  <section data-test="admin-settings">
    <h2 class="mb-2 text-h4">{{ t("admin.settings.title") }}</h2>
    <form class="grid gap-3" @submit.prevent="save">
      <Input
        v-model="minItemsToView"
        name="min-items-to-view"
        type="number"
        inputmode="numeric"
        min="0"
        :max="MAX_MIN_ITEMS_TO_VIEW"
        step="1"
        :label="t('admin.settings.minItemsLabel')"
        :help="t('admin.settings.minItemsHelp')"
        required
      />
      <Button
        variant="secondary"
        type="submit"
        block
        :loading="saving"
        data-test="admin-settings-save"
      >
        {{ t("admin.save") }}
      </Button>
    </form>
  </section>
</template>
