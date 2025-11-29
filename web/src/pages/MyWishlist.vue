<template>
  <h1 class="text-xl font-semibold mb-4">{{ t("my.title") }}</h1>

  <Card class="mb-4">
    <template #header
      ><h2 class="font-semibold">{{ t("my.addTitle") }}</h2></template
    >
    <form @submit.prevent="add" class="grid gap-3 sm:grid-cols-2">
      <Input
        v-model="form.title"
        name="title"
        data-test="item-title"
        :label="t('my.form.title')"
        required
      />
      <Input
        v-model="form.url"
        name="url"
        data-test="item-url"
        :label="t('my.form.url')"
      />
      <Input
        v-model.number="form.price_eur"
        name="price_eur"
        data-test="item-price"
        type="number"
        step="5"
        min="0"
        :max="1000000"
        :label="t('my.form.price')"
      />

      <Input
        v-model.number="form.priority"
        name="priority"
        data-test="item-priority"
        type="number"
        :label="t('my.form.priority')"
      />
      <div class="sm:col-span-2">
        <label class="block text-sm mb-1" for="notes">{{
          t("my.form.notes")
        }}</label>
        <textarea
          v-model="form.notes"
          name="notes"
          data-test="item-notes"
          rows="3"
          class="w-full rounded-lg border-zinc-300 bg-white text-sm focus:ring-brand-500 focus:border-brand-500"
          placeholder="Notes"
        ></textarea>
      </div>
      <div class="sm:col-span-2">
        <Button
          variant="primary"
          type="submit"
          data-test="wishlist-add-submit"
          :loading="submitting"
          >{{ t("my.addBtn") }}</Button
        >
      </div>
    </form>
  </Card>

  <div v-if="items.length === 0" class="text-zinc-600">
    {{ t("my.empty") }}
  </div>

  <ul class="grid gap-3">
    <li
      v-for="it in items"
      :key="it.id"
      data-test="wishlist-item"
      :data-title="it.original_title || it.title"
      :data-id="it.id"
    >
      <WishlistItemEditor
        v-if="editingId === it.id"
        :initial-item="it"
        :loading="editSubmitting"
        @save="(payload) => saveEdit(it.id, payload)"
        @cancel="cancelEdit"
      />
      <WishlistItemCard
        v-else
        :item="it"
        @edit="beginEdit(it)"
        @delete="removeItem(it.id)"
      />
    </li>
  </ul>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { api } from "../services/api";
import Card from "../components/ui/Card.vue";
import Button from "../components/ui/Button.vue";
import Input from "../components/ui/Input.vue";
import { useToasts } from "../components/ui/useToasts";
import { useI18n } from "vue-i18n";
import WishlistItemCard from "../components/wishlist/WishlistItemCard.vue";
import WishlistItemEditor from "../components/wishlist/WishlistItemEditor.vue";

const { push } = useToasts();
const { t } = useI18n();

interface WishlistItemForm {
  title: string;
  url?: string;
  price_eur?: number;
  notes?: string;
  priority?: number;
}

const items = ref<any[]>([]);
const submitting = ref(false);
const editSubmitting = ref(false);
const form = reactive({
  title: "",
  url: "",
  price_eur: undefined as number | undefined,
  notes: "",
  priority: 3,
});
const editingId = ref<string | null>(null);

function normalizeItem(item: any) {
  return { ...item, original_title: item.original_title ?? item.title };
}

async function load() {
  const data = await api.getMyWishlist();
  items.value = (data.items ?? []).map(normalizeItem);
}

async function add() {
  submitting.value = true;
  try {
    const created = await api.addMyItem({
      title: form.title || "",
      url: form.url || undefined,
      price_eur: form.price_eur,
      notes: form.notes || undefined,
      priority: form.priority,
    });

    items.value.unshift(normalizeItem(created));
    form.title = "";
    form.url = "";
    form.price_eur = undefined;
    form.notes = "";
    form.priority = 3;
    push(t("toast.added"), "success");
  } catch (e: any) {
    push(e?.message || t("toast.error"), "error");
  } finally {
    submitting.value = false;
  }
}

async function removeItem(id: string) {
  await api.deleteMyItem(id);
  items.value = items.value.filter((i) => i.id !== id);
  push(t("toast.removed"), "info");
}

function beginEdit(item: any) {
  editingId.value = item.id;
}

function cancelEdit() {
  editingId.value = null;
  editSubmitting.value = false;
}

async function saveEdit(id: string, form: WishlistItemForm) {
  if (!form.title?.trim()) {
    push(t("my.validation.titleRequired"), "error");
    return;
  }

  editingId.value = id;
  editSubmitting.value = true;
  try {
    const updated = await api.updateMyItem(id, {
      title: form.title.trim(),
      url: form.url || undefined,
      price_eur: form.price_eur,
      notes: form.notes || undefined,
      priority: form.priority,
    });
    items.value = items.value.map((it) =>
      it.id === id
        ? normalizeItem({ ...it, ...updated, original_title: it.original_title })
        : it,
    );
    push(t("toast.updated"), "success");
    cancelEdit();
  } catch (e: any) {
    push(e?.message || t("toast.error"), "error");
  } finally {
    editSubmitting.value = false;
  }
}

onMounted(load);
</script>
