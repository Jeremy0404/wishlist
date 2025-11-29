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
      :data-title="it.title"
      :data-id="it.id"
    >
      <Card>
        <div v-if="editingId === it.id" class="grid gap-3 sm:grid-cols-2">
          <Input
            v-model="editForm.title"
            name="title"
            :label="t('my.form.title')"
            required
          />
          <Input
            v-model="editForm.url"
            name="url"
            :label="t('my.form.url')"
          />
          <Input
            v-model.number="editForm.price_eur"
            name="price_eur"
            type="number"
            step="5"
            min="0"
            :max="1000000"
            :label="t('my.form.price')"
          />

          <Input
            v-model.number="editForm.priority"
            name="priority"
            type="number"
            :label="t('my.form.priority')"
          />
          <div class="sm:col-span-2">
            <label class="block text-sm mb-1" for="notes">{{
              t("my.form.notes")
            }}</label>
            <textarea
              v-model="editForm.notes"
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
              :loading="editSubmitting"
              @click="saveEdit"
              >{{ t("my.save") }}</Button
            >
            <Button
              variant="ghost"
              type="button"
              data-test="wishlist-edit-cancel"
              @click="cancelEdit"
              >{{ t("my.cancel") }}</Button
            >
          </div>
        </div>
        <div v-else class="flex items-start justify-between gap-3">
          <div>
            <div class="font-medium">
              {{ it.title }}
              <span v-if="it.priority" class="text-xs text-zinc-500"
                >P{{ it.priority }}</span
              >
            </div>
            <div v-if="it.url" class="text-sm text-brand-700">
              <a :href="it.url" target="_blank">{{ it.url }}</a>
            </div>
            <div v-if="it.price_eur != null" class="text-sm text-zinc-600">
              {{ fmtEUR.format(it.price_eur) }}
            </div>
            <div
              v-if="it.notes"
              class="text-sm text-zinc-700 whitespace-pre-wrap mt-1"
            >
              {{ it.notes }}
            </div>
          </div>
          <div class="flex flex-col gap-2">
            <Button
              variant="ghost"
              data-test="wishlist-edit"
              @click="beginEdit(it)"
              >{{ t("my.edit") }}</Button
            >
            <Button
              variant="ghost"
              data-test="wishlist-delete"
              @click="removeItem(it.id)"
              >{{ t("my.delete") }}</Button
            >
          </div>
        </div>
      </Card>
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
import { fmtEUR } from "../utils/money.ts";

const { push } = useToasts();
const { t } = useI18n();

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
const editForm = reactive({
  title: "",
  url: "",
  price_eur: undefined as number | undefined,
  notes: "",
  priority: undefined as number | undefined,
});

async function load() {
  const data = await api.getMyWishlist();
  items.value = data.items ?? [];
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

    items.value.unshift(created);
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
  editForm.title = item.title ?? "";
  editForm.url = item.url ?? "";
  editForm.price_eur = item.price_eur ?? undefined;
  editForm.notes = item.notes ?? "";
  editForm.priority = item.priority ?? undefined;
}

function cancelEdit() {
  editingId.value = null;
  editSubmitting.value = false;
}

async function saveEdit() {
  if (!editingId.value) return;
  if (!editForm.title.trim()) {
    push(t("my.validation.titleRequired"), "error");
    return;
  }
  editSubmitting.value = true;
  try {
    const updated = await api.updateMyItem(editingId.value, {
      title: editForm.title.trim(),
      url: editForm.url || undefined,
      price_eur: editForm.price_eur,
      notes: editForm.notes || undefined,
      priority: editForm.priority,
    });
    items.value = items.value.map((it) =>
      it.id === editingId.value ? { ...it, ...updated } : it,
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
