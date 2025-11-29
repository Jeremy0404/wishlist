<template>
  <Card>
    <div class="grid gap-3 sm:grid-cols-2">
      <Input
        v-model="form.title"
        name="title"
        :label="t('my.form.title')"
        required
      />
      <Input v-model="form.url" name="url" :label="t('my.form.url')" />
      <Input
        v-model.number="form.price_eur"
        name="price_eur"
        type="number"
        step="5"
        min="0"
        :max="1000000"
        :label="t('my.form.price')"
      />

      <Input
        v-model.number="form.priority"
        name="priority"
        type="number"
        :label="t('my.form.priority')"
      />
      <div class="sm:col-span-2">
        <label class="block text-sm mb-1" for="notes">{{ t("my.form.notes") }}</label>
        <textarea
          v-model="form.notes"
          name="notes"
          rows="3"
          class="w-full rounded-lg border-zinc-300 bg-white text-sm focus:ring-brand-500 focus:border-brand-500"
          placeholder="Notes"
        ></textarea>
      </div>
      <div class="sm:col-span-2 flex gap-2">
        <Button
          variant="primary"
          type="button"
          data-test="wishlist-edit-save"
          :loading="loading"
          @click="emitSave"
        >
          {{ t("my.save") }}
        </Button>
        <Button
          variant="ghost"
          type="button"
          data-test="wishlist-edit-cancel"
          @click="emitCancel"
        >
          {{ t("my.cancel") }}
        </Button>
      </div>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { reactive, watch } from "vue";
import { useI18n } from "vue-i18n";
import Button from "../ui/Button.vue";
import Card from "../ui/Card.vue";
import Input from "../ui/Input.vue";

interface WishlistItemForm {
  title: string;
  url?: string;
  price_eur?: number;
  notes?: string;
  priority?: number;
}

interface WishlistItemInitial {
  title: string;
  url?: string | null;
  price_eur?: number | null;
  notes?: string | null;
  priority?: number | null;
}

const props = withDefaults(
  defineProps<{
    initialItem: WishlistItemInitial;
    loading?: boolean;
  }>(),
  {
    loading: false,
  },
);

const emit = defineEmits<{
  save: [WishlistItemForm];
  cancel: [];
}>();

const form = reactive<WishlistItemForm>({
  title: "",
  url: "",
  price_eur: undefined,
  notes: "",
  priority: undefined,
});

watch(
  () => props.initialItem,
  (val) => {
    form.title = val?.title ?? "";
    form.url = val?.url ?? "";
    form.price_eur = val?.price_eur ?? undefined;
    form.notes = val?.notes ?? "";
    form.priority = val?.priority ?? undefined;
  },
  { immediate: true, deep: true },
);

const { t } = useI18n();

const emitSave = () => {
  emit("save", {
    title: form.title,
    url: form.url || undefined,
    price_eur: form.price_eur,
    notes: form.notes || undefined,
    priority: form.priority,
  });
};

const emitCancel = () => emit("cancel");
</script>
